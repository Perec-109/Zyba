# Как добавлять 3D-объекты в Zyba

Сейчас интерьер использует локальные GLB-модели из `assets/models/`. Модели загружаются один раз через `js/model-library.js`, а повторные стулья, столы и чашки создаются как лёгкие клоны с общими геометрией и материалами.

## Быстро добавить ещё одну модель

1. Положите оптимизированный `.glb` в `assets/models/`.
2. Добавьте путь в объект `URLS` внутри `js/model-library.js`.
3. Разместите модель в `js/cafe-scene-builder.js`:

```js
await MODEL_LIBRARY.add(group, 'myModel', {
  position: [2, 0, -67],
  rotation: [0, Math.PI / 2, 0],
  size: 0.8,
  fitAxis: 'y',
});
```

`size` задаёт реальный размер по выбранной оси: `x` — ширина, `y` — высота, `z` — глубина, `max` — максимальная сторона. Точка модели автоматически переносится в центр основания, поэтому мебель не проваливается в пол.

Главная сцена собирается в `js/cafe-scene-builder.js`. Пол — это `y = 0`, ширина помещения идёт по `x` примерно от `-5` до `5`, а движение в глубину — по отрицательной оси `z`.

## 1. Простой объект прямо в коде

Найди нужную зону: `buildEntrance`, `buildBar`, `buildMenu`, `buildHall` или `buildNook`. Внутри неё добавь объект в группу `g`:

```js
const table = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.08, 0.7),
  new THREE.MeshStandardMaterial({ color: 0x7a4c2c, roughness: 0.7 })
);
table.position.set(1.5, 0.75, -22);
table.castShadow = true;
table.receiveShadow = true;
g.add(table);
```

После изменения увеличь версию файла в `index.html`, например:

```html
<script src="js/cafe-scene-builder.js?v=20260713-7"></script>
```

Это нужно, чтобы браузер не показывал старую версию из кэша.

## 2. Готовая модель `.glb`

Скачивай модели в формате GLB с лицензией, разрешающей использование на сайте. Положи файл, например, сюда:

```text
assets/models/chair.glb
```

Перед `cafe-scene-builder.js` в `index.html` подключи загрузчик той же версии Three.js:

```html
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
```

Затем внутри функции `build(scene, settings)` добавь:

```js
const loader = new THREE.GLTFLoader();

loader.load('assets/models/chair.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(2, 0, -67);
  model.rotation.y = Math.PI / 2;
  model.scale.setScalar(0.8);

  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });

  scene.add(model);
}, undefined, (error) => {
  console.error('Не загрузилась GLB-модель:', error);
});
```

Настройка модели:

- `position.set(x, y, z)` — положение;
- `rotation.y` — поворот;
- `scale.setScalar(...)` — размер;
- если модель пропала, сначала поставь её рядом с камерой и увеличь масштаб;
- для сайта желательно держать одну GLB-модель до 1–3 МБ и сжимать текстуры.

Перед публикацией проверь синтаксис:

```powershell
node --check js/cafe-scene-builder.js
npm.cmd run check
```
