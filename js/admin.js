(() => {
  const API_URL = 'https://zyba-orders-api.perec.workers.dev';
  const STATUS_LABELS = { new: 'Новый', accepted: 'Принят', ready: 'Готов', completed: 'Выдан', cancelled: 'Отменён' };
  const NEXT_STATUS = { new: 'accepted', accepted: 'ready', ready: 'completed' };
  const NEXT_LABEL = { new: 'Принять заказ', accepted: 'Отметить готовым', ready: 'Выдать гостю' };
  const loginCard = document.getElementById('loginCard');
  const dashboard = document.getElementById('dashboard');
  const loginMessage = document.getElementById('loginMessage');
  const dashboardMessage = document.getElementById('dashboardMessage');
  const ordersEl = document.getElementById('orders');
  const statsEl = document.getElementById('stats');
  let token = sessionStorage.getItem('zybaAdminToken') || '';
  let currentStatus = '';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const money = (value) => `${Number(value).toLocaleString('ru-RU')} ₽`;
  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка API');
    return data;
  }
  function renderOrders(orders, stats) {
    statsEl.innerHTML = `<div class="stat"><span>Новые</span><strong>${Number(stats.new_count || 0)}</strong><small>ждут подтверждения</small></div><div class="stat"><span>В работе</span><strong>${Number(stats.active_count || 0)}</strong><small>${Number(stats.ready_count || 0)} готовы к выдаче</small></div><div class="stat"><span>Выручка</span><strong>${money(stats.completed_revenue || 0)}</strong><small>только выданные заказы</small></div>`;
    ordersEl.innerHTML = orders.length ? orders.map((order) => `
      <article class="order status-${order.status}">
        <div><span class="order-number">${escapeHtml(order.order_number)}</span><span class="status-badge badge-${order.status}">${STATUS_LABELS[order.status]}</span><time>${new Date(order.created_at).toLocaleString('ru-RU')}</time></div>
        <div class="customer"><strong>${escapeHtml(order.customer_name)}</strong><a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>${order.note ? `<p>${escapeHtml(order.note)}</p>` : ''}<div class="order-items">${order.items.map((item) => `<div class="order-item"><span>${escapeHtml(item.name)} × ${item.quantity}</span><span>${money(item.subtotal)}</span></div>`).join('')}</div></div>
        <div class="order-side"><div class="order-total">${money(order.total)}</div><div class="order-actions">${NEXT_STATUS[order.status] ? `<button data-order-id="${escapeHtml(order.id)}" data-next-status="${NEXT_STATUS[order.status]}">${NEXT_LABEL[order.status]}</button>` : ''}${!['completed','cancelled'].includes(order.status) ? `<button class="cancel-action" data-order-id="${escapeHtml(order.id)}" data-next-status="cancelled">Отменить</button>` : ''}</div></div>
      </article>`).join('') : '<p>Заказов с таким статусом пока нет.</p>';
  }
  async function loadOrders() {
    dashboardMessage.textContent = 'Обновляем…';
    try {
      const query = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : '';
      const { orders, stats } = await api(`/api/admin/orders${query}`);
      renderOrders(orders, stats); dashboardMessage.textContent = '';
      loginCard.hidden = true; dashboard.hidden = false; document.getElementById('logoutButton').hidden = false;
    } catch (error) {
      dashboardMessage.textContent = error.message;
      if (/токен/i.test(error.message)) { sessionStorage.removeItem('zybaAdminToken'); token = ''; loginCard.hidden = false; dashboard.hidden = true; }
      throw error;
    }
  }
  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); token = document.getElementById('tokenInput').value.trim(); loginMessage.textContent = 'Проверяем…';
    try { await loadOrders(); sessionStorage.setItem('zybaAdminToken', token); loginMessage.textContent = ''; }
    catch (error) { loginMessage.textContent = error.message; }
  });
  document.getElementById('filters').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-status]'); if (!button) return;
    currentStatus = button.dataset.status; document.querySelectorAll('[data-status]').forEach((item) => item.classList.toggle('active', item === button));
    try { await loadOrders(); } catch {}
  });
  ordersEl.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-order-id][data-next-status]'); if (!button) return;
    button.disabled = true;
    try { await api(`/api/admin/orders/${encodeURIComponent(button.dataset.orderId)}`, { method: 'PATCH', body: JSON.stringify({ status: button.dataset.nextStatus }) }); await loadOrders(); }
    catch (error) { dashboardMessage.textContent = error.message; }
    finally { button.disabled = false; }
  });
  document.getElementById('refreshButton').addEventListener('click', () => loadOrders().catch(() => {}));
  document.getElementById('logoutButton').addEventListener('click', () => { token = ''; sessionStorage.removeItem('zybaAdminToken'); dashboard.hidden = true; loginCard.hidden = false; document.getElementById('logoutButton').hidden = true; });
  if (token) loadOrders().catch(() => {});
})();
