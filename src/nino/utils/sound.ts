let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  } catch {
    return null;
  }
}

function beep(freq: number, duration = 0.06, volume = 0.03, type: OscillatorType = "square", slideTo?: number) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => undefined);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration);
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function playStep() {
  beep(160 + Math.random() * 40, 0.05, 0.025);
}

export function playPop() {
  beep(520, 0.07, 0.04, "triangle");
  setTimeout(() => beep(760, 0.08, 0.04, "triangle"), 60);
}

export function playSend() {
  beep(440, 0.06, 0.04, "triangle");
}

export function playHit() {
  beep(220, 0.12, 0.06, "sawtooth", 70);
}

export function playThud() {
  beep(110, 0.14, 0.07, "square", 45);
}

export function playWhoosh() {
  beep(900, 0.35, 0.025, "triangle", 200);
}

export function playKo() {
  beep(300, 0.5, 0.05, "square", 60);
}

export function playHeal() {
  beep(660, 0.08, 0.035, "triangle");
  setTimeout(() => beep(990, 0.1, 0.035, "triangle"), 80);
}

export function playBang() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => undefined);
  const len = Math.floor(c.sampleRate * 0.18);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = 0.16;
  src.connect(g);
  g.connect(c.destination);
  src.start();
  beep(90, 0.15, 0.06, "square", 40);
}

export function playByName(name: string) {
  switch (name) {
    case "step":
      return playStep();
    case "hit":
      return playHit();
    case "pop":
      return playPop();
    case "thud":
      return playThud();
    case "whoosh":
      return playWhoosh();
    case "ko":
      return playKo();
    case "heal":
      return playHeal();
    default:
      return undefined;
  }
}

export function vibrate(ms = 30) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
