(() => {
  const API_URL = 'https://zyba-orders-api.perec.workers.dev';
  const STATUS_LABELS = { new: 'Новый', accepted: 'Принят', ready: 'Готов', completed: 'Выдан', cancelled: 'Отменён' };
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
  function renderOrders(orders) {
    const newCount = orders.filter((order) => order.status === 'new').length;
    const activeCount = orders.filter((order) => ['new', 'accepted', 'ready'].includes(order.status)).length;
    const revenue = orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total), 0);
    statsEl.innerHTML = `<div class="stat">Новые<strong>${newCount}</strong></div><div class="stat">В работе<strong>${activeCount}</strong></div><div class="stat">Сумма заказов<strong>${money(revenue)}</strong></div>`;
    ordersEl.innerHTML = orders.length ? orders.map((order) => `
      <article class="order status-${order.status}">
        <div><span class="order-number">${escapeHtml(order.order_number)}</span><time>${new Date(order.created_at).toLocaleString('ru-RU')}</time></div>
        <div class="customer"><strong>${escapeHtml(order.customer_name)}</strong><a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>${order.note ? `<p>${escapeHtml(order.note)}</p>` : ''}<div class="order-items">${order.items.map((item) => `<div class="order-item"><span>${escapeHtml(item.name)} × ${item.quantity}</span><span>${money(item.subtotal)}</span></div>`).join('')}</div></div>
        <div class="order-side"><div class="order-total">${money(order.total)}</div><select data-order-id="${escapeHtml(order.id)}" aria-label="Статус заказа">${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${value === order.status ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
      </article>`).join('') : '<p>Заказов с таким статусом пока нет.</p>';
  }
  async function loadOrders() {
    dashboardMessage.textContent = 'Обновляем…';
    try {
      const query = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : '';
      const { orders } = await api(`/api/admin/orders${query}`);
      renderOrders(orders); dashboardMessage.textContent = '';
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
  ordersEl.addEventListener('change', async (event) => {
    const select = event.target.closest('[data-order-id]'); if (!select) return;
    select.disabled = true;
    try { await api(`/api/admin/orders/${encodeURIComponent(select.dataset.orderId)}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); await loadOrders(); }
    catch (error) { dashboardMessage.textContent = error.message; }
    finally { select.disabled = false; }
  });
  document.getElementById('refreshButton').addEventListener('click', () => loadOrders().catch(() => {}));
  document.getElementById('logoutButton').addEventListener('click', () => { token = ''; sessionStorage.removeItem('zybaAdminToken'); dashboard.hidden = true; loginCard.hidden = false; document.getElementById('logoutButton').hidden = true; });
  if (token) loadOrders().catch(() => {});
})();
