// @ts-nocheck -- imported Nino code, written for looser TS settings
// Motor de física e comportamento do Nino (sem dependência de React).
// Gravidade, queda, arremesso, dano, humor, sono e personalidade.
import { baseExpression, moodLabel, pick } from "./personality";

export type Expression =
  | "normal"
  | "happy"
  | "wink"
  | "surprise"
  | "angry"
  | "dizzy"
  | "sad"
  | "love"
  | "sleep";

export type Action =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "wave"
  | "dance"
  | "sit"
  | "panic"
  | "look"
  | "hang"
  | "fall"
  | "land"
  | "hurt"
  | "dazed"
  | "ko"
  | "getup"
  | "sleep"
  | "cry"
  | "stomp"
  | "laugh"
  | "spin"
  | "flip"
  | "clap"
  | "flex"
  | "bow"
  | "think";

export type Tool = "grab" | "punch" | "pet";
export type SoundName = "step" | "hit" | "pop" | "thud" | "whoosh" | "ko" | "heal";

export interface Arena {
  left: number;
  right: number;
  top: number;
  floor: number;
}

export interface Fx {
  kind: string;
  text: string;
  x: number;
  y: number;
}

export interface Snapshot {
  x: number;
  y: number;
  w: number;
  h: number;
  action: Action;
  expression: Expression;
  flip: boolean;
  bubble: string | null;
  hp: number;
  maxHp: number;
  mood: number;
  moodLabel: string;
  held: boolean;
  flash: boolean;
}

export interface EngineOptions {
  roaming: boolean;
  bubbles: boolean;
  speed: "slow" | "normal" | "fast";
  freeDrag: boolean;
}

export interface EngineConfig {
  getArena: () => Arena;
  getWidth: () => number;
  getOptions: () => EngineOptions;
  onChange: (s: Snapshot) => void;
  onFx: (fx: Fx) => void;
  onSound?: (n: SoundName) => void;
  raf?: (cb: (t: number) => void) => number;
  caf?: (id: number) => void;
  now?: () => number;
}

const G = 2200; // gravidade em px/s²
export const MAX_HP = 10; // em meios corações (5 corações)
const WALK_PX = { slow: 42, normal: 72, fast: 140 };

type Mode = "ground" | "air" | "held" | "sleep";
type Src = "jump" | "hit" | "thrown" | "dropped";

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function createNinoEngine(cfg: EngineConfig) {
  const nowFn = cfg.now ?? (() => performance.now());
  const rafFn = cfg.raf ?? ((cb: (t: number) => void) => requestAnimationFrame(cb));
  const cafFn = cfg.caf ?? ((id: number) => cancelAnimationFrame(id));

  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let mode: Mode = "ground";
  let src: Src = "jump";
  let action: Action = "idle";
  let expr: Expression = "normal";
  let flip = false;
  let bubble: string | null = null;
  let bubbleUntil = 0;
  let hp = MAX_HP;
  let mood = 55;
  let lockUntil = 0;
  let onUnlock: (() => void) | null = null;
  let lastInteract = 0;
  let lastHit = 0;
  let combo = 0;
  let target: number | null = null;
  let nextActAt = 0;
  let walkSoundAt = 0;
  let lastTick = 0;
  let lastRegen = 0;
  let lastMood = 0;
  let lastZzz = 0;
  let lastTalk = 0;
  let flashUntil = 0;
  let shakeUntil = 0;
  let heightWarnAt = 0;
  let pendingCmd: string | null = null;
  let boostUntil = 0;
  let lastDir = 0;
  let lastPx = 0;
  let reversals: number[] = [];
  let hist: { x: number; y: number; t: number }[] = [];
  let drag: { dx: number; dy: number; sx: number; sy: number; moved: boolean } | null = null;
  let running = false;
  let rafId = 0;

  const width = () => cfg.getWidth();
  const height = () => cfg.getWidth() * (170 / 120);

  function snapshot(): Snapshot {
    const t = nowFn();
    return {
      x,
      y,
      w: width(),
      h: height(),
      action,
      expression: expr,
      flip,
      bubble: cfg.getOptions().bubbles ? bubble : null,
      hp,
      maxHp: MAX_HP,
      mood: Math.round(mood),
      moodLabel: moodLabel(mood),
      held: mode === "held",
      flash: t < flashUntil,
    };
  }

  const sound = (n: SoundName) => {
    if (cfg.onSound) cfg.onSound(n);
  };
  const fx = (kind: string, text: string, fxX: number, fxY: number) => cfg.onFx({ kind, text, x: fxX, y: fxY });
  const headPos = () => ({ x: x + width() / 2, y: y + height() * 0.1 });

  function baseExpr(): Expression {
    return baseExpression(mood, nowFn() - lastHit < 6000 && combo >= 6);
  }

  function say(kind: string, ms = 2600) {
    bubble = pick(kind);
    bubbleUntil = nowFn() + ms;
  }

  function lock(ms: number, then?: () => void) {
    lockUntil = nowFn() + ms;
    onUnlock = then ?? null;
  }

  function defaultUnlock() {
    if (mode === "air") {
      action = src === "jump" ? "jump" : "fall";
      expr = "surprise";
    } else if (mode === "ground") {
      action = "idle";
      expr = baseExpr();
    }
  }

  function interact() {
    lastInteract = nowFn();
  }

  function wake() {
    if (mode === "sleep") {
      mode = "ground";
      action = "idle";
      expr = "surprise";
      mood = clamp(mood - 4, 0, 100);
      say("wake", 2200);
      lock(900);
    }
  }

  // Só uma queda muito forte com a vida já baixa derruba o Nino de vez; o resto deixa pelo menos meio coração.
  function damage(n: number, lethal = false) {
    hp = Math.max(lethal ? 0 : 1, hp - n);
  }

  // Deitado, o corpo ocupa ~1,2 largura para o lado: vira para onde há espaço na tela.
  function placeForKo() {
    const a = cfg.getArena();
    const w = width();
    const room = w * 1.22;
    const cx = x + w / 2;
    if (cx + room > a.right) flip = true;
    else if (cx - room < a.left) flip = false;
    else flip = cx > (a.left + a.right) / 2;
    if (flip) x = Math.max(x, a.left + room - w / 2);
    else x = Math.min(x, a.right - room - w / 2);
    x = clamp(x, a.left, Math.max(a.left, a.right - w));
  }

  function faint() {
    placeForKo();
    mode = "ground";
    vx = 0;
    vy = 0;
    target = null;
    action = "ko";
    expr = "dizzy";
    say("ko", 2600);
    sound("ko");
    const hd = headPos();
    fx("star", "★", hd.x, hd.y);
    lock(3500, () => {
      hp = 7;
      mood = 40;
      action = "getup";
      expr = "surprise";
      say("revive", 2400);
      sound("heal");
      lock(700);
    });
  }

  function land() {
    const a = cfg.getArena();
    const h = height();
    y = a.floor - h;
    let v = Math.abs(vy);
    const cx = x + width() / 2;
    if (src === "jump" || src === "hit") v = Math.min(v, src === "hit" ? 540 : 520);
    const first = src === "thrown" || src === "dropped";

    if (v < 560) {
      if (v > 260) {
        fx("dust", "▫ ▪ ▫", cx, a.floor);
        sound("thud");
        action = "land";
        lock(260);
      }
      vx *= 0.6;
      if (v > 300) {
        vy = -v * 0.3;
        mode = "air";
        src = "jump";
      } else {
        vy = 0;
        mode = "ground";
      }
      if (first && v > 260) {
        say("landSoft", 2000);
        mood = clamp(mood + 3, 0, 100);
      }
    } else if (v < 1000) {
      damage(1);
      mood = clamp(mood - 6, 0, 100);
      action = "hurt";
      expr = "sad";
      flashUntil = nowFn() + 420;
      say("hurtFall", 2400);
      fx("hit", "BONK!", cx, a.floor - h * 0.3);
      sound("thud");
      lock(700);
      vy = -v * 0.28;
      vx *= 0.5;
      mode = "air";
      src = "jump";
    } else if (v < 1500) {
      damage(2);
      mood = clamp(mood - 10, 0, 100);
      action = "dazed";
      expr = "dizzy";
      flashUntil = nowFn() + 420;
      say("dazed", 2600);
      fx("hit", "POW!", cx, a.floor - h * 0.3);
      sound("thud");
      vx = 0;
      vy = 0;
      mode = "ground";
      lock(2600);
    } else {
      damage(3, true);
      mood = clamp(mood - 16, 0, 100);
      action = "ko";
      expr = "dizzy";
      flashUntil = nowFn() + 420;
      say("ko", 2600);
      fx("hit", "CRASH!", cx, a.floor - h * 0.3);
      sound("ko");
      placeForKo();
      vx = 0;
      vy = 0;
      mode = "ground";
      lock(3400, () => {
        action = "getup";
        expr = baseExpr();
        say("getup", 2000);
        lock(700);
      });
    }
    if (hp === 0) faint();
  }

  function startSleep() {
    mode = "sleep";
    target = null;
    vx = 0;
    action = "sleep";
    expr = "sleep";
    say("sleep", 2500);
  }

  function chooseActivity(t: number) {
    const o = cfg.getOptions();
    const a = cfg.getArena();
    const w = width();
    const r = Math.random();
    if (o.roaming && r < 0.5) {
      target = rand(a.left + 8, Math.max(a.left + 9, a.right - w - 8));
      if (Math.random() > 0.55 && t - lastTalk > 3500) {
        say("walk", 2200);
        lastTalk = t;
      }
      return;
    }
    if (r < 0.62) {
      vy = -950;
      vx = 0;
      mode = "air";
      src = "jump";
      action = "jump";
      expr = "happy";
      if (Math.random() < 0.25) {
        action = "flip";
        vy = -1050;
        lock(950);
      }
      if (Math.random() > 0.5 && t - lastTalk > 3500) {
        say("jump", 1800);
        lastTalk = t;
      }
      return;
    }
    let acts: Array<[Action, Expression, number, string]>;
    if (mood < 30) acts = [["stomp", "angry", 2200, "idleAngry"]];
    else if (mood < 40) acts = [["sit", "sad", 3200, "idleSad"], ["look", "sad", 2400, "idleSad"]];
    else if (mood >= 85) acts = [["dance", "love", 3200, "idleLove"], ["wave", "love", 2200, "idleLove"], ["laugh", "happy", 1600, "idleHappy"]];
    else if (mood >= 68) acts = [["dance", "happy", 3200, "idleHappy"], ["wave", "happy", 2200, "idleHappy"], ["laugh", "happy", 1600, "idleHappy"], ["spin", "happy", 1500, "idleHappy"], ["clap", "happy", 2200, "idleHappy"], ["flex", "happy", 2200, "idleHappy"]];
    else acts = [["wave", "happy", 2200, "idle"], ["look", "normal", 2400, "idle"], ["sit", "normal", 3600, "idle"], ["dance", "happy", 3000, "idle"], ["spin", "happy", 1500, "idle"], ["clap", "happy", 2200, "idle"], ["flex", "happy", 2200, "idle"], ["bow", "normal", 1800, "idle"], ["think", "normal", 2600, "idle"]];
    const g = acts[Math.floor(Math.random() * acts.length)];
    action = g[0];
    expr = g[1];
    if (Math.random() > 0.25 && t - lastTalk > 3500) {
      say(g[3], g[2]);
      lastTalk = t;
    }
    lock(g[2]);
    nextActAt = t + g[2] + rand(1200, 2600);
  }

  function step(dt: number, t: number) {
    const a = cfg.getArena();
    const w = width();
    const h = height();
    const o = cfg.getOptions();

    if (bubble && t >= bubbleUntil) bubble = null;

    // humor volta devagar ao normal; vida regenera parado
    if (t - lastMood > 1000) {
      lastMood = t;
      mood = clamp(mood + (55 - mood) * 0.015, 0, 100);
      if (mode === "ground" && !lockUntil && hp < MAX_HP && t - lastRegen > 4500 && hp > 0) {
        lastRegen = t;
        hp += 1;
        sound("heal");
        const hd = headPos();
        fx("heart", "♥", hd.x, hd.y);
      }
    }

    if (lockUntil && t >= lockUntil) {
      lockUntil = 0;
      const f = onUnlock;
      onUnlock = null;
      if (f) f();
      else defaultUnlock();
    }

    if (mode === "held") {
      expr = t < shakeUntil ? "dizzy" : "surprise";
      action = "hang";
      return;
    }

    if (mode === "air") {
      vy += G * dt;
      x += vx * dt;
      y += vy * dt;
      if (x < a.left) {
        x = a.left;
        if (Math.abs(vx) > 900) {
          mood = clamp(mood - 4, 0, 100);
          fx("hit", "BAM!", x + w * 0.3, y + h * 0.4);
          say("wall", 1800);
          sound("hit");
          flashUntil = t + 380;
        }
        vx = -vx * 0.5;
      } else if (x > a.right - w) {
        x = a.right - w;
        if (Math.abs(vx) > 900) {
          mood = clamp(mood - 4, 0, 100);
          fx("hit", "BAM!", x + w * 0.7, y + h * 0.4);
          say("wall", 1800);
          sound("hit");
          flashUntil = t + 380;
        }
        vx = -vx * 0.5;
      }
      if (y < a.top) {
        y = a.top;
        vy = Math.abs(vy) * 0.3;
      }
      if (!lockUntil) {
        action = src === "jump" ? "jump" : "fall";
        if (expr !== "dizzy") expr = "surprise";
      }
      if (y + h >= a.floor) land();
      return;
    }

    // mantém no chão e dentro das paredes (tela redimensionada, Nino maior etc.)
    x = clamp(x, a.left, Math.max(a.left, a.right - w));
    y = a.floor - h;

    if (mode === "sleep") {
      if (t - lastZzz > 1700) {
        lastZzz = t;
        const hd = headPos();
        fx("zzz", "Z", hd.x + w * 0.2, hd.y);
      }
      return;
    }

    if (pendingCmd && !lockUntil) {
      const c = pendingCmd;
      pendingCmd = null;
      command(c);
      return;
    }

    if (lockUntil) {
      if (Math.abs(vx) > 12) {
        vx *= Math.exp(-6 * dt);
        x = clamp(x + vx * dt, a.left, a.right - w);
      }
      return;
    }

    if (Math.abs(vx) > 12) {
      vx *= Math.exp(-6 * dt);
      x = clamp(x + vx * dt, a.left, a.right - w);
      return;
    }
    vx = 0;

    if (t - lastInteract > 45000 && mood >= 30) {
      startSleep();
      return;
    }

    if (target !== null) {
      const boosted = t < boostUntil;
      const speed = WALK_PX[o.speed] * (boosted ? 2.2 : 1);
      const dist = target - x;
      if (Math.abs(dist) <= speed * dt + 1) {
        x = target;
        target = null;
        action = "idle";
        nextActAt = t + rand(1200, 3500);
      } else {
        const dir = dist > 0 ? 1 : -1;
        x += dir * speed * dt;
        flip = dir < 0;
        action = o.speed === "fast" || boosted ? "run" : "walk";
        if (t >= walkSoundAt) {
          walkSoundAt = t + (o.speed === "fast" ? 220 : 380);
          sound("step");
        }
      }
    } else if (t >= nextActAt) {
      nextActAt = t + rand(1500, 3200);
      chooseActivity(t);
    } else if (action === "walk" || action === "run") {
      action = "idle";
    }
    if (!lockUntil && action === "idle") expr = baseExpr();
  }

  function frame() {
    if (!running) return;
    const t = nowFn();
    let dt = (t - lastTick) / 1000;
    lastTick = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    step(dt, t);
    cfg.onChange(snapshot());
    rafId = rafFn(frame);
  }

  /* ===== Interações ===== */

  function hit(px: number, py: number) {
    wake();
    interact();
    const t = nowFn();
    combo = t - lastHit < 2200 ? combo + 1 : 1;
    lastHit = t;
    drag = null;
    hist = [];
    target = null;
    const dir = x + width() / 2 >= px ? 1 : -1;
    vx = dir * rand(380, 600);
    vy = -rand(520, 780);
    mode = "air";
    src = "hit";
    mood = clamp(mood - 8, 0, 100);
    if (combo % 3 === 0) damage(1);
    action = "hurt";
    expr = "surprise";
    flashUntil = t + 380;
    const words = ["POW!", "BAM!", "BONK!", "POFT!"];
    fx("hit", words[Math.floor(Math.random() * words.length)], px, py);
    sound("hit");
    if (combo >= 6) say("hitCry", 3000);
    else if (combo >= 3) say("hitCombo", 2400);
    else say("hit", 1600);
    lock(420, () => {
      defaultUnlock();
      if (combo >= 6) expr = "sad";
      else if (combo >= 3) expr = "angry";
    });
  }

  function pet() {
    wake();
    interact();
    const hd = headPos();
    fx("heart", "♥", hd.x - 10, hd.y);
    fx("heart", "♥", hd.x + 14, hd.y + 8);
    sound("pop");
    if (mode !== "ground" || action === "ko" || action === "dazed") return;
    const was = mood;
    mood = clamp(mood + 14, 0, 100);
    target = null;
    expr = "love";
    action = "laugh";
    say(was < 30 ? "forgive" : "pet", 2400);
    lock(1300);
  }

  function poke() {
    wake();
    interact();
    sound("pop");
    if (mode !== "ground" || action === "ko" || action === "dazed") return;
    target = null;
    mood = clamp(mood + 1, 0, 100);
    say(mood < 30 ? "pokeAngry" : "poke", 2000);
    vy = -460;
    vx = 0;
    mode = "air";
    src = "jump";
    action = "jump";
    expr = "surprise";
  }

  function beginHold(t: number) {
    wake();
    interact();
    lockUntil = 0;
    onUnlock = null;
    target = null;
    mode = "held";
    action = "hang";
    expr = "surprise";
    vx = 0;
    vy = 0;
    reversals = [];
    lastDir = 0;
    say("pickup", 2200);
    sound("pop");
    heightWarnAt = t + 1500;
  }

  function pointerDown(px: number, py: number, tool: Tool) {
    if (tool === "punch") {
      hit(px, py);
      return;
    }
    if (tool === "pet") {
      pet();
      return;
    }
    if (!cfg.getOptions().freeDrag) {
      poke();
      return;
    }
    drag = { dx: px - x, dy: py - y, sx: px, sy: py, moved: false };
    hist = [{ x: px, y: py, t: nowFn() }];
    lastPx = px;
  }

  function pointerMove(px: number, py: number) {
    const d = drag;
    if (!d) return;
    const t = nowFn();
    if (!d.moved) {
      if (Math.abs(px - d.sx) + Math.abs(py - d.sy) <= 6) return;
      d.moved = true;
      beginHold(t);
    }
    if (mode !== "held") return;
    const a = cfg.getArena();
    const w = width();
    const h = height();
    x = clamp(px - d.dx, a.left, a.right - w);
    y = clamp(py - d.dy, a.top, a.floor - h);
    hist.push({ x: px, y: py, t });
    while (hist.length > 2 && t - hist[0].t > 150) hist.shift();

    const dxm = px - lastPx;
    if (Math.abs(dxm) > 5) {
      const dir = dxm > 0 ? 1 : -1;
      if (lastDir && dir !== lastDir) reversals.push(t);
      lastDir = dir;
      lastPx = px;
      reversals = reversals.filter((r) => t - r < 1200);
      if (reversals.length >= 6) {
        reversals = [];
        mood = clamp(mood - 8, 0, 100);
        shakeUntil = t + 2200;
        say("shake", 2200);
        const hd = headPos();
        fx("star", "★", hd.x, hd.y);
      }
    }

    const above = a.floor - (y + h);
    if (above > 200 && t > heightWarnAt) {
      heightWarnAt = t + 4000;
      say("height", 2500);
      const hd = headPos();
      fx("sweat", "💧", hd.x + w * 0.35, hd.y + 6);
    }
  }

  function pointerUp() {
    const d = drag;
    drag = null;
    if (!d) return;
    if (!d.moved) {
      poke();
      return;
    }
    if (mode !== "held") return;
    const t = nowFn();
    const a = cfg.getArena();
    const h = height();
    let nvx = 0;
    let nvy = 0;
    if (hist.length >= 2 && t - hist[hist.length - 1].t < 120) {
      const f = hist[0];
      const l = hist[hist.length - 1];
      const dt = Math.max(0.016, (l.t - f.t) / 1000);
      nvx = clamp((l.x - f.x) / dt, -2600, 2600);
      nvy = clamp((l.y - f.y) / dt, -2600, 2600);
    }
    hist = [];
    const speed = Math.hypot(nvx, nvy);
    const above = a.floor - (y + h);
    if (above < 6 && speed < 300) {
      mode = "ground";
      vx = 0;
      vy = 0;
      y = a.floor - h;
      action = "idle";
      expr = baseExpr();
      return;
    }
    vx = nvx;
    vy = nvy;
    mode = "air";
    src = speed > 700 ? "thrown" : "dropped";
    action = "fall";
    expr = "surprise";
    sound("whoosh");
    if (speed > 700) say("thrown", 1800);
    else if (above > 140) say("fall", 2000);
  }

  function reset() {
    const a = cfg.getArena();
    const t = nowFn();
    x = a.right - width() - 24;
    y = a.floor - height();
    vx = 0;
    vy = 0;
    mode = "ground";
    action = "idle";
    expr = "normal";
    flip = false;
    bubble = null;
    hp = MAX_HP;
    mood = 55;
    lockUntil = 0;
    onUnlock = null;
    target = null;
    drag = null;
    combo = 0;
    lastHit = 0;
    lastInteract = t;
    nextActAt = t + 3500;
    lastTick = t;
    lastRegen = t;
    lastMood = t;
    lastTalk = t;
  }

  /** Texto livre no balão (respostas da IA ou falas montadas pelo app). */
  function speak(text: string) {
    const t = nowFn();
    bubble = text;
    bubbleUntil = t + clamp(2200 + text.length * 55, 2600, 9000);
    lastTalk = t;
    if (action === "think") {
      lockUntil = 0;
      onUnlock = null;
      defaultUnlock();
    }
  }

  /** Mostra que o Nino está pensando enquanto a resposta não chega. */
  function think() {
    wake();
    interact();
    if (mode !== "ground" || lockUntil) return;
    target = null;
    action = "think";
    expr = "normal";
    say("cmdListen", 2400);
    lock(9000);
  }

  const TIMED: Record<string, [Action, Expression, number]> = {
    dance: ["dance", "happy", 3600],
    wave: ["wave", "happy", 2400],
    sit: ["sit", "normal", 4500],
    spin: ["spin", "happy", 1800],
    clap: ["clap", "happy", 2600],
    flex: ["flex", "happy", 2600],
    bow: ["bow", "normal", 2200],
    laugh: ["laugh", "happy", 2000],
    cry: ["cry", "sad", 3000],
    angry: ["stomp", "angry", 2400],
    love: ["laugh", "love", 2200],
    think: ["think", "normal", 3200],
  };
  const CMD_LINE: Record<string, string> = {
    jump: "cmdJump", flip: "cmdFlip", dance: "cmdDance", wave: "cmdWave", sit: "cmdSit", sleep: "cmdSleep",
    spin: "cmdSpin", clap: "cmdClap", flex: "cmdFlex", bow: "cmdBow", laugh: "cmdLaugh", cry: "cmdCry",
    angry: "cmdAngry", love: "cmdLove", think: "cmdThink", walk: "cmdWalk", run: "cmdRun", stop: "cmdStop",
  };

  /** Executa uma ordem dada por voz ("Nino, pula!"). Devolve false se ele não pode agora. */
  function command(name: string): boolean {
    const t = nowFn();
    if (mode === "held") return false;
    if (mode === "air") {
      if (name !== "jump" && name !== "flip") pendingCmd = name;
      return true;
    }
    if (mode === "ground" && lockUntil && (action === "ko" || action === "dazed" || action === "hurt" || action === "getup")) {
      return false;
    }
    wake();
    interact();
    lockUntil = 0;
    onUnlock = null;
    target = null;
    const line = CMD_LINE[name] ?? "cmdHeard";
    const a = cfg.getArena();
    const w = width();

    if (name === "jump" || name === "flip") {
      vy = name === "flip" ? -1050 : -950;
      vx = 0;
      mode = "air";
      src = "jump";
      action = name === "flip" ? "flip" : "jump";
      expr = "happy";
      say(line, 1800);
      sound("pop");
      if (name === "flip") lock(950);
      nextActAt = t + 2500;
      return true;
    }
    if (name === "sleep") {
      startSleep();
      say(line, 2200);
      return true;
    }
    if (name === "walk" || name === "run") {
      target = rand(a.left + 8, Math.max(a.left + 9, a.right - w - 8));
      if (name === "run") boostUntil = t + 5000;
      say(line, 2000);
      return true;
    }
    if (name === "stop") {
      action = "idle";
      expr = baseExpr();
      say(line, 1800);
      nextActAt = t + 7000;
      return true;
    }
    const timed = TIMED[name];
    if (!timed) {
      say("cmdHeard", 1800);
      return false;
    }
    action = timed[0];
    expr = timed[1];
    if (name === "love" || name === "laugh") mood = clamp(mood + 6, 0, 100);
    if (name === "love") {
      const hd = headPos();
      fx("heart", "♥", hd.x - 10, hd.y);
      fx("heart", "♥", hd.x + 14, hd.y + 8);
    }
    say(line, Math.min(timed[2], 2600));
    sound("pop");
    lock(timed[2]);
    nextActAt = t + timed[2] + 1500;
    return true;
  }

  function greet() {
    action = "wave";
    expr = "happy";
    say("greet", 2400);
    lock(2200);
  }

  function start() {
    if (running) return;
    running = true;
    reset();
    rafId = rafFn(frame);
  }

  function stop() {
    running = false;
    cafFn(rafId);
  }

  return {
    start,
    stop,
    greet,
    command,
    speak,
    think,
    pointerDown,
    pointerMove,
    pointerUp,
    snapshot,
    step,
    forceFrame: frame,
  };
}

export type NinoEngine = ReturnType<typeof createNinoEngine>;
