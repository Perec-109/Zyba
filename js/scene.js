/**
 * SCENE — рендерер, камера, свет. Настройки качества берутся из PERF.settings,
 * поэтому на телефоне сцена рендерится в меньшем разрешении, без теней и с меньшим
 * числом частиц — грузится и держит FPS.
 */
const SCENE = (() => {
  let renderer, camera, scene, clock;
  let steamSystem, dustSystem;
  let curves;
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  let running = false;

  function init() {
    const canvas = document.getElementById('scene-canvas');
    const settings = PERF.settings;

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.antialias,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatioCap));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = settings.shadows;
    if (settings.shadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // three.js r128 использует outputEncoding (не outputColorSpace из новых версий)
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a100c);
    scene.fog = new THREE.FogExp2(0x1a100c, settings.fogDensity);

    camera = new THREE.PerspectiveCamera(
      55, window.innerWidth / window.innerHeight, 0.1, 120
    );

    /* ---------- Свет ---------- */
    const ambient = new THREE.AmbientLight(0x8a6a52, 0.55);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffe9c7, 0x1a0f08, 0.45);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff0d0, 0.7);
    keyLight.position.set(3, 6, 4);
    if (settings.shadows) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -8;
      keyLight.shadow.camera.right = 8;
      keyLight.shadow.camera.top = 8;
      keyLight.shadow.camera.bottom = -8;
    }
    scene.add(keyLight);

    /* ---------- Сборка кофейни ---------- */
    const refs = CAFE_BUILDER.build(scene, settings);

    /* ---------- Частицы ---------- */
    steamSystem = PARTICLES.makeSteamSystem(refs.steamOrigins, settings.steamParticles);
    if (steamSystem) scene.add(steamSystem.points);

    dustSystem = PARTICLES.makeDustSystem(settings.dustParticles, { width: 9, height: 4, depth: 96 });
    if (dustSystem) scene.add(dustSystem.points);

    /* ---------- Путь камеры ---------- */
    curves = CAMERA_PATH.build();
    CAMERA_PATH.applyToCamera(camera, curves, 0, 0, false);

    clock = new THREE.Clock();

    window.addEventListener('resize', onResize, { passive: true });
    onResize();

    running = true;
    requestAnimationFrame(loop);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PERF.settings.pixelRatioCap));
  }

  function setScrollProgress(t) {
    targetScrollProgress = t;
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);

    const t = clock.getElapsedTime();

    // сглаживание прогресса скролла — камера "догоняет" плавно, без рывков
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

    CAMERA_PATH.applyToCamera(camera, curves, scrollProgress, t, !PERF.prefersReducedMotion);

    if (steamSystem) steamSystem.update(t);
    if (dustSystem) dustSystem.update(t);

    renderer.render(scene, camera);
  }

  function pause() { running = false; }
  function resume() {
    if (running) return;
    running = true;
    clock.getDelta(); // сброс, чтобы не скакнуло время
    requestAnimationFrame(loop);
  }

  return { init, setScrollProgress, pause, resume };
})();
