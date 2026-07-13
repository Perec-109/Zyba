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
    filter.frequency.value = 1250;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'peaking';
    warmth.frequency.value = 180;
    warmth.Q.value = 0.8;
    warmth.gain.value = 5;

    gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    source.connect(filter).connect(warmth).connect(gainNode).connect(ctx.destination);
    source.start(0);
  }

  async function toggle() {
    try {
      ensureContext();
      if (ctx.state === 'suspended') await ctx.resume();
      enabled = !enabled;
      const now = ctx.currentTime;
      const target = enabled ? 0.085 : 0;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(target, now + 0.45);
      return enabled;
    } catch (error) {
      console.warn('Не удалось запустить атмосферу кофейни', error);
      enabled = false;
      return false;
    }
  }

  return { toggle };
})();
