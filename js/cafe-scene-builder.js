/** Cafe shell plus downloaded, cached GLB furniture and decor. */
const CAFE_BUILDER = (() => {
  const C = {
    wall: 0x332118, wallAlt: 0x25150f, floor: 0x513321,
    wood: 0x7a4c2c, woodLight: 0xa87345, woodDark: 0x352017,
    cream: 0xeadbc4, brass: 0xc7934d, black: 0x17120f,
    glow: 0xffc875, glass: 0xa8d3ce,
  };

  const mat = (color, options = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? .78,
    metalness: options.metalness ?? .03,
    emissive: options.emissive ?? 0,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1,
  });

  const M = {
    wall: mat(C.wall, { roughness: .98 }),
    wallAlt: mat(C.wallAlt, { roughness: .96 }),
    wood: mat(C.wood, { roughness: .68 }),
    woodLight: mat(C.woodLight, { roughness: .62 }),
    woodDark: mat(C.woodDark, { roughness: .82 }),
    black: mat(C.black, { roughness: .38 }),
    brass: mat(C.brass, { roughness: .3, metalness: .7 }),
    glass: mat(C.glass, { roughness: .12, metalness: .08, transparent: true, opacity: .22 }),
  };

  function mesh(geometry, material, shadows = true) {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = shadows && PERF.settings.shadows;
    object.receiveShadow = true;
    return object;
  }

  const box = (w, h, d, material = M.wood, shadows = true) =>
    mesh(new THREE.BoxGeometry(w, h, d), material, shadows);

  function labelTexture(title, lines = [], dark = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = dark ? '#171713' : '#eadbc4';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = dark ? '#a87345' : '#7a4c2c';
    context.lineWidth = 14;
    context.strokeRect(18, 18, 732, 476);
    context.fillStyle = dark ? '#f0e4d1' : '#25150f';
    context.textAlign = 'center';
    context.font = '600 88px Georgia';
    context.fillText(title, 384, 145);
    context.font = '32px Arial';
    lines.forEach((line, index) => context.fillText(line, 384, 232 + index * 58));
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    return texture;
  }

  function poster(w, h, texture) {
    const group = new THREE.Group();
    group.add(box(w + .12, h + .12, .07, M.woodLight));
    const face = mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture }),
      false
    );
    face.position.z = .041;
    group.add(face);
    return group;
  }

  function windowPane(w, h) {
    const group = new THREE.Group();
    group.add(box(w, h, .025, M.glass, false));
    [
      [w + .12, .08, 0, h / 2], [w + .12, .08, 0, -h / 2],
      [.08, h + .12, -w / 2, 0], [.08, h + .12, w / 2, 0],
      [.055, h, 0, 0], [w, .055, 0, 0],
    ].forEach(([rw, rh, x, y]) => {
      const rail = box(rw, rh, .09, M.woodDark);
      rail.position.set(x, y, .025);
      group.add(rail);
    });
    return group;
  }

  async function addWarmLamp(parent, position, intensity = .68) {
    await MODEL_LIBRARY.add(parent, 'ceilingLamp', {
      position,
      size: .68,
      fitAxis: 'y',
    });
    const light = new THREE.PointLight(C.glow, intensity, 5.2, 2);
    light.position.set(position[0], position[1] - .08, position[2]);
    parent.add(light);
  }

  function buildShell(scene) {
    const floor = box(10, .16, 108, mat(C.floor, { roughness: .86 }));
    floor.position.set(0, -.08, -46);
    scene.add(floor);

    for (let z = 3; z > -99; z -= 3.1) {
      const plank = box(9.65, .018, 2.95, z % 2 ? M.woodDark : M.wood, false);
      plank.position.set(0, .015, z);
      scene.add(plank);
      const seam = box(9.7, .022, .018, M.black, false);
      seam.position.set(0, .028, z - 1.49);
      scene.add(seam);
    }

    const left = box(.25, 5.8, 108, M.wallAlt, false);
    left.position.set(-5, 2.8, -46);
    scene.add(left);
    const right = box(.25, 5.8, 108, M.wall, false);
    right.position.set(5, 2.8, -46);
    scene.add(right);
    const ceiling = box(10.2, .22, 108, M.wallAlt, false);
    ceiling.position.set(0, 5.7, -46);
    scene.add(ceiling);
    const back = box(10, 5.8, .2, M.wall, false);
    back.position.set(0, 2.8, -100);
    scene.add(back);

    for (let z = -8; z > -98; z -= 9) {
      const beam = box(10, .14, .18, M.woodDark);
      beam.position.set(0, 5.5, z);
      scene.add(beam);
    }
  }

  async function buildEntrance(scene) {
    const group = new THREE.Group();
    const facadeZ = -2.45;
    const header = box(9.7, .22, .32, M.woodDark);
    header.position.set(0, 3.16, facadeZ);
    group.add(header);
    const base = box(9.7, .14, .36, M.woodDark);
    base.position.set(0, .08, facadeZ);
    group.add(base);

    [-4.82, -2.22, .42, 1.7, 3.42, 4.82].forEach((x) => {
      const mullion = box(.11, 3.05, .2, M.woodDark);
      mullion.position.set(x, 1.57, facadeZ);
      group.add(mullion);
    });

    const leftWindow = windowPane(2.45, 2.75);
    leftWindow.position.set(-3.52, 1.61, facadeZ);
    group.add(leftWindow);
    const centerWindow = windowPane(2.45, 2.75);
    centerWindow.position.set(-.9, 1.61, facadeZ);
    group.add(centerWindow);
    const rightWindow = windowPane(1.25, 2.75);
    rightWindow.position.set(4.12, 1.61, facadeZ);
    group.add(rightWindow);

    const openSign = poster(.72, .42, labelTexture('OPEN', ['08 — 22']));
    openSign.position.set(4.12, 1.75, facadeZ + .09);
    openSign.scale.setScalar(.72);
    group.add(openSign);
    const sign = poster(2.15, .72, labelTexture('ZYBA', ['COFFEE · ROASTERY']));
    sign.position.set(2.55, 3.75, facadeZ);
    group.add(sign);

    await Promise.all([
      MODEL_LIBRARY.add(group, 'doorway', { position: [2.55, .08, facadeZ + .12], size: 2.8, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'bench', { position: [-3.45, 0, .2], size: 1.72, fitAxis: 'x' }),
      MODEL_LIBRARY.add(group, 'doormat', { position: [2.55, .02, facadeZ + 1], size: 1.35, fitAxis: 'x' }),
      MODEL_LIBRARY.add(group, 'plantLarge', { position: [4.25, 0, -.8], size: 1.15, fitAxis: 'y' }),
    ]);

    scene.add(group);
  }

  async function buildBar(scene) {
    const group = new THREE.Group();
    const z = -22;
    const steamOrigins = [];
    const tasks = [];

    [-3.65, -2.35, -1.05, .25].forEach((x) => {
      tasks.push(MODEL_LIBRARY.add(group, 'bar', {
        position: [x, 0, z],
        size: 1,
        fitAxis: 'y',
        rotation: [0, Math.PI, 0],
      }));
    });

    tasks.push(
      MODEL_LIBRARY.add(group, 'coffeeMachine', { position: [-2.72, 1.02, z - .12], size: .62, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'grinder', { position: [-1.48, 1.02, z - .12], size: .52, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'shelf', { position: [-1.45, 1.55, z - .82], size: 4.25, fitAxis: 'x' }),
      MODEL_LIBRARY.add(group, 'stool', { position: [.6, 0, z + 1.18], size: .8, fitAxis: 'y', rotation: [0, Math.PI, 0] }),
      MODEL_LIBRARY.add(group, 'stool', { position: [-.35, 0, z + 1.18], size: .8, fitAxis: 'y', rotation: [0, Math.PI, 0] }),
      MODEL_LIBRARY.add(group, 'croissant', { position: [-.55, 1.04, z + .3], size: .15, fitAxis: 'max' }),
      MODEL_LIBRARY.add(group, 'muffin', { position: [-.22, 1.04, z + .3], size: .16, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'donut', { position: [.12, 1.04, z + .3], size: .15, fitAxis: 'max' }),
      MODEL_LIBRARY.add(group, 'cake', { position: [.42, 1.04, z + .25], size: .2, fitAxis: 'y' })
    );

    [[-.1, .27], [.4, .18], [-3.55, .31]].forEach(([x, dz]) => {
      tasks.push(MODEL_LIBRARY.add(group, 'coffee', {
        position: [x, 1.03, z + dz],
        size: .14,
        fitAxis: 'y',
      }));
      steamOrigins.push(new THREE.Vector3(x, 1.19, z + dz));
    });

    await Promise.all(tasks);
    await Promise.all([
      addWarmLamp(group, [-3.2, 4.35, z], .62),
      addWarmLamp(group, [-1.45, 4.35, z], .62),
      addWarmLamp(group, [.3, 4.35, z], .62),
    ]);

    const menu = poster(1.55, .95, labelTexture('BAR', ['espresso · filter', 'roasted here']));
    menu.position.set(3.95, 2.15, z - .75);
    group.add(menu);
    scene.add(group);
    return { steamOrigins };
  }

  async function buildMenu(scene) {
    const group = new THREE.Group();
    const z = -44;
    const board = poster(2.8, 1.9, labelTexture('TODAY', [
      'ESPRESSO        180',
      'FLAT WHITE      280',
      'FILTER V60      260',
      'OAT RAF         320',
    ]));
    board.position.set(3.25, 2.05, z);
    group.add(board);

    await Promise.all([
      MODEL_LIBRARY.add(group, 'coffeeBag', { position: [2.45, 0, z + 1.25], size: .82, fitAxis: 'y', rotation: [0, 0, -.07] }),
      MODEL_LIBRARY.add(group, 'coffeeBag', { position: [3.25, 0, z + 1.35], size: .88, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'coffeeBag', { position: [4.05, 0, z + 1.25], size: .8, fitAxis: 'y', rotation: [0, 0, .07] }),
      MODEL_LIBRARY.add(group, 'tableCross', { position: [-3.48, 0, z + .6], size: .76, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'plant2', { position: [-2.1, 0, z + .2], size: 1.05, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'cookie', { position: [-3.7, .78, z + .55], size: .15, fitAxis: 'max' }),
      MODEL_LIBRARY.add(group, 'cupSaucer', { position: [-3.25, .78, z + .55], size: .13, fitAxis: 'y' }),
      addWarmLamp(group, [3.25, 4.35, z + .15], .72),
    ]);

    scene.add(group);
  }

  async function addCafeSet(parent, options) {
    const { x, z, chairs = 2, rotation = 0, laptop = false } = options;
    const tasks = [MODEL_LIBRARY.add(parent, 'tableRound', {
      position: [x, 0, z],
      size: .76,
      fitAxis: 'y',
      rotation: [0, rotation, 0],
    })];

    for (let index = 0; index < chairs; index++) {
      const angle = rotation + index / chairs * Math.PI * 2;
      tasks.push(MODEL_LIBRARY.add(parent, index % 2 ? 'chairRounded' : 'chair', {
        position: [x + Math.cos(angle) * .92, 0, z + Math.sin(angle) * .92],
        size: .82,
        fitAxis: 'y',
        rotation: [0, -angle + Math.PI / 2, 0],
      }));
    }

    tasks.push(MODEL_LIBRARY.add(parent, 'coffee', {
      position: [x + .14, .77, z + .08],
      size: .12,
      fitAxis: 'y',
    }));

    if (laptop) {
      tasks.push(MODEL_LIBRARY.add(parent, 'laptop', {
        position: [x - .18, .77, z - .05],
        size: .38,
        fitAxis: 'x',
        rotation: [0, rotation + .3, 0],
      }));
    }

    await Promise.all(tasks);
  }

  async function buildHall(scene) {
    const group = new THREE.Group();
    const z = -67;
    const sets = [
      { x: -2.8, z: z - 5, chairs: 2, rotation: .2 },
      { x: 2.7, z: z - 4, chairs: 2, rotation: .85, laptop: true },
      { x: -2.7, z: z + 2, chairs: 2, rotation: 1.2 },
      { x: 2.65, z: z + 3, chairs: 3, rotation: 1.8 },
      { x: 0, z: z + 9, chairs: 2, rotation: 2.4 },
    ];

    const tasks = sets.map((set) => addCafeSet(group, set));
    for (let index = 0; index < 3; index++) {
      const windowObject = windowPane(1.7, 2.35);
      windowObject.rotation.y = Math.PI / 2;
      windowObject.position.set(4.86, 1.85, z - 6 + index * 5.2);
      group.add(windowObject);
    }

    [-4.2, 0, 4.2].forEach((offset) => {
      tasks.push(MODEL_LIBRARY.add(group, 'sofa', {
        position: [-4.5, 0, z + offset],
        size: 2.6,
        fitAxis: 'x',
        rotation: [0, Math.PI / 2, 0],
      }));
    });

    tasks.push(
      MODEL_LIBRARY.add(group, 'plant1', { position: [-4.25, 0, z - 7], size: .9, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'plant2', { position: [4.28, 0, z + 1], size: 1.05, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'plant3', { position: [-4.25, 0, z + 7], size: .92, fitAxis: 'y' }),
      addWarmLamp(group, [-.5, 4.35, z - 6], .58),
      addWarmLamp(group, [.5, 4.35, z], .58),
      addWarmLamp(group, [-.5, 4.35, z + 6], .58)
    );

    await Promise.all(tasks);
    scene.add(group);
  }

  async function buildNook(scene) {
    const group = new THREE.Group();
    const z = -91;
    const windowObject = windowPane(3.8, 3.35);
    windowObject.position.set(0, 2, z - 3.8);
    group.add(windowObject);

    await Promise.all([
      MODEL_LIBRARY.add(group, 'sofa', { position: [-.5, 0, z - 2.9], size: 2.85, fitAxis: 'x' }),
      MODEL_LIBRARY.add(group, 'pillow', { position: [-1.35, .62, z - 2.72], size: .55, fitAxis: 'x', rotation: [.1, 0, -.1] }),
      MODEL_LIBRARY.add(group, 'pillowBlue', { position: [-.55, .62, z - 2.72], size: .55, fitAxis: 'x', rotation: [.08, 0, .05] }),
      MODEL_LIBRARY.add(group, 'pillow', { position: [.25, .62, z - 2.72], size: .55, fitAxis: 'x', rotation: [.1, 0, .12] }),
      MODEL_LIBRARY.add(group, 'sideTable', { position: [1.65, 0, z - 2.7], size: .56, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'coffee', { position: [1.65, .56, z - 2.7], size: .13, fitAxis: 'y' }),
      MODEL_LIBRARY.add(group, 'rugRound', { position: [-.2, .02, z - 1.8], size: 3.1, fitAxis: 'x', scale: [1.25, 1, 1] }),
      MODEL_LIBRARY.add(group, 'plantLarge', { position: [-2.5, 0, z - 2.6], size: 1.25, fitAxis: 'y' }),
      addWarmLamp(group, [.4, 4.35, z - 2.5], .72),
    ]);

    scene.add(group);
  }

  async function build(scene) {
    buildShell(scene);
    await MODEL_LIBRARY.preload();
    const [, bar] = await Promise.all([
      buildEntrance(scene),
      buildBar(scene),
      buildMenu(scene),
      buildHall(scene),
      buildNook(scene),
    ]);
    return { steamOrigins: bar.steamOrigins };
  }

  return { build };
})();
