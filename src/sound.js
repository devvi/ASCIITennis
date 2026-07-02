const HIT_SOUND_PARAMS = {
  PERFECT: { freq: 523, waveform: 'triangle', detune: [0, 5], attack: 0.002, decay: 0.3, volume: 1.0, harmonics: 2 },
  GOOD:    { freq: 392, waveform: 'triangle', detune: [],    attack: 0.002, decay: 0.2, volume: 0.8, harmonics: 1 },
  LATE:    { freq: 261, waveform: 'sine',     detune: [],    attack: 0.005, decay: 0.15, volume: 0.5, harmonics: 0 },
  SMASH:   { freq: 659, waveform: 'square',   detune: [0, 7, -7], attack: 0.001, decay: 0.4, volume: 1.2, harmonics: 3, noise: true },
  NORMAL:  { freq: 330, waveform: 'sine',     detune: [],    attack: 0.003, decay: 0.2, volume: 0.7, harmonics: 0 },
};

let audioCtx = null;

function get_audio_ctx() {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return null;
  if (!audioCtx) {
    const AC = AudioContext || webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function create_tone(ctx, freq, waveform, detune, volume, attack, decay) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = waveform;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  osc.connect(gain);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + attack + decay);

  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + attack + decay + 0.01);

  return { osc, gain };
}

function create_noise_burst(ctx, volume, attack, decay) {
  const bufferSize = ctx.sampleRate * (attack + decay);
  if (bufferSize <= 0) return;
  const buffer = ctx.createBuffer(1, Math.ceil(bufferSize), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + attack + decay);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

function play_hit(quality, is_smash) {
  const ctx = get_audio_ctx();
  if (!ctx) return;

  const effective = is_smash ? 'SMASH' : quality;
  const params = HIT_SOUND_PARAMS[effective] || HIT_SOUND_PARAMS.NORMAL;

  const note_count = Math.max(1, params.harmonics + 1);
  for (let i = 0; i < note_count; i++) {
    const detune_val = params.detune && params.detune.length > i ? params.detune[i] : 0;
    const freq_offset = i === 0 ? 1 : 1 + i * 0.5;
    const vol = i === 0 ? params.volume : params.volume * 0.3;
    create_tone(ctx, params.freq * freq_offset, params.waveform, detune_val, vol, params.attack, params.decay);
  }

  if (params.noise) {
    create_noise_burst(ctx, params.volume * 0.5, params.attack * 0.5, params.decay * 0.5);
  }
}

function play_bounce() {
  const ctx = get_audio_ctx();
  if (!ctx) return;
  create_tone(ctx, 180, 'sine', 0, 0.3, 0.003, 0.08);
}

function play_net() {
  const ctx = get_audio_ctx();
  if (!ctx) return;
  create_tone(ctx, 120, 'square', 0, 0.25, 0.002, 0.06);
}

function play_point_scored() {
  const ctx = get_audio_ctx();
  if (!ctx) return;

  const notes = [523, 659, 784, 1047];
  const now = ctx.currentTime;
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = notes[i];
    osc.connect(gain);
    const start = now + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.4, start + 0.005);
    gain.gain.linearRampToValueAtTime(0, start + 0.2);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.21);
  }
}

function play_serve_release() {
  const ctx = get_audio_ctx();
  if (!ctx) return;
  create_tone(ctx, 880, 'sine', 0, 0.35, 0.002, 0.1);
}

export {
  play_hit,
  play_bounce,
  play_net,
  play_point_scored,
  play_serve_release,
};
