/**
 * UI — связывает скролл страницы с прогрессом камеры (0..1),
 * управляет индикатором пути, появлением текстовых панелей и кнопками.
 */
const UI = (() => {

  function initScrollProgress() {
    const content = document.getElementById('scroll-content');
    const journeyFill = document.getElementById('journeyFill');
    const dots = Array.from(document.querySelectorAll('.jd'));
    const stations = Array.from(document.querySelectorAll('.station'));

    function computeProgress() {
      const scrollTop = window.scrollY;
      const maxScroll = content.offsetHeight - window.innerHeight;
      const t = maxScroll > 0 ? scrollTop / maxScroll : 0;
      return THREE.MathUtils.clamp(t, 0, 1);
    }

    function update() {
      const t = computeProgress();
      SCENE.setScrollProgress(t);

      if (journeyFill) journeyFill.style.height = (t * 100) + '%';

      const activeIdx = Math.round(t * (stations.length - 1));
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
      stations.forEach((station, i) => station.classList.toggle('active-station', i === activeIdx));
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  function initPanelReveal() {
    const panels = document.querySelectorAll('.panel');
    if (!('IntersectionObserver' in window)) {
      panels.forEach(p => p.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.35 });
    panels.forEach(p => io.observe(p));
  }

  function initCtaScroll() {
    const btn = document.getElementById('ctaScroll');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const barStation = document.getElementById('s-bar');
      if (barStation) barStation.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function initOrderShortcuts() {
    const menu = document.getElementById('s-menu');
    const topOrder = document.getElementById('topOrder');
    const contactOrder = document.getElementById('contactOrder');
    if (topOrder && menu) topOrder.addEventListener('click', () => menu.scrollIntoView({ behavior: 'smooth' }));
    if (contactOrder) contactOrder.addEventListener('click', () => document.getElementById('orderDialog')?.showModal());
  }

  function initSoundToggle() {
    const btn = document.getElementById('soundToggle');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const isOn = await SOUND.toggle();
      btn.setAttribute('aria-pressed', String(isOn));
      btn.setAttribute('aria-label', isOn ? 'Выключить атмосферу кофейни' : 'Включить атмосферу кофейни');
      btn.title = isOn ? 'Атмосфера включена' : 'Включить звук';
      btn.disabled = false;
    });
  }

  function initVisibilityPause() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) SCENE.pause();
      else SCENE.resume();
    });
  }

  function init() {
    initScrollProgress();
    initCtaScroll();
    initOrderShortcuts();
    initSoundToggle();
    initVisibilityPause();
  }

  return { init };
})();
