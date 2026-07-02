const HIT_SOUND_PARAMS = {
  PERFECT: { freq: 523, waveform: 'triangle', detune: [0, 5], attack: 0.002, decay: 0.3, volume: 1.0, harmonics: 2 },
  GOOD:    { freq: 392, waveform: 'triangle', detune: [],    attack: 0.002, decay: 0.2, volume: 0.8, harmonics: 1 },
  LATE:    { freq: 261, waveform: 'sine',     detune: [],    attack: 0.005, decay: 0.15, volume: 0.5, harmonics: 0 },
  SMASH:   { freq: 659, waveform: 'square',   detune: [0, 7, -7], attack: 0.001, decay: 0.4, volume: 1.2, harmonics: 3, noise: true },
  NORMAL:  { freq: 330, waveform: 'sine',     detune: [],    attack: 0.003, decay: 0.2, volume: 0.7, harmonics: 0 },
};

let audioCtx = null;

function get_audio_context() {
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    } catch (e) {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function play_tone(ctx, freq, waveform, duration, volume, attack, detune_cents) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = waveform;
  osc.frequency.setValueAtTime(freq, now);
  if (detune_cents) {
    osc.detune.setValueAtTime(detune_cents, now);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function play_noise_burst(ctx, duration, volume) {
  const now = ctx.currentTime;
  const sampleRate = ctx.sampleRate || 44100;
  const bufferSize = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + duration + 0.05);
}

function play_hit(quality, is_smash) {
  const ctx = get_audio_context();
  if (!ctx) return;

  let params;
  if (is_smash || quality === 'SMASH') {
    params = HIT_SOUND_PARAMS.SMASH;
  } else {
    params = HIT_SOUND_PARAMS[quality] || HIT_SOUND_PARAMS.NORMAL;
  }

  if (params.detune && params.detune.length > 0) {
    for (const d of params.detune) {
      play_tone(ctx, params.freq, params.waveform, params.decay, params.volume / params.detune.length, params.attack, d);
    }
  } else {
    play_tone(ctx, params.freq, params.waveform, params.decay, params.volume, params.attack);
  }

  if (params.harmonics > 1) {
    for (let i = 1; i < params.harmonics; i++) {
      const harmFreq = params.freq * (i + 1);
      const harmVol = params.volume * 0.3 / (i + 1);
      play_tone(ctx, harmFreq, 'sine', params.decay * 0.8, harmVol, params.attack);
    }
  }

  if (params.noise) {
    play_noise_burst(ctx, params.decay * 0.5, params.volume * 0.3);
  }
}

function play_bounce() {
  const ctx = get_audio_context();
  if (!ctx) return;
  play_tone(ctx, 150, 'sine', 0.1, 0.4, 0.003);
}

function play_net() {
  const ctx = get_audio_context();
  if (!ctx) return;
  play_tone(ctx, 200, 'sine', 0.08, 0.3, 0.003);
}

function play_point_scored() {
  const ctx = get_audio_context();
  if (!ctx) return;

  const now = ctx.currentTime;

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0, now);
  g1.gain.linearRampToValueAtTime(0.5, now + 0.005);
  g1.gain.linearRampToValueAtTime(0, now + 0.15);
  g1.connect(ctx.destination);

  const o1 = ctx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.setValueAtTime(523, now);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0, now + 0.1);
  g2.gain.linearRampToValueAtTime(0.5, now + 0.105);
  g2.gain.linearRampToValueAtTime(0, now + 0.3);

  const o2 = ctx.createOscillator();
  o2.type = 'triangle';
  o2.frequency.setValueAtTime(659, now + 0.1);

  o1.connect(g1);
  o2.connect(g2);
  g2.connect(ctx.destination);

  o1.start(now);
  o1.stop(now + 0.17);
  o2.start(now + 0.1);
  o2.stop(now + 0.32);
}

function play_serve_release() {
  const ctx = get_audio_context();
  if (!ctx) return;
  play_tone(ctx, 440, 'triangle', 0.15, 0.5, 0.002);
}

function play_serve_charge() {
  const ctx = get_audio_context();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.linearRampToValueAtTime(400, now + 0.3);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

function play_ui_select() {
  const ctx = get_audio_context();
  if (!ctx) return;
  play_tone(ctx, 880, 'square', 0.05, 0.2, 0.002);
}

function _reset_audio_context() {
  audioCtx = null;
}

export const sound = {
  play_hit,
  play_bounce,
  play_net,
  play_point_scored,
  play_serve_release,
  play_serve_charge,
  play_ui_select,
  _reset_audio_context,
  _get_audio_context: get_audio_context,
};
