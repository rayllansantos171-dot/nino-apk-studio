import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

interface NinoListenPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  start(): Promise<void>;
  stop(): Promise<void>;
  speak(options: { text: string }): Promise<void>;
  stopSpeaking(): Promise<void>;
  isRunning(): Promise<{ running: boolean }>;
  dictate(): Promise<{ text: string }>;
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

/**
 * Ditado para o chat: fala → texto. No app usa o reconhecimento do Android (pausa a escuta em
 * segundo plano para liberar o microfone); no navegador usa o reconhecimento do navegador.
 * Devolve "" se a pessoa não falou nada; lança erro se o aparelho não suporta.
 */
export async function dictate(): Promise<string> {
  if (native()) {
    const wasOn = await getNativeListening();
    if (wasOn) {
      await NinoListen.stop().catch(() => {});
      await new Promise((r) => setTimeout(r, 400));
    }
    try {
      const { granted } = await NinoListen.hasPermission();
      if (!granted) {
        const r = await NinoListen.requestPermission();
        if (!r.granted) throw new Error("Permita o microfone para falar no chat");
      }
      return ((await NinoListen.dictate()).text || "").trim();
    } finally {
      if (wasOn) await NinoListen.start().catch(() => {});
    }
  }
  type Rec = {
    lang: string;
    interimResults: boolean;
    onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((e: { error?: string }) => void) | null;
    onend: (() => void) | null;
    start(): void;
  };
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) throw new Error("Este navegador não tem reconhecimento de voz");
  return new Promise<string>((resolve, reject) => {
    const rec = new Ctor();
    let text = "";
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.onresult = (e) => {
      text = e.results[0]?.[0]?.transcript ?? "";
    };
    rec.onerror = (e) => {
      if (e.error && e.error !== "no-speech" && e.error !== "aborted") reject(new Error("Não consegui ouvir: " + e.error));
    };
    rec.onend = () => resolve(text.trim());
    rec.start();
  });
}
