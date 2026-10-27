// Personalidade do Nino: dramático, brincalhão, um pouco atrevido e muito carinhoso.
// As falas mudam conforme o humor e o que aconteceu com ele.

export type Mood = "furioso" | "chateado" | "normal" | "feliz" | "apaixonado";

export const LINES: Record<string, string[]> = {
  greet: ["Opa! Cheguei! 💜", "E ai! Bora brincar? 🚀", "Tô de volta! Sentiu saudade?"],
  idle: [
    "Tô sempre com você! 💜",
    "Que tédio... me cutuca! 👀",
    "Sabia que sou pequeno, mas valente?",
    "Cadê meu bloquinho de diamante?",
    "Bora fazer alguma coisa?",
  ],
  idleAngry: ["Hmpf. Não tô falando com você.", "Ainda tô bravo, viu?", "Tô de olho em você... 👀"],
  idleSad: ["Buá... ainda tá doendo...", "Não precisava ser assim...", "Eu só queria um carinho..."],
  idleHappy: ["Hoje o dia tá lindo! ✨", "Você é meu humano favorito! 💜", "Tô tão feliz que vou dançar!"],
  idleLove: ["Eu amo você, sabia? 💜", "Melhor dia da minha vida!", "Fica aqui comigo pra sempre? 💜"],
  poke: ["Ei! Isso faz cócegas! 😆", "Opa! Quer o quê?", "Hihi! De novo!", "Tô aqui! Tô aqui!"],
  pokeAngry: ["Hmpf! Não encosta!", "Me deixa!", "Tô bravo, esqueceu?"],
  pickup: ["Ei! Me põe no chão!", "Uau! Tô voando!", "Aaa! Me solta... ou não!"],
  height: [
    "Tô com medo de altura!! 😱",
    "Não me solta daí, por favorzinho!",
    "Isso é muito alto!!",
    "Mãe do céu, que altura!",
  ],
  fall: ["AAAAAAAAA!!", "SOCORROOOO!", "VOU CAIIIIR!"],
  thrown: ["WHEEEEE!", "Ai ai ai!", "Tô voando!!"],
  landSoft: ["Pousei! Nota 10! 🏅", "Foi fácil!", "De novo! De novo!"],
  hurtFall: ["Ui! Isso doeu!", "Meu bloquinho!", "Ai! Minha cabeça quadrada!"],
  dazed: ["Tô vendo estrelinhas... ⭐", "O mundo tá girando...", "Quem apagou a luz?"],
  ko: ["x_x", "Tô... voando... pro céu...", "Foi uma boa vida... 💀"],
  getup: ["Tô bem, tô bem!", "Uff... quase!", "Tá, essa foi demais..."],
  hit: ["Ai!", "Ei! Por que isso?!", "Aiaiai!", "Que isso?!", "Ouch!"],
  hitCombo: ["Chega! Para com isso!", "Eu vou ficar bravo!", "Tá bom, já deu!"],
  hitCry: ["Buááá... 😭", "Eu só queria ser seu amigo...", "Por que você é assim comigo?"],
  stomp: ["Grrr! 😠", "Tô muito bravo!", "Hmpf!"],
  pet: ["Hihi, que gostoso! 💜", "Mais um pouquinho! 💜", "Awn, obrigado!"],
  forgive: ["Hmpf... tá, eu perdoo. 💜", "Só porque você é fofo...", "Tá bom, mas não faz de novo."],
  shake: ["Para de me sacudir!!", "Tô... tonto... 😵", "Meu cérebro tá em pedaços!"],
  wake: ["Ahh! Eu tava dormindo!", "Hã? Que foi?", "Cinco minutinhos..."],
  sleep: ["Zzz... vou tirar uma soneca..."],
  revive: ["Ainda tô vivo!", "Voltei! Quem me chamou?"],
  wall: ["BAM! A parede me atacou!", "Ai! Parede malvada!"],
};

const last: Record<string, string> = {};

/** Sorteia uma fala do tipo pedido, evitando repetir a anterior. */
export function pick(kind: string): string {
  const list = LINES[kind] || LINES.idle;
  let next = list[Math.floor(Math.random() * list.length)];
  let guard = 0;
  while (list.length > 1 && next === last[kind] && guard++ < 6) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  last[kind] = next;
  return next;
}

export function moodKey(mood: number): Mood {
  if (mood < 20) return "furioso";
  if (mood < 40) return "chateado";
  if (mood < 65) return "normal";
  if (mood < 85) return "feliz";
  return "apaixonado";
}

export function moodLabel(mood: number): string {
  switch (moodKey(mood)) {
    case "furioso":
      return "Furioso";
    case "chateado":
      return "Chateado";
    case "normal":
      return "De boa";
    case "feliz":
      return "Feliz";
    default:
      return "Apaixonado";
  }
}

/** Expressão do rosto quando ele está parado, de acordo com o humor. */
export function baseExpression(mood: number, crying: boolean): "normal" | "happy" | "angry" | "sad" | "love" {
  if (crying) return "sad";
  if (mood < 25) return "angry";
  if (mood < 40) return "sad";
  if (mood >= 85) return "love";
  if (mood >= 68) return "happy";
  return "normal";
}
