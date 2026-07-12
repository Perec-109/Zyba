/**
 * PERF — определяет "тир" качества сцены под устройство.
 * Задача: на телефоне сцена должна ГРУЗИТЬСЯ и не лагать,
 * поэтому агрессивно урезаем pixel ratio, тени, частицы, геометрию.
 */
const PERF = (() => {
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const isMobile = isMobileUA || (isSmallScreen && isTouch);

  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4; // GB, undefined on many browsers -> default 4
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // save-data header hint (some mobile browsers expose this)
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  let tier = 'high';
  if (isMobile || cores <= 4 || mem <= 4 || saveData) tier = 'low';
  else if (cores <= 6 || mem <= 6) tier = 'mid';

  const TIERS = {
    high: {
      pixelRatioCap: 2,
      shadows: true,
      shadowMapSize: 1024,
      steamParticles: 90,
      dustParticles: 140,
      plantDetail: 3,
      antialias: true,
      fogDensity: 0.028,
    },
    mid: {
      pixelRatioCap: 1.5,
      shadows: true,
      shadowMapSize: 512,
      steamParticles: 45,
      dustParticles: 60,
      plantDetail: 2,
      antialias: true,
      fogDensity: 0.032,
    },
    low: {
      pixelRatioCap: 1,
      shadows: false,
      shadowMapSize: 0,
      steamParticles: 18,
      dustParticles: 24,
      plantDetail: 1,
      antialias: false,
      fogDensity: 0.04,
    }
  };

  return {
    isMobile,
    isTouch,
    prefersReducedMotion,
    tier,
    settings: TIERS[tier],
  };
})();
