import { Capacitor, registerPlugin } from "@capacitor/core";

interface NinoOverlayPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

const NinoOverlay = registerPlugin<NinoOverlayPlugin>("NinoOverlay");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

/** Liga/desliga o Nino por cima de outros apps (só no APK Android). */
export async function setNativeOverlay(on: boolean) {
  if (!isNativeAndroid()) return;
  try {
    if (!on) return await NinoOverlay.stop();
    const { granted } = await NinoOverlay.hasPermission();
    if (!granted) return await NinoOverlay.requestPermission();
    await NinoOverlay.start();
  } catch {
    /* ignore */
  }
}
