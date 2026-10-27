// @ts-nocheck -- imported Nino code, written for looser TS settings
export const PHRASES: string[] = [
  "E ai! Bora ficar por aqui? 🚀",
  "Tô sempre com você! 💜",
  "Quer ajuda com algo? É só chamar!",
  "Beleza! Tô na área! ⚡",
  "Você consegue! 💜",
  "Vamos nessa! ⭐",
  "Ei! Tô aqui com você! 💜",
  "Pequeno no tamanho, grande na sua jornada!",
];

export function randomPhrase(prev?: string): string {
  let next = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  let guard = 0;
  while (next === prev && guard++ < 6) {
    next = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  }
  return next;
}
