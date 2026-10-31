import { Capacitor, registerPlugin } from "@capacitor/core";

interface NinoOverlayPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  start(options?: { skin?: string }): Promise<void>;
  setSkin(options: { skin: string }): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<{ running: boolean }>;
  setTheme(options: { accent: string; accent2: string; soft: string }): Promise<void>;
  say(options: { text: string }): Promise<void>;
}

const NinoOverlay = registerPlugin<NinoOverlayPlugin>("NinoOverlay");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

let wantOn = false;
let wantSkin = "padrao";
let waitTimer: number | null = null;

/** O Nino está de fato sobre outros apps agora? (o serviço nativo é a fonte da verdade) */
export async function getNativeOverlayRunning(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    return (await NinoOverlay.isRunning()).running;
  } catch {
    return false;
  }
}

/**
 * Depois que a pessoa libera "Sobrepor a outros apps" nos ajustes do Android, liga o Nino sozinho
 * quando ela volta. Confere a permissão de tempos em tempos (até 3 min), sem depender de um único evento.
 */
function startWhenPermissionGranted() {
  if (waitTimer !== null) return;
  const startedAt = Date.now();
  waitTimer = window.setInterval(async () => {
    if (!wantOn || Date.now() - startedAt > 180000) {
      stopWaiting();
      return;
    }
    if (document.visibilityState !== "visible") return;
    try {
      const { granted } = await NinoOverlay.hasPermission();
      if (granted) {
        stopWaiting();
        await NinoOverlay.start({ skin: wantSkin });
      }
    } catch {
      /* tenta de novo no próximo ciclo */
    }
  }, 1000);
}

function stopWaiting() {
  if (waitTimer !== null) {
    window.clearInterval(waitTimer);
    waitTimer = null;
  }
}

/** Liga/desliga o Nino por cima de outros apps (só no APK Android). Devolve true se ele ficou ligado. */
export async function setNativeOverlay(on: boolean, skin = "padrao"): Promise<boolean> {
  if (!isNativeAndroid()) return on;
  wantOn = on;
  wantSkin = skin;
  try {
    if (!on) {
      stopWaiting();
      await NinoOverlay.stop();
      return false;
    }
    const { granted } = await NinoOverlay.hasPermission();
    if (!granted) {
      startWhenPermissionGranted();
      await NinoOverlay.requestPermission();
      return false;
    }
    await NinoOverlay.start({ skin });
    return true;
  } catch {
    return false;
  }
}

/** Troca a skin do Nino que já está sobre outros apps (sem precisar desligar e ligar). */
export async function setNativeOverlaySkin(skin: string) {
  if (!isNativeAndroid()) return;
  wantSkin = skin;
  try {
    await NinoOverlay.setSkin({ skin });
  } catch {
    /* ignore */
  }
}

/** Passa a cor do tema (roxo, rosa, azul, verde) para o Nino que fica sobre outros apps. */
export async function setNativeOverlayTheme(accent: string, accent2: string, soft: string) {
  if (!isNativeAndroid()) return;
  try {
    await NinoOverlay.setTheme({ accent, accent2, soft });
  } catch {
    /* APK antigo sem essa função */
  }
}

/** Mostra um balão de fala no Nino que está sobre outros apps. */
export async function nativeOverlaySay(text: string) {
  if (!isNativeAndroid()) return;
  try {
    await NinoOverlay.say({ text });
  } catch {
    /* ignore */
  }
}
