import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

interface NinoListenPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  start(): Promise<void>;
  stop(): Promise<void>;
  speak(options: { text: string }): Promise<void>;
  stopSpeaking(): Promise<void>;
  isRunning(): Promise<{ running: boolean }>;
  addListener(event: "voiceCommand", cb: (e: { text: string }) => void): Promise<PluginListenerHandle>;
}

const NinoListen = registerPlugin<NinoListenPlugin>("NinoListen");

const native = () => Capacitor.getPlatform() === "android";

/** Liga/desliga a escuta em segundo plano. Devolve true se o Nino ficou ouvindo. */
export async function setNativeListening(on: boolean): Promise<boolean> {
  if (!native()) return false;
  try {
    if (!on) {
      await NinoListen.stop();
      return false;
    }
    let { granted } = await NinoListen.hasPermission();
    if (!granted) ({ granted } = await NinoListen.requestPermission());
    if (!granted) return false;
    await NinoListen.start();
    return true;
  } catch {
    return false;
  }
}

export async function getNativeListening(): Promise<boolean> {
  if (!native()) return false;
  try {
    return (await NinoListen.isRunning()).running;
  } catch {
    return false;
  }
}

/** Recebe o que a pessoa falou depois de dizer "Nino". Devolve a função que cancela. */
export function onVoiceCommand(cb: (text: string) => void): () => void {
  if (!native()) return () => {};
  let handle: PluginListenerHandle | null = null;
  let cancelled = false;
  NinoListen.addListener("voiceCommand", (e) => cb(e.text))
    .then((h) => {
      if (cancelled) void h.remove();
      else handle = h;
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    if (handle) void handle.remove();
  };
}

/** Fala com a voz nativa do Android. Devolve false se não for o app ou se a voz nativa falhar. */
export async function nativeSpeak(text: string): Promise<boolean> {
  if (!native()) return false;
  try {
    await NinoListen.stopSpeaking().catch(() => {}); // corta a fala anterior para não se sobreporem
    await NinoListen.speak({ text });
    return true;
  } catch {
    return false; // APK antigo sem a função, ou sem motor de voz: o chamador tenta a voz do navegador
  }
}

/** Para a voz nativa na hora. */
export function nativeStopSpeaking() {
  if (!native()) return;
  NinoListen.stopSpeaking().catch(() => {});
}
