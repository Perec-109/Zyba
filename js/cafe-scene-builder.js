/**
 * CAFE_BUILDER — строит всю сцену кофейни из примитивов THREE.js.
 * Никаких внешних .glb/.gltf моделей и текстур — только геометрия и цвет.
 * Это даёт мгновенную загрузку (важно на мобильном интернете).
 *
 * Зоны расположены вдоль оси Z (камера летит от Z=0 к Z=-100):
 *   Z=   0   entrance / витрина
 *   Z= -22   bar
 *   Z= -44   menu wall
 *   Z= -66   hall / посадка
 *   Z= -88   window nook
 */
const CAFE_BUILDER = (() => {

  const COLOR = {
    wall:      0x2c1b13,
    wallDark:  0x1c1109,
    floor:     0x40281a,
    floorDark: 0x2a1810,
    wood:      0x6b4226,
    woodDark:  0x4a2c18,
    counter:   0x8a5a34,
    metal:     0xb5b0a8,
    metalDark: 0x6b6560,
    cream:     0xF2E6D3,
    caramel:   0xC17F3E,
    sage:      0x6f8462,
    sageDark:  0x4d5f42,
    glow:      0xE8B85C,
    glass:     0xcfe0dd,
    fabric:    0x7a4a3a,
  };

  function mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.05,
      emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0,
      transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
    });
  }

  function box(w, h, d, material, castShadow = true) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, material);
    m.castShadow = castShadow;
    m.receiveShadow = true;
    return m;
  }
  function cyl(rTop, rBot, h, material, segs = 12, castShadow = true) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    const m = new THREE.Mesh(g, material);
    m.castShadow = castShadow;
    m.receiveShadow = true;
    return m;
  }

  /* ---------- reusable materials ---------- */
  const M = {
    wall: mat(COLOR.wall),
    wallDark: mat(COLOR.wallDark),
    floor: mat(COLOR.floor, { roughness: 0.7 }),
    wood: mat(COLOR.wood),
    counter: mat(COLOR.counter, { roughness: 0.5, metalness: 0.1 }),
    metal: mat(COLOR.metal, { roughness: 0.35, metalness: 0.75 }),
    metalDark: mat(COLOR.metalDark, { roughness: 0.4, metalness: 0.7 }),
    cream: mat(COLOR.cream, { roughness: 0.9 }),
    sage: mat(COLOR.sage, { roughness: 0.8 }),
    sageDark: mat(COLOR.sageDark, { roughness: 0.8 }),
    glass: mat(COLOR.glass, { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 }),
    glow: mat(COLOR.glow, { emissive: COLOR.glow, emissiveIntensity: 1.6, roughness: 0.4 }),
    fabric: mat(COLOR.fabric, { roughness: 0.95 }),
    ceramic: mat(0xece3d4, { roughness: 0.3, metalness: 0.05 }),
  };

  /* ---------- small reusable pieces ---------- */

  function plant(detail = 3) {
    const g = new THREE.Group();
    const pot = cyl(0.32, 0.24, 0.4, M.wood);
    pot.position.y = 0.2;
    g.add(pot);
    const leafCount = detail >= 3 ? 7 : detail === 2 ? 5 : 3;
    for (let i = 0; i < leafCount; i++) {
      const leaf = cyl(0.02, 0.16, 0.9, M.sage, 5);
      leaf.position.set(
        Math.cos(i / leafCount * Math.PI * 2) * 0.18,
        0.75 + Math.random() * 0.2,
        Math.sin(i / leafCount * Math.PI * 2) * 0.18
      );
      leaf.rotation.z = (Math.random() - 0.5) * 0.9;
      leaf.rotation.x = (Math.random() - 0.5) * 0.5;
      g.add(leaf);
    }
    return g;
  }

  function hangingLight(withBulbGlow = true) {
    const g = new THREE.Group();
    const wire = cyl(0.01, 0.01, 1.2, M.metalDark, 6, false);
    wire.position.y = 0.6;
    g.add(wire);
    const shade = cyl(0.22, 0.05, 0.22, M.metalDark, 16);
    shade.position.y = 0;
    g.add(shade);
    if (withBulbGlow) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), M.glow);
      bulb.position.y = -0.05;
      g.add(bulb);
      const light = new THREE.PointLight(COLOR.glow, 1.1, 4.5, 2);
      light.position.y = -0.05;
      g.add(light);
    }
    return g;
  }

  function cupWithSaucer() {
    const g = new THREE.Group();
    const saucer = cyl(0.12, 0.13, 0.02, M.ceramic, 14);
    g.add(saucer);
    const cup = cyl(0.06, 0.05, 0.08, M.ceramic, 12);
    cup.position.y = 0.05;
    g.add(cup);
    g.userData.steamOrigin = new THREE.Vector3(0, 0.1, 0);
    return g;
  }

  function tableWithChairs(chairCount = 2) {
    const g = new THREE.Group();
    const top = cyl(0.55, 0.55, 0.06, M.wood, 20);
    top.position.y = 0.75;
    g.add(top);
    const leg = cyl(0.05, 0.05, 0.75, M.metalDark, 8);
    leg.position.y = 0.375;
    g.add(leg);
    const cupOnTable = cupWithSaucer();
    cupOnTable.position.set(0.15, 0.79, 0.1);
    g.add(cupOnTable);

    for (let i = 0; i < chairCount; i++) {
      const chair = new THREE.Group();
      const seat = box(0.42, 0.06, 0.42, M.wood);
      seat.position.y = 0.46;
      chair.add(seat);
      const back = box(0.42, 0.5, 0.05, M.wood);
      back.position.set(0, 0.71, -0.19);
      chair.add(back);
      for (const [x, z] of [[-0.17,-0.17],[0.17,-0.17],[-0.17,0.17],[0.17,0.17]]) {
        const l = cyl(0.025, 0.025, 0.46, M.metalDark, 6);
        l.position.set(x, 0.23, z);
        chair.add(l);
      }
      const angle = (i / chairCount) * Math.PI * 2 + Math.PI / chairCount;
      chair.position.set(Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9);
      chair.rotation.y = -angle + Math.PI;
      g.add(chair);
    }
    return g;
  }

  function windowPane(w, h) {
    const g = new THREE.Group();
    const frame = box(w, h, 0.08, M.wood);
    g.add(frame);
    const glass = box(w - 0.14, h - 0.14, 0.02, M.glass);
    glass.position.z = 0.02;
    g.add(glass);
    // muntin cross bars
    const vBar = box(0.05, h - 0.14, 0.03, M.wood);
    vBar.position.z = 0.035;
    g.add(vBar);
    const hBar = box(w - 0.14, 0.05, 0.03, M.wood);
    hBar.position.z = 0.035;
    g.add(hBar);
    return g;
  }

  /* ---------- zone builders ---------- */

  function buildShell(scene, settings) {
    // long room: floor + side walls + ceiling implied by darkness (no ceiling mesh needed, saves tris)
    const floor = box(10, 0.2, 110, M.floor);
    floor.position.set(0, -0.1, -45);
    floor.receiveShadow = true;
    scene.add(floor);

    const wallL = box(0.3, 6, 110, M.wallDark, false);
    wallL.position.set(-5, 2.9, -45);
    scene.add(wallL);
    const wallR = box(0.3, 6, 110, M.wallDark, false);
    wallR.position.set(5, 2.9, -45);
    scene.add(wallR);

    const backWall = box(10, 6, 0.3, M.wall, false);
    backWall.position.set(0, 2.9, -100);
    scene.add(backWall);

    // потолок — без него камера при взгляде вверх видит чистый цвет фона (чёрный клин)
    const ceiling = box(10.2, 0.3, 110, M.wallDark, false);
    ceiling.position.set(0, 5.95, -45);
    ceiling.receiveShadow = false;
    scene.add(ceiling);
  }

  function buildEntrance(scene) {
    const g = new THREE.Group();
    const win = windowPane(3.4, 3.0);
    win.position.set(0, 1.9, -1.5);
    g.add(win);
    const glow = new THREE.PointLight(0xfff1d6, 0.9, 12, 2);
    glow.position.set(0, 2, 2);
    g.add(glow);
    const door = box(1.1, 2.2, 0.08, mat(COLOR.wood));
    door.position.set(3.0, 1.1, -1.4);
    g.add(door);
    scene.add(g);
    return g;
  }

  function buildBar(scene, settings) {
    const g = new THREE.Group();
    const z = -22;

    const counter = box(5.4, 1.05, 1.1, M.counter);
    counter.position.set(-1.2, 0.52, z);
    g.add(counter);
    const counterTop = box(5.6, 0.06, 1.2, mat(0x1c1109, { roughness: 0.3, metalness: 0.2 }));
    counterTop.position.set(-1.2, 1.06, z);
    g.add(counterTop);

    // espresso machine (stylized)
    const machineBody = box(0.9, 0.5, 0.55, M.metal);
    machineBody.position.set(-2.6, 1.35, z - 0.1);
    g.add(machineBody);
    const grouphead1 = cyl(0.05, 0.05, 0.18, M.metalDark, 8);
    grouphead1.position.set(-2.85, 1.05, z + 0.1);
    g.add(grouphead1);
    const grouphead2 = cyl(0.05, 0.05, 0.18, M.metalDark, 8);
    grouphead2.position.set(-2.45, 1.05, z + 0.1);
    g.add(grouphead2);
    const gauge = cyl(0.08, 0.08, 0.04, M.glow, 16);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(-2.6, 1.55, z - 0.32);
    g.add(gauge);

    // grinder
    const grinder = cyl(0.14, 0.16, 0.55, M.metalDark, 12);
    grinder.position.set(-1.6, 1.35, z - 0.15);
    g.add(grinder);

    // shelf behind bar with cups/jars
    for (let row = 0; row < 2; row++) {
      const shelf = box(4.6, 0.05, 0.3, M.wood);
      shelf.position.set(-1.2, 1.9 + row * 0.55, z - 0.85);
      g.add(shelf);
      const jarCount = 6;
      for (let i = 0; i < jarCount; i++) {
        const jar = cyl(0.09, 0.09, 0.22, M.glass, 10);
        jar.position.set(-3.2 + i * 0.75, 1.9 + row * 0.55 + 0.13, z - 0.85);
        g.add(jar);
      }
    }

    // cups with steam on counter
    const cupPositions = [[-0.4, z + 0.3], [0.1, z + 0.2], [-3.4, z + 0.35]];
    const steamOrigins = [];
    cupPositions.forEach(([x, cz]) => {
      const cup = cupWithSaucer();
      cup.position.set(x, 1.1, cz);
      g.add(cup);
      steamOrigins.push(new THREE.Vector3(x, 1.22, cz));
    });

    // pendant lights over bar
    [-3.0, -1.2, 0.6].forEach((x) => {
      const hl = hangingLight();
      hl.position.set(x, 3.4, z - 0.2);
      g.add(hl);
    });

    scene.add(g);
    return { group: g, steamOrigins };
  }

  function buildMenuWall(scene, settings) {
    const g = new THREE.Group();
    const z = -44;

    const board = box(2.6, 1.6, 0.06, mat(0x14100c, { roughness: 0.9 }));
    board.position.set(-3.3, 2.0, z);
    g.add(board);
    const frame = box(2.75, 1.75, 0.04, M.wood);
    frame.position.set(-3.3, 2.0, z - 0.02);
    g.add(frame);

    // bean sacks
    for (let i = 0; i < 3; i++) {
      const sack = cyl(0.32, 0.4, 0.6, mat(0x8a6a3f, { roughness: 1 }), 10);
      sack.position.set(-4.2 + i * 0.75, 0.3, z + 1.4);
      sack.rotation.z = (Math.random() - 0.5) * 0.15;
      g.add(sack);
    }

    // hanging plant near menu
    const p = plant(settings.plantDetail);
    p.position.set(1.6, 0.5, z + 0.3);
    g.add(p);

    const hl = hangingLight();
    hl.position.set(-3.3, 3.3, z + 0.4);
    g.add(hl);

    scene.add(g);
    return g;
  }

  function buildHall(scene, settings) {
    const g = new THREE.Group();
    const z = -66;

    const tablePositions = [
      [-2.6, z - 4, 2], [2.6, z - 4, 2],
      [-2.6, z + 3, 2], [2.6, z + 3, 3],
      [0, z + 9, 2],
    ];
    tablePositions.forEach(([x, tz, chairs]) => {
      const t = tableWithChairs(chairs);
      t.position.set(x, 0, tz);
      t.rotation.y = Math.random() * Math.PI;
      g.add(t);
    });

    // big windows along the side
    for (let i = 0; i < 3; i++) {
      const w = windowPane(1.6, 2.2);
      w.rotation.y = Math.PI / 2;
      w.position.set(4.85, 1.7, z - 6 + i * 5);
      g.add(w);
      const wL = windowPane(1.6, 2.2);
      wL.rotation.y = -Math.PI / 2;
      wL.position.set(-4.85, 1.7, z - 6 + i * 5);
      g.add(wL);
    }

    // plants scattered
    for (let i = 0; i < 4; i++) {
      const p = plant(settings.plantDetail);
      p.position.set(i % 2 === 0 ? -4.4 : 4.4, 0, z - 8 + i * 5);
      g.add(p);
    }

    // pendant lights over hall
    [z - 6, z, z + 6].forEach((zz) => {
      const hl = hangingLight();
      hl.position.set(0, 3.4, zz);
      g.add(hl);
    });

    scene.add(g);
    return g;
  }

  function buildNook(scene, settings) {
    const g = new THREE.Group();
    const z = -88;

    const bigWindow = windowPane(3.2, 3.4);
    bigWindow.position.set(0, 1.9, z - 4);
    g.add(bigWindow);

    const bench = box(2.4, 0.5, 0.7, M.wood);
    bench.position.set(0, 0.25, z - 3.2);
    g.add(bench);
    const cushion = box(2.3, 0.18, 0.6, M.fabric);
    cushion.position.set(0, 0.55, z - 3.2);
    g.add(cushion);

    const armchair = box(0.7, 0.5, 0.7, M.fabric);
    armchair.position.set(1.6, 0.3, z - 1.5);
    g.add(armchair);
    const armchairBack = box(0.7, 0.7, 0.15, M.fabric);
    armchairBack.position.set(1.6, 0.6, z - 1.8);
    g.add(armchairBack);

    const p1 = plant(settings.plantDetail);
    p1.position.set(-2.0, 0, z - 1.2);
    g.add(p1);

    const hl = hangingLight();
    hl.position.set(0.5, 3.2, z - 2);
    g.add(hl);

    const cup = cupWithSaucer();
    cup.position.set(1.4, 0.6, z - 1.9);
    g.add(cup);

    scene.add(g);
    return g;
  }

  /**
   * Строит всю кофейню и возвращает опорные точки (steam origins и т.д.)
   */
  function build(scene, settings) {
    buildShell(scene, settings);
    buildEntrance(scene);
    const bar = buildBar(scene, settings);
    buildMenuWall(scene, settings);
    buildHall(scene, settings);
    buildNook(scene, settings);

    return {
      steamOrigins: bar.steamOrigins,
    };
  }

  return { build, plant, hangingLight, cupWithSaucer };
})();
