import { Capacitor, registerPlugin } from "@capacitor/core";

interface NinoOverlayPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  start(options?: { skin?: string }): Promise<void>;
  setSkin(options: { skin: string }): Promise<void>;
  stop(): Promise<void>;
}

const NinoOverlay = registerPlugin<NinoOverlayPlugin>("NinoOverlay");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

let wantOn = false;
let wantSkin = "padrao";
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
      if (granted) await NinoOverlay.start({ skin: wantSkin });
    } catch {
      /* ignore */
    }
  };
  document.addEventListener("visibilitychange", retry);
  window.addEventListener("focus", retry);
}

/** Liga/desliga o Nino por cima de outros apps (só no APK Android). */
export async function setNativeOverlay(on: boolean, skin = "padrao") {
  if (!isNativeAndroid()) return;
  wantOn = on;
  wantSkin = skin;
  try {
    if (!on) return await NinoOverlay.stop();
    const { granted } = await NinoOverlay.hasPermission();
    if (!granted) {
      startWhenBackFromSettings();
      return await NinoOverlay.requestPermission();
    }
    await NinoOverlay.start({ skin });
  } catch {
    /* ignore */
  }
}

/** Troca a skin do Nino que já está sobre outros apps (sem precisar desligar e ligar). */
export async function setNativeOverlaySkin(skin: string) {
  if (!isNativeAndroid()) return;
  try {
    await NinoOverlay.setSkin({ skin });
  } catch {
    /* ignore */
  }
}
