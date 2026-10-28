/** Lê um texto em voz alta (pt-BR), sem os emojis. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\uFE0F]/gu, "").trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "pt-BR";
    u.rate = 1.05;
    synth.cancel();
    synth.speak(u);
  } catch {
    /* ignore */
  }
}
