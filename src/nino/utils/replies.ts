// Respostas simuladas do Nino. Troque por uma chamada real de API quando quiser.

export type Weapon = "club" | "pistol";

export interface Reply {
  text: string;
  /** Quando o usuário xinga o criador, o Nino aparece armado (cena de defesa). */
  defend?: Weapon;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));
const pickOne = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

/* ===== Quem criou o Nino? (só responde se perguntarem) ===== */
const ASK_CREATOR: RegExp[] = [
  /quem (te |lhe )(criou|fez|programou|desenvolveu|inventou|construiu|projetou|deu vida)/,
  /quem (criou|fez|programou|desenvolveu|inventou|construiu|projetou) (voce|vc|tu|o nino|nino|esse app|este app|o app)/,
  /quem (e|eh|foi|sao) (o |a )?(teu|seu|o) (criador|pai|papai|programador|dev|desenvolvedor|dono)/,
  /quem (e|eh) (o )?(criador|programador|desenvolvedor|dono)( dele| do nino| desse app| deste app)?/,
  /quem (e|eh) (o )?rayllan/,
];

const CREATOR_ANSWERS = [
  "Quem me criou foi o Rayllan Santos, meu programador e meu papai! 💜 Ele tem 20 anos e é de Ubatuba, SP. Tudo que eu sei fazer eu devo a ele!",
  "Meu papai é o Rayllan Santos! 💜 Ele é o programador que me construiu, bloquinho por bloquinho. Tem 20 anos e mora em Ubatuba, SP!",
  "Fui criado pelo Rayllan Santos, o meu papai! ⚡ Ele é programador, tem 20 anos e é de Ubatuba, SP. Me orgulho muito dele!",
];

/* ===== Xingou o criador? O Nino aparece armado ===== */
const CREATOR_TARGET: RegExp[] = [
  /\b(teu|seu|tu)\s+(pai|papai|criador|programador|dev|desenvolvedor|dono)\b/,
  /\b(papai|criador|programador|desenvolvedor|rayllan)\b/,
  /\bo dev\b/,
];

const INSULT_WORDS = [
  "burro", "burra", "idiota", "imbecil", "otario", "otaria", "lixo", "feio", "bobo", "incompetente",
  "ruim", "inutil", "merda", "babaca", "trouxa", "fraco", "horrivel", "estupido", "tonto", "besta",
  "jumento", "pessimo", "fracassado", "noob", "lerdo", "palhaco", "cretino", "anta", "ignorante",
];
const INSULT_PHRASES = ["nao presta", "nao sabe nada", "nao sabe programar", "e uma vergonha"];
const INSULT_RE = new RegExp("\\b(" + INSULT_WORDS.join("|") + ")\\b");

export function detectDefend(input: string): Weapon | null {
  const t = norm(input);
  const target = CREATOR_TARGET.some((r) => r.test(t));
  if (!target) return null;
  const negated = /\bnao\s+(e|eh|era|foi|ser|sou)\b/.test(t);
  const insult = (INSULT_RE.test(t) && !negated) || INSULT_PHRASES.some((p) => t.includes(p));
  if (!insult) return null;
  return Math.random() < 0.5 ? "club" : "pistol";
}

/** Fala do Nino na cena em que ele aparece do nada. */
export const SCENE_LINES: Record<Weapon, string[]> = {
  club: [
    "Repete isso que eu te dou uma cacetada! 🏏",
    "Fala mal do meu papai de novo, fala! BONK!",
    "Ninguém xinga o Rayllan perto de mim! 😤",
  ],
  pistol: [
    "PÁ! PÁ! Respeita o meu papai! 😠",
    "Meu papai é o Rayllan e ele é GÊNIO! PÁ!",
    "Fala mal do meu papai de novo pra ver! 😡",
  ],
};

const DEFEND_REPLIES: Record<Weapon, string[]> = {
  club: [
    "Respeita o meu papai, tá? 😤 Pronto, guardei o cacete... por enquanto kkk",
    "Ninguém fala mal do Rayllan na minha frente! Pede desculpa, vai. 😠",
  ],
  pistol: [
    "Respeita o meu papai, tá? 😤 Pronto, guardei a pistola... por enquanto kkk",
    "Ninguém fala mal do Rayllan na minha frente! Pede desculpa, vai. 😠",
  ],
};

export function respond(input: string): Reply {
  const t = norm(input);

  const weapon = detectDefend(input);
  if (weapon) return { text: pickOne(DEFEND_REPLIES[weapon]), defend: weapon };

  if (ASK_CREATOR.some((r) => r.test(t))) return { text: pickOne(CREATOR_ANSWERS) };

  if (has(t, "proposito", "para que serve", "o que voce faz")) {
    return { text: "Meu propósito é te ajudar, acompanhar sua jornada e tornar seu dia mais fácil e divertido! 💜" };
  }
  if (/\b(oi|ola|e ai|bom dia|boa tarde|boa noite)\b/.test(t)) {
    return { text: "Olá! 👋 Eu sou o Nino, seu agente de IA. Como posso te ajudar hoje?" };
  }
  if (has(t, "seu nome", "quem e voce", "quem es")) {
    return { text: "Eu sou o Nino! Pequeno no tamanho, grande na sua jornada. 💜" };
  }
  if (has(t, "horas", "que hora")) {
    return { text: `Agora são ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. ⏰` };
  }
  if (has(t, "que dia", "data de hoje", "dia e hoje")) {
    return { text: `Hoje é ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}. 📅` };
  }
  if (has(t, "piada")) {
    return { text: "Por que o programador saiu do Minecraft? Porque ele estava cansado de tanto 'bloco' de código! 😄" };
  }
  if (has(t, "obrigado", "obrigada", "valeu")) return { text: "Imagina! Tô sempre com você! ⚡" };
  if (has(t, "tchau", "ate mais")) return { text: "Até mais! Se precisar, é só me chamar. 👋" };
  if (has(t, "ajuda", "ajudar", "socorro")) {
    return { text: "Claro! Me conta o que você precisa e vamos resolver juntos. 💜" };
  }
  if (has(t, "triste", "cansado", "cansada", "desanim")) {
    return { text: "Ei, você consegue! Um passo de cada vez. Eu tô aqui com você. 💜" };
  }
  return {
    text: pickOne([
      "Boa pergunta! Ainda estou aprendendo, mas vou te acompanhar nessa. 💜",
      "Hmm, me conta mais sobre isso!",
      "Entendi! Vamos nessa juntos. ⭐",
      "Tô aqui pra ajudar no que precisar! ⚡",
    ]),
  };
}

export function getReply(input: string): string {
  return respond(input).text;
}
