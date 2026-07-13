(() => {
  const API_URL = 'https://zyba-orders-api.perec.workers.dev';
  const catalog = {
    espresso: { name: 'Эспрессо', price: 180 },
    'flat-white': { name: 'Флэт уайт', price: 280 },
    v60: { name: 'Фильтр V60', price: 260 },
    'oat-raf': { name: 'Раф на овсяном', price: 320 },
    'almond-croissant': { name: 'Круассан миндальный', price: 220 },
  };
  const cart = new Map();
  const dialog = document.getElementById('orderDialog');
  const form = document.getElementById('orderForm');
  const itemsEl = document.getElementById('cartItems');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('orderTotal');
  const messageEl = document.getElementById('orderMessage');

  function formatPrice(value) { return `${value.toLocaleString('ru-RU')} ₽`; }
  function cartEntries() { return [...cart].filter(([, quantity]) => quantity > 0); }
  function render() {
    const entries = cartEntries();
    const totalCount = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
    const total = entries.reduce((sum, [sku, quantity]) => sum + catalog[sku].price * quantity, 0);
    countEl.textContent = totalCount;
    totalEl.textContent = formatPrice(total);
    itemsEl.innerHTML = entries.length ? entries.map(([sku, quantity]) => `
      <div class="cart-row">
        <div><div>${catalog[sku].name}</div><small>${formatPrice(catalog[sku].price)}</small></div>
        <div class="cart-controls"><button type="button" data-cart="minus" data-sku="${sku}">−</button><span>${quantity}</span><button type="button" data-cart="plus" data-sku="${sku}">+</button></div>
        <strong>${formatPrice(catalog[sku].price * quantity)}</strong>
      </div>`).join('') : '<p>Корзина пока пустая. Добавьте что-нибудь из меню.</p>';
  }

  document.querySelectorAll('.menu-add').forEach((button) => button.addEventListener('click', () => {
    const sku = button.dataset.sku;
    cart.set(sku, (cart.get(sku) || 0) + 1);
    render();
    button.textContent = '✓';
    setTimeout(() => { button.textContent = '+'; }, 600);
  }));
  document.getElementById('orderOpen').addEventListener('click', () => { messageEl.textContent = ''; dialog.showModal(); render(); });
  document.getElementById('orderClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  itemsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart]');
    if (!button) return;
    const change = button.dataset.cart === 'plus' ? 1 : -1;
    cart.set(button.dataset.sku, Math.max(0, (cart.get(button.dataset.sku) || 0) + change));
    render();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const entries = cartEntries();
    if (!entries.length) { messageEl.textContent = 'Сначала добавьте позиции в заказ.'; return; }
    const submit = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    submit.disabled = true;
    messageEl.textContent = 'Отправляем заказ…';
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), phone: data.get('phone'), note: data.get('note'), items: entries.map(([sku, quantity]) => ({ sku, quantity })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Не удалось оформить заказ');
      cart.clear(); render(); form.reset();
      messageEl.textContent = `Готово! Номер заказа ${result.orderNumber}. Мы скоро свяжемся.`;
    } catch (error) { messageEl.textContent = error.message; }
    finally { submit.disabled = false; }
  });
  render();
})();
