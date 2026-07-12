/**
 * SOUND — лёгкий эмбиент-гул кофейни, синтезируется через Web Audio API.
 * Без внешних mp3/файлов: коричневый шум + мягкий фильтр = гул помещения.
 * Запускается только по явному действию пользователя (требование браузеров).
 */
const SOUND = (() => {
  let ctx = null, gainNode = null, source = null, enabled = false;

  function ensureContext() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.2; // компенсация громкости
    }

    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    source.connect(filter).connect(gainNode).connect(ctx.destination);
    source.start(0);
  }

  function toggle() {
    ensureContext();
    if (ctx.state === 'suspended') ctx.resume();

    enabled = !enabled;
    const target = enabled ? 0.05 : 0;
    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.8);
    return enabled;
  }

  return { toggle };
})();
