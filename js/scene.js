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

  async function init() {
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180e0a);
    scene.fog = new THREE.FogExp2(0x180e0a, settings.fogDensity * 0.72);

    camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 120
    );

    /* ---------- Свет ---------- */
    const ambient = new THREE.AmbientLight(0x8a6650, 0.38);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffe6bd, 0x140a06, 0.56);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffdfb0, 0.82);
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

    const entranceGlow = new THREE.PointLight(0xffc47a, 0.75, 18, 2);
    entranceGlow.position.set(-2.5, 3.8, 2);
    scene.add(entranceGlow);

    /* ---------- Сборка кофейни ---------- */
    const refs = await CAFE_BUILDER.build(scene, settings);

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
