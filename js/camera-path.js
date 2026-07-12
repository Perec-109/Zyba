/**
 * CAMERA_PATH — сплайн, по которому летит камера по мере скролла.
 * progress: 0..1 — от витрины (0) до окна-ниши (1).
 */
const CAMERA_PATH = (() => {

  function build() {
    // Точки положения камеры (walk-through высота ~1.6м)
    const posPoints = [
      new THREE.Vector3(0, 1.6, 4.5),     // старт — снаружи витрины
      new THREE.Vector3(0, 1.6, -1),      // входим
      new THREE.Vector3(-1.6, 1.55, -10), // подходим к бару
      new THREE.Vector3(-2.2, 1.5, -21),  // у бара
      new THREE.Vector3(-1.0, 1.55, -33), // движемся к меню
      new THREE.Vector3(0.4, 1.55, -44),  // у меню
      new THREE.Vector3(1.2, 1.6, -56),   // в зал
      new THREE.Vector3(-1.0, 1.6, -66),  // между столиками
      new THREE.Vector3(0.6, 1.55, -76),  // к нише
      new THREE.Vector3(1.0, 1.5, -85),   // сбоку от дивана, безопасный коридор
      new THREE.Vector3(0.8, 1.5, -88.5), // финал — до дивана и окна, без клиппинга
    ];

    // Точки взгляда (look-at target), чуть впереди по маршруту
    const lookPoints = [
      new THREE.Vector3(0, 1.7, -2),
      new THREE.Vector3(0, 1.7, -8),
      new THREE.Vector3(-2.4, 1.5, -18),
      new THREE.Vector3(-1.6, 1.6, -24),
      new THREE.Vector3(-1.0, 1.9, -40),
      new THREE.Vector3(0.6, 1.8, -46),
      new THREE.Vector3(0.6, 1.6, -60),
      new THREE.Vector3(0, 1.5, -70),
      new THREE.Vector3(0.3, 1.6, -80),
      new THREE.Vector3(0.2, 1.7, -90),
      new THREE.Vector3(0, 1.85, -93),
    ];

    const posCurve = new THREE.CatmullRomCurve3(posPoints, false, 'catmullrom', 0.4);
    const lookCurve = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.4);

    return { posCurve, lookCurve };
  }

  /**
   * Применяет положение камеры на кривой к прогрессу t (0..1),
   * с лёгким покачиванием (handheld-walk feel), которое можно отключить.
   */
  function applyToCamera(camera, curves, t, wobbleTime, enableWobble) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    const pos = curves.posCurve.getPointAt(clamped);
    const look = curves.lookCurve.getPointAt(clamped);

    let wobbleX = 0, wobbleY = 0;
    if (enableWobble) {
      wobbleX = Math.sin(wobbleTime * 0.9) * 0.012;
      wobbleY = Math.sin(wobbleTime * 1.3) * 0.008;
    }

    camera.position.set(pos.x + wobbleX, pos.y + wobbleY, pos.z);
    camera.lookAt(look.x + wobbleX, look.y + wobbleY, look.z);
  }

  return { build, applyToCamera };
})();
