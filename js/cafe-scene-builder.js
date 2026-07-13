/** Lightweight procedural 3D cafe — no external models or textures. */
const CAFE_BUILDER = (() => {
  const C = {
    wall: 0x332118, wallAlt: 0x25150f, plaster: 0x765744, floor: 0x513321,
    wood: 0x7a4c2c, woodLight: 0xa87345, woodDark: 0x352017,
    cream: 0xeadbc4, brass: 0xc7934d, steel: 0x9e9b93, black: 0x17120f,
    sage: 0x718267, sageDark: 0x43523c, terracotta: 0x995f42,
    fabric: 0x84533f, glow: 0xffc875, glass: 0xa8d3ce,
  };
  const mat = (color, o = {}) => {
    const params = {
      color, roughness: o.roughness ?? .78, metalness: o.metalness ?? .03,
      emissive: o.emissive ?? 0, emissiveIntensity: o.emissiveIntensity ?? 0,
      transparent: !!o.transparent, opacity: o.opacity ?? 1,
    };
    if (o.side !== undefined) params.side = o.side;
    return new THREE.MeshStandardMaterial(params);
  };
  const M = {
    wall: mat(C.wall, { roughness: .98 }), wallAlt: mat(C.wallAlt, { roughness: .96 }),
    plaster: mat(C.plaster, { roughness: 1 }), wood: mat(C.wood, { roughness: .68 }),
    woodLight: mat(C.woodLight, { roughness: .62 }), woodDark: mat(C.woodDark, { roughness: .82 }),
    cream: mat(C.cream, { roughness: .86 }), black: mat(C.black, { roughness: .38 }),
    steel: mat(C.steel, { roughness: .28, metalness: .78 }), brass: mat(C.brass, { roughness: .3, metalness: .7 }),
    sage: mat(C.sage, { roughness: .88 }), sageDark: mat(C.sageDark, { roughness: .9 }),
    terracotta: mat(C.terracotta, { roughness: .94 }), fabric: mat(C.fabric, { roughness: 1 }),
    glass: mat(C.glass, { roughness: .12, metalness: .08, transparent: true, opacity: .22 }),
    glow: mat(C.glow, { emissive: C.glow, emissiveIntensity: 1.45, roughness: .25 }),
  };
  function mesh(geometry, material, shadows = true) {
    const m = new THREE.Mesh(geometry, material); m.castShadow = shadows; m.receiveShadow = true; return m;
  }
  const box = (w, h, d, material = M.wood, shadows = true) => mesh(new THREE.BoxGeometry(w, h, d), material, shadows);
  const cyl = (rt, rb, h, material, seg = 16, shadows = true) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, shadows);
  const sphere = (r, material, ws = 14, hs = 10) => mesh(new THREE.SphereGeometry(r, ws, hs), material);

  function labelTexture(title, lines = [], dark = true) {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 512;
    const x = canvas.getContext('2d');
    x.fillStyle = dark ? '#171713' : '#eadbc4'; x.fillRect(0, 0, canvas.width, canvas.height);
    x.strokeStyle = dark ? '#a87345' : '#7a4c2c'; x.lineWidth = 14; x.strokeRect(18, 18, 732, 476);
    x.fillStyle = dark ? '#f0e4d1' : '#25150f'; x.textAlign = 'center';
    x.font = '600 88px Georgia'; x.fillText(title, 384, 145);
    x.font = '32px Arial'; lines.forEach((line, i) => x.fillText(line, 384, 232 + i * 58));
    const texture = new THREE.CanvasTexture(canvas); texture.encoding = THREE.sRGBEncoding; texture.anisotropy = 4; return texture;
  }
  function poster(w, h, texture) {
    const g = new THREE.Group();
    const frame = box(w + .12, h + .12, .07, M.woodLight); g.add(frame);
    const face = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })); face.position.z = .041; g.add(face);
    return g;
  }
  function windowPane(w, h) {
    const g = new THREE.Group();
    const glass = box(w, h, .025, M.glass, false); g.add(glass);
    [[w + .12, .08, 0, h / 2], [w + .12, .08, 0, -h / 2], [.08, h + .12, -w / 2, 0], [.08, h + .12, w / 2, 0], [.055, h, 0, 0], [w, .055, 0, 0]]
      .forEach(([rw, rh, x, y]) => { const rail = box(rw, rh, .09, M.woodDark); rail.position.set(x, y, .025); g.add(rail); });
    return g;
  }
  function pendant(intensity = .8) {
    const g = new THREE.Group();
    const cable = cyl(.008, .008, 1.3, M.black, 6, false); cable.position.y = .65; g.add(cable);
    const shade = cyl(.08, .27, .22, M.black, 20); shade.position.y = -.03; g.add(shade);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.265, .018, 6, 20), M.brass); rim.rotation.x = Math.PI / 2; rim.position.y = -.14; g.add(rim);
    const bulb = sphere(.055, M.glow, 10, 8); bulb.position.y = -.15; g.add(bulb);
    const light = new THREE.PointLight(C.glow, intensity, 5.5, 2); light.position.y = -.18; g.add(light);
    return g;
  }
  function plant(detail = 3, scale = 1) {
    const g = new THREE.Group();
    const pot = cyl(.31, .23, .42, M.terracotta, 18); pot.position.y = .21; g.add(pot);
    const rim = cyl(.34, .34, .08, M.terracotta, 18); rim.position.y = .39; g.add(rim);
    const soil = cyl(.275, .275, .018, M.black, 18, false); soil.position.y = .435; g.add(soil);
    const count = detail > 2 ? 9 : detail > 1 ? 7 : 5;
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2; const height = .52 + (i % 3) * .1;
      const stem = cyl(.009, .014, height, M.sageDark, 5); stem.position.set(Math.cos(a) * .08, .42 + height / 2, Math.sin(a) * .08); stem.rotation.z = Math.cos(a) * .2; stem.rotation.x = Math.sin(a) * .2; g.add(stem);
      const leaf = sphere(.19, i % 3 ? M.sage : M.sageDark, 10, 7); leaf.scale.set(.58, 1.55, .22); leaf.position.set(Math.cos(a) * .23, .91 + (i % 3) * .08, Math.sin(a) * .23); leaf.rotation.order = 'YXZ'; leaf.rotation.y = -a; leaf.rotation.z = Math.cos(a) * .35; g.add(leaf);
    }
    g.scale.setScalar(scale); return g;
  }
  function cup() {
    const g = new THREE.Group(); const ceramic = M.cream;
    const saucer = cyl(.13, .14, .018, ceramic, 18); g.add(saucer);
    const body = cyl(.065, .052, .09, ceramic, 16); body.position.y = .052; g.add(body);
    const coffee = cyl(.057, .057, .006, M.black, 16, false); coffee.position.y = .099; g.add(coffee);
    const handle = mesh(new THREE.TorusGeometry(.038, .01, 6, 14, Math.PI * 1.55), ceramic); handle.position.set(.068, .06, 0); handle.rotation.set(0, Math.PI / 2, -.78 * Math.PI); g.add(handle);
    return g;
  }
  function bistroSet(chairs = 2) {
    const g = new THREE.Group(); const top = cyl(.56, .56, .065, M.woodLight, 24); top.position.y = .76; g.add(top);
    const leg = cyl(.055, .075, .72, M.black, 10); leg.position.y = .38; g.add(leg);
    const base = cyl(.25, .3, .035, M.black, 16); base.position.y = .02; g.add(base);
    const c = cup(); c.position.set(.14, .8, .08); g.add(c);
    for (let i = 0; i < chairs; i++) {
      const chair = new THREE.Group(); const seat = cyl(.23, .23, .055, M.wood, 18); seat.position.y = .46; chair.add(seat);
      const back = box(.42, .42, .045, M.wood); back.position.set(0, .72, -.2); chair.add(back);
      [-.15, .15].forEach((x) => [-.14, .14].forEach((z) => { const l = cyl(.018, .025, .45, M.black, 6); l.position.set(x, .225, z); chair.add(l); }));
      const a = i / chairs * Math.PI * 2; chair.position.set(Math.cos(a) * .95, 0, Math.sin(a) * .95); chair.rotation.y = -a + Math.PI / 2; g.add(chair);
    }
    return g;
  }
  function sack(color, label) {
    const g = new THREE.Group(); const material = mat(color, { roughness: 1 });
    const body = sphere(.42, material, 12, 9); body.scale.set(.92, 1.18, .7); body.position.y = .38; g.add(body);
    const neck = cyl(.18, .27, .22, material, 10); neck.position.y = .77; g.add(neck);
    const tie = mesh(new THREE.TorusGeometry(.19, .018, 5, 12), M.woodDark); tie.rotation.x = Math.PI / 2; tie.position.y = .69; g.add(tie);
    const tag = poster(.28, .2, labelTexture(label, [], false)); tag.position.set(0, .38, .31); tag.scale.set(.7, .7, .7); g.add(tag); return g;
  }

  function buildShell(scene) {
    const floor = box(10, .16, 108, mat(C.floor, { roughness: .86 })); floor.position.set(0, -.08, -46); scene.add(floor);
    for (let z = 3; z > -99; z -= 3.1) {
      const plank = box(9.65, .018, 2.95, z % 2 ? M.woodDark : M.wood, false); plank.position.set(0, .015, z); scene.add(plank);
      const seam = box(9.7, .022, .018, M.black, false); seam.position.set(0, .028, z - 1.49); scene.add(seam);
    }
    const left = box(.25, 5.8, 108, M.wallAlt, false); left.position.set(-5, 2.8, -46); scene.add(left);
    const right = box(.25, 5.8, 108, M.wall, false); right.position.set(5, 2.8, -46); scene.add(right);
    const ceiling = box(10.2, .22, 108, M.wallAlt, false); ceiling.position.set(0, 5.7, -46); scene.add(ceiling);
    const back = box(10, 5.8, .2, M.wall, false); back.position.set(0, 2.8, -100); scene.add(back);
    for (let z = -8; z > -98; z -= 9) { const beam = box(10, .14, .18, M.woodDark); beam.position.set(0, 5.5, z); scene.add(beam); }
  }
  function buildEntrance(scene) {
    const g = new THREE.Group();
    const facadeZ = -2.45;

    // Полноценная стеклянная входная группа вместо пустой рамки.
    const header = box(9.7, .22, .32, M.woodDark); header.position.set(0, 3.16, facadeZ); g.add(header);
    const base = box(9.7, .14, .36, M.woodDark); base.position.set(0, .08, facadeZ); g.add(base);
    [-4.82, -2.22, .42, 1.7, 3.42, 4.82].forEach(x => {
      const mullion = box(.11, 3.05, .2, M.woodDark); mullion.position.set(x, 1.57, facadeZ); g.add(mullion);
    });

    const leftWindow = windowPane(2.45, 2.75); leftWindow.position.set(-3.52, 1.61, facadeZ); g.add(leftWindow);
    const centerWindow = windowPane(2.45, 2.75); centerWindow.position.set(-.9, 1.61, facadeZ); g.add(centerWindow);
    const rightWindow = windowPane(1.25, 2.75); rightWindow.position.set(4.12, 1.61, facadeZ); g.add(rightWindow);

    // Дверь приоткрыта внутрь: сразу понятно, где вход и куда идти.
    const door = new THREE.Group();
    const doorGlass = box(1.55, 2.68, .035, M.glass, false); doorGlass.position.set(.78, 1.42, 0); door.add(doorGlass);
    [[1.62,.09,.78,2.78],[1.62,.09,.78,.06],[.09,2.8,.04,1.42],[.09,2.8,1.52,1.42],[1.52,.07,.78,.72]].forEach(([w,h,x,y])=>{
      const rail=box(w,h,.1,M.woodDark);rail.position.set(x,y,.025);door.add(rail);
    });
    const handle = cyl(.025,.025,.48,M.brass,10); handle.position.set(1.28,1.45,.1); door.add(handle);
    door.position.set(1.72, .08, facadeZ + .06); door.rotation.y = .58; g.add(door);

    const threshold = box(1.85,.07,.52,M.brass); threshold.position.set(2.56,.08,facadeZ+.06); g.add(threshold);
    const matIn = box(1.35,.025,.8,mat(0x2b211c,{roughness:1}),false); matIn.position.set(2.55,.025,facadeZ+1); g.add(matIn);
    const openSign = poster(.72,.42,labelTexture('OPEN',['08 — 22'])); openSign.position.set(4.12,1.75,facadeZ+.09); openSign.scale.set(.72,.72,.72); g.add(openSign);
    const sign = poster(2.15, .72, labelTexture('ZYBA', ['COFFEE · ROASTERY'])); sign.position.set(2.55, 3.75, facadeZ); g.add(sign);

    const bench = box(1.65, .12, .55, M.woodLight); bench.position.set(-3.45, .45, .2); g.add(bench);
    [-4.05, -2.85].forEach(x => { const l=box(.09,.45,.45,M.black); l.position.set(x,.22,.2); g.add(l); });
    const p = plant(3, .85); p.position.set(4.25, 0, -.8); g.add(p);
    scene.add(g); return g;
  }
  function buildBar(scene) {
    const g = new THREE.Group(); const z = -22; const steamOrigins = [];
    const front = box(5.7, .95, .95, M.wood); front.position.set(-1.5, .48, z); g.add(front);
    for (let x = -4.05; x < 1.15; x += .42) { const slat=box(.025,.82,.97,M.woodDark); slat.position.set(x,.46,z+.01); g.add(slat); }
    const top = box(5.95, .08, 1.08, M.black); top.position.set(-1.5, 1, z); g.add(top);
    const machine = new THREE.Group(); const body = box(1.25,.55,.62,M.steel); body.position.y=.35; machine.add(body);
    const topRail=box(1.3,.08,.66,M.black); topRail.position.y=.66; machine.add(topRail);
    [-.34,.34].forEach(x => { const head=cyl(.065,.065,.18,M.brass,12); head.rotation.x=Math.PI/2; head.position.set(x,.18,.36); machine.add(head); const handle=box(.3,.025,.025,M.black); handle.position.set(x+.16,.18,.47); machine.add(handle); });
    const gauge=cyl(.1,.1,.025,M.cream,18); gauge.rotation.x=Math.PI/2; gauge.position.set(0,.43,.325); machine.add(gauge); machine.position.set(-2.7,1.04,z-.12); g.add(machine);
    const wand=cyl(.012,.012,.42,M.steel,8); wand.rotation.z=-.22; wand.position.set(-.54,.05,.34); machine.add(wand);
    [-.38,0,.38].forEach(x=>{const knob=cyl(.035,.035,.035,M.black,12);knob.rotation.x=Math.PI/2;knob.position.set(x,.53,.35);machine.add(knob);});
    const grinder = new THREE.Group(); const base=box(.32,.3,.3,M.black); base.position.y=.18; grinder.add(base); const hopper=cyl(.12,.19,.38,M.glass,14); hopper.position.y=.52; grinder.add(hopper); grinder.position.set(-1.55,1.03,z-.12); g.add(grinder);
    const pitcher=cyl(.11,.085,.21,M.steel,16);pitcher.position.set(-2.02,1.14,z+.27);g.add(pitcher);
    const tampMat=box(.62,.025,.32,M.black);tampMat.position.set(-1.32,1.06,z+.31);g.add(tampMat);
    const pastry = new THREE.Group(); const caseBox=box(1.15,.48,.55,M.glass); caseBox.position.y=.28; pastry.add(caseBox); for(let i=0;i<3;i++){const croissant=mesh(new THREE.TorusGeometry(.1,.035,6,12,Math.PI*1.35),mat(0xd99a53,{roughness:.9}));croissant.rotation.x=Math.PI/2;croissant.position.set(-.35+i*.35,.24,.3);pastry.add(croissant);} pastry.position.set(-.35,1.04,z-.1); g.add(pastry);
    for (let row = 0; row < 2; row++) { const shelf=box(4.5,.055,.28,M.woodLight); shelf.position.set(-1.4,2+row*.58,z-.82); g.add(shelf); for(let i=0;i<7;i++){const jar=cyl(.075,.085,.21,i%2?M.glass:M.cream,12);jar.position.set(-3.25+i*.62,2.14+row*.58,z-.79);g.add(jar);} }
    [[-.1,.27],[.4,.18],[-3.55,.31]].forEach(([x,dz]) => { const c=cup(); c.position.set(x,1.08,z+dz); g.add(c); steamOrigins.push(new THREE.Vector3(x,1.22,z+dz)); });
    [-3.2,-1.45,.3].forEach(x => { const l=pendant(.72); l.position.set(x,4.35,z); g.add(l); });
    const menu = poster(1.55,.95,labelTexture('BAR',['espresso · filter','roasted here'])); menu.position.set(3.95,2.15,z-.75); g.add(menu);
    scene.add(g); return { steamOrigins };
  }
  function buildMenu(scene, detail) {
    const g = new THREE.Group(); const z=-44;
    const board=poster(2.8,1.9,labelTexture('TODAY',['ESPRESSO        180','FLAT WHITE      280','FILTER V60      260','OAT RAF         320'])); board.position.set(3.25,2.05,z); g.add(board);
    const ledge=box(3,.1,.3,M.woodLight); ledge.position.set(3.25,1.02,z+.08); g.add(ledge);
    [0,1,2].forEach(i=>{const s=sack(i===1?0x997046:0x7f5d3c,i===0?'ET':i===1?'CO':'BR');s.position.set(2.45+i*.78,0,z+1.25+(i%2)*.08);s.rotation.z=(i-1)*.07;g.add(s);});
    const tasting=box(2.4,.74,.7,M.woodDark); tasting.position.set(-3.5,.37,z+.6); g.add(tasting);
    const p=plant(detail,.9);p.position.set(-2.1,0,z+.2);g.add(p);
    const l=pendant(.85);l.position.set(3.25,4.35,z+.15);g.add(l); scene.add(g);
  }
  function buildHall(scene, detail) {
    const g=new THREE.Group(); const z=-67;
    [[-2.8,z-5,2],[2.7,z-4,2],[-2.7,z+2,2],[2.65,z+3,3],[0,z+9,2]].forEach(([x,zz,n],i)=>{const t=bistroSet(n);t.position.set(x,0,zz);t.rotation.y=i*.63;g.add(t);});
    for(let i=0;i<3;i++){const w=windowPane(1.7,2.35);w.rotation.y=Math.PI/2;w.position.set(4.86,1.85,z-6+i*5.2);g.add(w);}
    const banquette=box(.65,.52,5.8,M.fabric);banquette.position.set(-4.55,.28,z);g.add(banquette);const back=box(.22,.85,5.8,M.fabric);back.position.set(-4.82,.72,z);g.add(back);
    [z-6,z,z+6].forEach((zz,i)=>{const l=pendant(.65);l.position.set(i%2?.5:-.5,4.35,zz);g.add(l);});
    [z-7,z+1,z+7].forEach((zz,i)=>{const p=plant(detail,.72+i*.05);p.position.set(i%2?4.35:-4.35,0,zz);g.add(p);}); scene.add(g);
  }
  function buildNook(scene, detail) {
    const g=new THREE.Group();const z=-91;
    const w=windowPane(3.8,3.35);w.position.set(0,2,z-3.8);g.add(w);
    const bench=box(2.8,.52,.82,M.woodDark);bench.position.set(-.5,.27,z-2.9);g.add(bench);
    [-1.35,-.5,.35].forEach((x,i)=>{const cushion=sphere(.48,i===1?M.sage:M.fabric,18,12);cushion.scale.set(.86,.22,.68);cushion.position.set(x,.66,z-2.88);g.add(cushion);});
    [-1.25,-.25,.55].forEach((x,i)=>{const back=sphere(.52,i===1?M.fabric:M.sage,18,12);back.scale.set(.76,.72,.2);back.position.set(x,1.03+(i%2)*.04,z-3.18);back.rotation.z=(i-1)*.08;g.add(back);});
    const sideTop=cyl(.42,.42,.07,M.woodLight,24);sideTop.position.set(1.65,.52,z-2.7);g.add(sideTop);const sideLeg=cyl(.055,.075,.48,M.black,10);sideLeg.position.set(1.65,.26,z-2.7);g.add(sideLeg);const c=cup();c.position.set(1.65,.57,z-2.7);g.add(c);
    const rug=mesh(new THREE.CircleGeometry(1.5,32),mat(0x6f4938,{roughness:1}),false);rug.rotation.x=-Math.PI/2;rug.scale.set(1.45,1,1);rug.position.set(-.2,.025,z-1.8);g.add(rug);
    const p=plant(detail,1.05);p.position.set(-2.5,0,z-2.6);g.add(p);const l=pendant(.85);l.position.set(.4,4.25,z-2.5);g.add(l);scene.add(g);
  }
  function build(scene, settings) {
    buildShell(scene); buildEntrance(scene); const bar=buildBar(scene); buildMenu(scene,settings.plantDetail); buildHall(scene,settings.plantDetail); buildNook(scene,settings.plantDetail);
    return { steamOrigins: bar.steamOrigins };
  }
  return { build, plant, pendant, cup };
})();
