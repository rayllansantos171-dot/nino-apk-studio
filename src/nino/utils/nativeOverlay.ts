import { Capacitor, registerPlugin } from "@capacitor/core";

interface NinoOverlayPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

const NinoOverlay = registerPlugin<NinoOverlayPlugin>("NinoOverlay");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

let wantOn = false;
let waiting = false;

/** Depois que a pessoa libera "Sobrepor a outros apps" nos ajustes, liga o Nino sozinho ao voltar. */
function startWhenBackFromSettings() {
  if (waiting) return;
  waiting = true;
  const retry = async () => {
    if (document.visibilityState !== "visible") return;
    document.removeEventListener("visibilitychange", retry);
    window.removeEventListener("focus", retry);
    waiting = false;
    if (!wantOn) return;
    try {
      const { granted } = await NinoOverlay.hasPermission();
      if (granted) await NinoOverlay.start();
    } catch {
      /* ignore */
    }
  };
  document.addEventListener("visibilitychange", retry);
  window.addEventListener("focus", retry);
}

/** Liga/desliga o Nino por cima de outros apps (só no APK Android). */
export async function setNativeOverlay(on: boolean) {
  if (!isNativeAndroid()) return;
  wantOn = on;
  try {
    if (!on) return await NinoOverlay.stop();
    const { granted } = await NinoOverlay.hasPermission();
    if (!granted) {
      startWhenBackFromSettings();
      return await NinoOverlay.requestPermission();
    }
    await NinoOverlay.start();
  } catch {
    /* ignore */
  }
}
