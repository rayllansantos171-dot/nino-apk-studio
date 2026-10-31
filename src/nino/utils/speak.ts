import { nativeSpeak, nativeStopSpeaking } from "./nativeListen";

function webSpeak(clean: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "pt-BR";
    u.rate = 1.05;
    synth.cancel();
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

/** Lê um texto em voz alta (pt-BR), sem os emojis. No Android usa a voz nativa; senão, a do navegador. */
export function speak(text: string) {
  const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\uFE0F]/gu, "").trim();
  if (!clean) return;
  void nativeSpeak(clean).then((ok) => {
    if (!ok) webSpeak(clean);
  });
}

/** Para qualquer fala em andamento (ex.: ao sair do chat ou desligar a voz). */
export function stopSpeaking() {
  nativeStopSpeaking();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
