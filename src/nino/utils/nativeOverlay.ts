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
let pending: ((ok: boolean) => void) | null = null;

/** Espera a pessoa voltar dos ajustes do Android e diz se a permissão foi liberada. */
function waitBackFromSettings(): Promise<boolean> {
  // Se já havia uma espera, encerra ela como "não liberou" para não travar.
  pending?.(false);
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      document.removeEventListener("visibilitychange", retry);
      window.removeEventListener("focus", retry);
      if (pending === done) pending = null;
      resolve(ok);
    };
    pending = done;
    const retry = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const { granted } = await NinoOverlay.hasPermission();
        if (granted && wantOn) await NinoOverlay.start({ skin: wantSkin });
        done(granted && wantOn);
      } catch {
        done(false);
      }
    };
    document.addEventListener("visibilitychange", retry);
    window.addEventListener("focus", retry);
  });
}

/** Liga/desliga o Nino por cima de outros apps (só no APK). Devolve true se ele ficou ligado. */
export async function setNativeOverlay(on: boolean, skin = "padrao"): Promise<boolean> {
  if (!isNativeAndroid()) return on;
  wantOn = on;
  wantSkin = skin;
  try {
    if (!on) {
      pending?.(false);
      await NinoOverlay.stop();
      return false;
    }
    const { granted } = await NinoOverlay.hasPermission();
    if (!granted) {
      const back = waitBackFromSettings();
      await NinoOverlay.requestPermission();
      return await back;
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
  try {
    await NinoOverlay.setSkin({ skin });
  } catch {
    /* ignore */
  }
}
