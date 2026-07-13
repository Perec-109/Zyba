/**
 * MAIN — оркестрирует загрузку: прогресс-бар, инициализация Three.js сцены
 * (тяжёлая часть) и UI, затем скрывает лоадер.
 */
(function () {
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loaderBar');

  function setProgress(pct) {
    if (loaderBar) loaderBar.style.width = pct + '%';
  }

  function hideLoader() {
    if (!loader) return;
    loader.classList.add('hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 800);
  }

  async function boot() {
    setProgress(15);

    // ждём шрифты, чтобы верстка не прыгала (с таймаутом на случай медленной сети)
    try {
      await Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise((res) => setTimeout(res, 1200)),
      ]);
    } catch (e) { /* игнорируем — не критично */ }
    setProgress(45);

    // тяжёлая часть — сборка 3D сцены. Даём браузеру кадр на отрисовку прогресса.
    await new Promise((res) => requestAnimationFrame(res));
    setProgress(65);

    try {
      await SCENE.init();
    } catch (err) {
      console.error('3D scene failed to init:', err);
      // graceful fallback: скрываем канвас, сайт остаётся читаемым как обычная страница
      const canvas = document.getElementById('scene-canvas');
      if (canvas) canvas.style.display = 'none';
      document.body.style.background = 'linear-gradient(180deg,#1a100c,#241510)';
    }
    setProgress(88);

    UI.init();
    setProgress(100);

    setTimeout(hideLoader, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
