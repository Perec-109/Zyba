const CATALOG = Object.freeze({
  espresso: { name: 'Эспрессо', price: 180 },
  'flat-white': { name: 'Флэт уайт', price: 280 },
  v60: { name: 'Фильтр V60', price: 260 },
  'oat-raf': { name: 'Раф на овсяном', price: 320 },
  'almond-croissant': { name: 'Круассан миндальный', price: 220 },
});
const STATUSES = new Set(['new', 'accepted', 'ready', 'completed', 'cancelled']);
const ALLOWED_ORIGINS = new Set(['https://perec-109.github.io', 'http://127.0.0.1:4173', 'http://localhost:4173']);

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  return origin && ALLOWED_ORIGINS.has(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  } : {};
}
function json(request, data, status = 200) {
  return Response.json(data, { status, headers: { ...corsHeaders(request), 'Cache-Control': 'no-store' } });
}
function cleanText(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function safeEqual(left, right) {
  const a = new TextEncoder().encode(left || '');
  const b = new TextEncoder().encode(right || '');
  let result = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) result |= (a[i % (a.length || 1)] || 0) ^ (b[i % (b.length || 1)] || 0);
  return result === 0;
}
function isAdmin(request, env) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') && safeEqual(header.slice(7), env.ADMIN_TOKEN);
}
async function readJson(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 20_000) throw new Error('Слишком большой запрос');
  return request.json();
}
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) throw new Error('Добавьте позиции в заказ');
  return items.map((item) => {
    const product = CATALOG[item?.sku];
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error('Некорректная позиция заказа');
    return { sku: item.sku, name: product.name, price: product.price, quantity, subtotal: product.price * quantity };
  });
}
function orderNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  const random = crypto.getRandomValues(new Uint8Array(3));
  return `ZYB-${date}-${[...random].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

async function createOrder(request, env) {
  let body;
  try { body = await readJson(request); } catch (error) { return json(request, { error: error.message || 'Некорректный JSON' }, 400); }
  const name = cleanText(body.name, 80);
  const phone = cleanText(body.phone, 24);
  const note = cleanText(body.note, 500);
  if (name.length < 2) return json(request, { error: 'Укажите имя' }, 400);
  if (!/^[+\d][\d\s()\-]{6,23}$/.test(phone)) return json(request, { error: 'Проверьте номер телефона' }, 400);
  let items;
  try { items = normalizeItems(body.items); } catch (error) { return json(request, { error: error.message }, 400); }
  const id = crypto.randomUUID();
  const number = orderNumber();
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO orders
    (id, order_number, customer_name, phone, note, items_json, total, status, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'new', ?8, ?8)`)
    .bind(id, number, name, phone, note, JSON.stringify(items), total, now).run();
  console.log(JSON.stringify({ event: 'order.created', orderId: id, orderNumber: number, total }));
  return json(request, { ok: true, orderNumber: number, total }, 201);
}
async function listOrders(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 100, 1), 200);
  const query = status && STATUSES.has(status)
    ? env.DB.prepare('SELECT * FROM orders WHERE status = ?1 ORDER BY created_at DESC LIMIT ?2').bind(status, limit)
    : env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?1').bind(limit);
  const statsQuery = env.DB.prepare(`SELECT
    COUNT(*) AS total_count,
    SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
    SUM(CASE WHEN status IN ('new','accepted','ready') THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready_count,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) AS completed_revenue
    FROM orders`);
  const [result, statsResult] = await env.DB.batch([query, statsQuery]);
  const orders = result.results.map((row) => ({ ...row, items: JSON.parse(row.items_json), items_json: undefined }));
  return json(request, { orders, stats: statsResult.results[0] });
}
async function updateOrder(request, env, id) {
  let body;
  try { body = await readJson(request); } catch { return json(request, { error: 'Некорректный JSON' }, 400); }
  if (!STATUSES.has(body.status)) return json(request, { error: 'Некорректный статус' }, 400);
  const result = await env.DB.prepare('UPDATE orders SET status = ?1, updated_at = ?2 WHERE id = ?3')
    .bind(body.status, new Date().toISOString(), id).run();
  if (!result.meta.changes) return json(request, { error: 'Заказ не найден' }, 404);
  console.log(JSON.stringify({ event: 'order.status_changed', orderId: id, status: body.status }));
  return json(request, { ok: true });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/health' && request.method === 'GET') return json(request, { ok: true });
      if (url.pathname === '/api/orders' && request.method === 'POST') return await createOrder(request, env);
      if (url.pathname.startsWith('/api/admin/')) {
        if (!isAdmin(request, env)) return json(request, { error: 'Неверный токен администратора' }, 401);
        if (url.pathname === '/api/admin/orders' && request.method === 'GET') return await listOrders(request, env);
        const match = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
        if (match && request.method === 'PATCH') return await updateOrder(request, env, decodeURIComponent(match[1]));
      }
      return json(request, { error: 'Маршрут не найден' }, 404);
    } catch (error) {
      console.error(JSON.stringify({ event: 'request.failed', path: url.pathname, message: error.message }));
      return json(request, { error: 'Внутренняя ошибка сервера' }, 500);
    }
  },
};
