/**
 * Lightweight GLB asset library.
 * Models are loaded once, cloned with shared geometry/materials and normalized
 * to a predictable real-world size before being placed in the cafe.
 */
const MODEL_LIBRARY = (() => {
  const furniture = 'assets/models/kenney-furniture/';
  const food = 'assets/models/kenney-food/';

  const URLS = {
    doorway: furniture + 'doorwayOpen.glb',
    bench: furniture + 'bench.glb',
    plantLarge: furniture + 'pottedPlant.glb',
    plant1: furniture + 'plantSmall1.glb',
    plant2: furniture + 'plantSmall2.glb',
    plant3: furniture + 'plantSmall3.glb',
    bar: furniture + 'kitchenBar.glb',
    coffeeMachine: furniture + 'kitchenCoffeeMachine.glb',
    grinder: furniture + 'kitchenBlender.glb',
    ceilingLamp: furniture + 'lampSquareCeiling.glb',
    tableRound: furniture + 'tableRound.glb',
    tableCross: furniture + 'tableCross.glb',
    chair: furniture + 'chairModernCushion.glb',
    chairRounded: furniture + 'chairRounded.glb',
    sofa: furniture + 'loungeDesignSofa.glb',
    sideTable: furniture + 'sideTable.glb',
    pillow: furniture + 'pillow.glb',
    pillowBlue: furniture + 'pillowBlue.glb',
    rugRound: furniture + 'rugRound.glb',
    rugRectangle: furniture + 'rugRectangle.glb',
    doormat: furniture + 'rugDoormat.glb',
    shelf: furniture + 'bookcaseOpenLow.glb',
    bookcase: furniture + 'bookcaseOpen.glb',
    books: furniture + 'books.glb',
    coatRack: furniture + 'coatRackStanding.glb',
    upperCabinet: furniture + 'kitchenCabinetUpper.glb',
    fridge: furniture + 'kitchenFridgeSmall.glb',
    microwave: furniture + 'kitchenMicrowave.glb',
    toaster: furniture + 'toaster.glb',
    trashcan: furniture + 'trashcan.glb',
    floorLamp: furniture + 'lampRoundFloor.glb',
    tableLamp: furniture + 'lampRoundTable.glb',
    coffeeTable: furniture + 'tableCoffee.glb',
    radio: furniture + 'radio.glb',
    speaker: furniture + 'speakerSmall.glb',
    rugSoft: furniture + 'rugRounded.glb',
    sink: furniture + 'kitchenSink.glb',
    stool: furniture + 'stoolBar.glb',
    laptop: furniture + 'laptop.glb',
    coffee: food + 'cup-coffee.glb',
    cupSaucer: food + 'cup-saucer.glb',
    croissant: food + 'croissant.glb',
    muffin: food + 'muffin.glb',
    donut: food + 'donut-chocolate.glb',
    cookie: food + 'cookie-chocolate.glb',
    coffeeBag: food + 'bag.glb',
    cake: food + 'cake.glb',
    cupcake: food + 'cupcake.glb',
    pie: food + 'pie.glb',
    baguette: food + 'loaf-baguette.glb',
    plate: food + 'plate.glb',
    pancakes: food + 'pancakes.glb',
    waffle: food + 'waffle.glb',
    glass: food + 'glass.glb',
    bowl: food + 'bowl.glb',
    frappe: food + 'frappe.glb',
    oilBottle: food + 'bottle-oil.glb',
    honey: food + 'honey.glb',
    pepperMill: food + 'pepper-mill.glb',
  };

  const loader = new THREE.GLTFLoader();
  const cache = new Map();

  function load(id) {
    if (!URLS[id]) return Promise.reject(new Error(`Unknown model: ${id}`));
    if (!cache.has(id)) {
      cache.set(id, new Promise((resolve, reject) => {
        loader.load(URLS[id], (gltf) => resolve(gltf.scene), undefined, reject);
      }));
    }
    return cache.get(id);
  }

  async function preload() {
    const results = await Promise.allSettled(Object.keys(URLS).map(load));
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length) console.warn(`${failed.length} cafe models failed to preload`);
  }

  function axisValue(size, axis) {
    if (axis === 'x') return size.x;
    if (axis === 'z') return size.z;
    if (axis === 'max') return Math.max(size.x, size.y, size.z);
    return size.y;
  }

  async function create(id, options = {}) {
    try {
      const source = await load(id);
      const model = source.clone(true);
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = !!PERF.settings.shadows;
        node.receiveShadow = true;
        node.frustumCulled = true;
      });

      const fitAxis = options.fitAxis || 'y';
      const targetSize = options.size || 1;
      let bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const sourceSize = Math.max(axisValue(size, fitAxis), 0.0001);
      model.scale.setScalar(targetSize / sourceSize);
      model.updateMatrixWorld(true);

      bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -bounds.min.y, -center.z);

      const pivot = new THREE.Group();
      pivot.name = `model-${id}`;
      pivot.add(model);

      const position = options.position || [0, 0, 0];
      const rotation = options.rotation || [0, 0, 0];
      pivot.position.set(position[0], position[1], position[2]);
      pivot.rotation.set(rotation[0], rotation[1], rotation[2]);

      if (Array.isArray(options.scale)) {
        pivot.scale.set(options.scale[0], options.scale[1], options.scale[2]);
      } else if (typeof options.scale === 'number') {
        pivot.scale.setScalar(options.scale);
      }

      return pivot;
    } catch (error) {
      console.warn(`Model "${id}" could not be loaded`, error);
      return null;
    }
  }

  async function add(parent, id, options) {
    const model = await create(id, options);
    if (model) parent.add(model);
    return model;
  }

  return { preload, create, add };
})();
