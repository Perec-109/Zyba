/**
 * CAMERA_PATH — сплайн, по которому летит камера по мере скролла.
 * progress: 0..1 — от витрины (0) до окна-ниши (1).
 */
const CAMERA_PATH = (() => {

  function build() {
    // Точки положения камеры (walk-through высота ~1.6м)
    const posPoints = [
      new THREE.Vector3(0, 1.6, 4.5),
      new THREE.Vector3(2.15, 1.52, -18.3),
      new THREE.Vector3(-0.45, 1.58, -40.2),
      new THREE.Vector3(0.65, 1.58, -62.5),
      new THREE.Vector3(0.8, 1.5, -87.2),
    ];

    // Точки взгляда (look-at target), чуть впереди по маршруту
    const lookPoints = [
      new THREE.Vector3(0, 1.72, -7),
      new THREE.Vector3(-1.55, 1.48, -22),
      new THREE.Vector3(3.15, 1.9, -44),
      new THREE.Vector3(-0.25, 1.42, -68),
      new THREE.Vector3(-0.25, 1.72, -94),
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
    const pos = curves.posCurve.getPoint(clamped);
    const look = curves.lookCurve.getPoint(clamped);

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
