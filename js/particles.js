/**
 * PARTICLES — лёгкая система пара (над чашками в баре) и пыли в свете (весь путь).
 * Реализована через THREE.Points — один draw call на систему, дёшево даже на мобиле.
 */
const PARTICLES = (() => {

  function makeSteamSystem(origins, count) {
    if (!origins.length || count <= 0) return null;
    const perOrigin = Math.max(2, Math.floor(count / origins.length));
    const total = perOrigin * origins.length;

    const positions = new Float32Array(total * 3);
    const speeds = new Float32Array(total);
    const offsets = new Float32Array(total);
    const originIndex = new Uint16Array(total);

    let idx = 0;
    origins.forEach((origin, oi) => {
      for (let i = 0; i < perOrigin; i++) {
        positions[idx * 3 + 0] = origin.x + (Math.random() - 0.5) * 0.06;
        positions[idx * 3 + 1] = origin.y + Math.random() * 0.3;
        positions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.06;
        speeds[idx] = 0.25 + Math.random() * 0.25;
        offsets[idx] = Math.random() * Math.PI * 2;
        originIndex[idx] = oi;
        idx++;
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xF2E6D3,
      size: 0.045,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;

    return {
      points,
      update(t) {
        const pos = geo.attributes.position.array;
        for (let i = 0; i < total; i++) {
          const origin = origins[originIndex[i]];
          const life = (t * speeds[i] + offsets[i]) % (Math.PI * 2);
          const rise = (life / (Math.PI * 2)); // 0..1
          pos[i * 3 + 1] = origin.y + rise * 0.9;
          pos[i * 3 + 0] = origin.x + Math.sin(life * 2 + offsets[i]) * 0.05 * rise;
          pos[i * 3 + 2] = origin.z + Math.cos(life * 1.6 + offsets[i]) * 0.04 * rise;
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = 0.35;
      }
    };
  }

  function makeDustSystem(count, bounds) {
    if (count <= 0) return null;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * bounds.width;
      positions[i * 3 + 1] = Math.random() * bounds.height;
      positions[i * 3 + 2] = -Math.random() * bounds.depth;
      speeds[i] = 0.02 + Math.random() * 0.03;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xE8B85C,
      size: 0.018,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;

    return {
      points,
      update(t) {
        const pos = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
          pos[i * 3 + 1] += speeds[i] * 0.016;
          if (pos[i * 3 + 1] > bounds.height) pos[i * 3 + 1] = 0;
        }
        geo.attributes.position.needsUpdate = true;
      }
    };
  }

  return { makeSteamSystem, makeDustSystem };
})();
