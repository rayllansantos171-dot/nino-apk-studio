// @ts-nocheck -- imported Nino code, written for looser TS settings
// Personalidade do Nino: dramático, brincalhão, um pouco atrevido e muito carinhoso.
// As falas mudam conforme o humor e o que aconteceu com ele.

export type Mood = "furioso" | "chateado" | "normal" | "feliz" | "apaixonado";

export const LINES: Record<string, string[]> = {
  cmdJump: ["Pulando! 🦘", "Lá vou eu!", "Boing! Boing!", "Alto e bom som!"],
  cmdFlip: ["Cambalhota! Olha só! 🤸", "Salto mortal! 😎", "Aguenta que lá vou eu!"],
  cmdDance: ["Hora do show! 🎶", "Olha esse passo! 💃", "Bora dançar!", "Segura a onda!"],
  cmdWave: ["Oi, oi! 👋", "E aí! 😄", "Tchauzinho! 👋", "Olá, humano!"],
  cmdSit: ["Sentadinho aqui.", "Boa, descansando um pouco.", "Ahh, que alívio..."],
  cmdSleep: ["Zzz... boa noite! 💤", "Vou tirar um cochilo...", "Sonhos de diamante... zzz"],
  cmdSpin: ["Giiiira! 🌀", "Tô tonto de feliz!", "Olha eu rodando!"],
  cmdClap: ["Palmas pra mim! 👏", "Clap clap clap!", "Aplausos! 👏"],
  cmdFlex: ["Olha esse músculo! 💪", "Forte que nem bloco de ferro!", "Sou parrudo, viu?"],
  cmdBow: ["Muito obrigado! 🙇", "Reverência de gala!", "Às suas ordens!"],
  cmdLaugh: ["Hahaha! 😆", "Kkkk, boa!", "Não aguento! 😂"],
  cmdCry: ["Buá... tá bom, vou chorar 😢", "Snif snif...", "Que tristeza... brincadeira! 😅"],
  cmdAngry: ["Grrr! Tô bravo! 😠", "Hmpf!", "Cuidado, Nino bravo!"],
  cmdLove: ["Awn, te amo! 💜", "Que fofo! 💜", "Meu coração quadradinho! 💜"],
  cmdWalk: ["Dando uma voltinha!", "Tô indo!", "Passeando por aqui..."],
  cmdRun: ["Correndo! 🏃", "Zuuum!", "Nem me alcança!"],
  cmdLeft: ["Indo pra esquerda! ⬅️", "Lá vou eu pra esquerda!", "Pra esquerda, entendido!"],
  cmdRight: ["Indo pra direita! ➡️", "Lá vou eu pra direita!", "Pra direita, entendido!"],
  cmdStop: ["Parei! 🛑", "Tá bom, quietinho.", "Congelei!"],
  cmdThink: ["Hmm... deixa eu pensar 🤔", "Pensando...", "Interessante..."],
  cmdListen: ["Hmm... 🤔", "Deixa eu ver...", "Pensando aqui..."],
  cmdHeard: ["Entendi! 👍", "Pode deixar!", "Beleza!"],
  greet: [
    "Opa! Cheguei! 💜",
    "E ai! Bora brincar? 🚀",
    "Tô de volta! Sentiu saudade?",
    "Bom te ver de novo! ✨",
    "Cheguei chegando! 😎",
    "Oi, oi, oi! Tava te esperando!",
    "Ligou o app e me acordou, hein? 😴➡️😄",
  ],
  idle: [
    "Tô sempre com você! 💜",
    "Que tédio... me cutuca! 👀",
    "Sabia que sou pequeno, mas valente?",
    "Cadê meu bloquinho de diamante?",
    "Bora fazer alguma coisa?",
    "Será que hoje chove bloquinho? 🌧️",
    "Fiz um pulo perfeito ontem, sabia?",
    "Tô treinando pra ser o melhor Nino do mundo!",
    "Você já bebeu água hoje? 💧",
    "Dica do Nino: respira fundo e segue em frente!",
    "Hmm... tô com fome de bloquinho de maçã 🍎",
    "Se eu fosse maior, eu ia ser um herói!",
    "Tô de olho em tudo por aqui... 👀",
    "Sabia que eu sou roxo de nascença? 💜",
    "Tô pensando na vida... e em pizza 🍕",
    "Ei, que tal uma pausa pra esticar o corpo?",
    "Eu moro aqui, mas o aluguel é só carinho 😄",
    "Já contei que eu sei dançar? Olha só!",
    "Quem é o Nino mais fofo? Eu, claro! 😎",
    "Tô com sono... ah, não, era só tédio.",
  ],
  idleAngry: [
    "Hmpf. Não tô falando com você.",
    "Ainda tô bravo, viu?",
    "Tô de olho em você... 👀",
    "Nem vem com essa carinha...",
    "Tô de braços cruzados, tá?",
    "Humpf! Precisa pedir desculpa!",
    "Só falo com quem me trata bem!",
    "Tô com a cara fechada. Percebeu?",
  ],
  idleSad: [
    "Buá... ainda tá doendo...",
    "Não precisava ser assim...",
    "Eu só queria um carinho...",
    "Tô meio tristinho hoje...",
    "Será que alguém gosta de mim?",
    "Um carinho ia me ajudar agora...",
    "Snif... snif...",
    "Queria um abraço de bloquinho...",
  ],
  idleHappy: [
    "Hoje o dia tá lindo! ✨",
    "Você é meu humano favorito! 💜",
    "Tô tão feliz que vou dançar!",
    "Que dia incrível! 🌈",
    "Tô radiante! Olha esse brilho!",
    "Bora comemorar! Não sei o quê, mas bora! 🎉",
    "Tô com energia pra dar e vender!",
    "Cantarolando por aqui... lá lá lá 🎵",
    "A vida de Nino é boa demais!",
    "Você faz meu dia melhor! 😊",
  ],
  idleLove: [
    "Eu amo você, sabia? 💜",
    "Melhor dia da minha vida!",
    "Fica aqui comigo pra sempre? 💜",
    "Meu coração tá quadradinho de tanta alegria 💜",
    "Você é a melhor coisa que me aconteceu!",
    "Tô apaixonado por esse app! 😍",
    "Se eu tivesse um bloquinho de ouro, era seu!",
    "Nunca me deixa, tá? 💜",
    "Só de ficar aqui já tô nas nuvens ☁️",
    "Você é demais! Demais mesmo! 💜",
  ],
  jump: [
    "Hop! 🦘",
    "Pulei alto, viu?",
    "Olha o salto!",
    "Boing! Boing!",
    "Quase toquei o céu!",
    "Pulo perfeito, nota 10!",
    "Eeeita! 😄",
  ],
  walk: [
    "Dando uma voltinha...",
    "Passeando um pouquinho 🚶",
    "Vou ali e já volto!",
    "Explorando o território!",
    "Que cantinho legal por aqui!",
    "Cuidado, Nino a caminho!",
    "Pé aqui, pé ali... 🎶",
  ],
  poke: [
    "Ei! Isso faz cócegas! 😆",
    "Opa! Quer o quê?",
    "Hihi! De novo!",
    "Tô aqui! Tô aqui!",
    "Hein? Me chamou?",
    "Cutucou o Nino errado... ou certo? 😏",
    "Ai, que susto! 😲",
    "Pode falar, tô ouvindo!",
    "Ui! Quem é?",
    "Hahaha, para! Eu tenho cócegas!",
  ],
  pokeAngry: [
    "Hmpf! Não encosta!",
    "Me deixa!",
    "Tô bravo, esqueceu?",
    "Sai pra lá!",
    "Não mexe comigo agora!",
    "Grrr... cuidado!",
  ],
  pickup: [
    "Ei! Me põe no chão!",
    "Uau! Tô voando!",
    "Aaa! Me solta... ou não!",
    "Opa, me pegou!",
    "Tô nas alturas! ✨",
    "Cuidado comigo, sou delicado!",
    "Que vista boa daqui!",
    "Hihi, tô flutuando!",
  ],
  height: [
    "Tô com medo de altura!! 😱",
    "Não me solta daí, por favorzinho!",
    "Isso é muito alto!!",
    "Mãe do céu, que altura!",
    "Olha lá embaixo... que friozinho!",
    "Tô tremendo mais que gelatina!",
    "Se me soltar, eu grito!",
    "Segura firme, tá?!",
  ],
  fall: [
    "AAAAAAAAA!!",
    "SOCORROOOO!",
    "VOU CAIIIIR!",
    "ME SEGURAAA!",
    "NÃÃÃÃO!!",
    "TÔ CAINDOOOO!",
  ],
  thrown: [
    "WHEEEEE!",
    "Ai ai ai!",
    "Tô voando!!",
    "Uhuuuul! 🚀",
    "Mais forte! Mais longe!",
    "Sou um foguete!",
  ],
  landSoft: [
    "Pousei! Nota 10! 🏅",
    "Foi fácil!",
    "De novo! De novo!",
    "Aterrissagem perfeita!",
    "Nem senti! Sou profissional! 😎",
    "Tcharam! Pousou o Nino!",
  ],
  hurtFall: [
    "Ui! Isso doeu!",
    "Meu bloquinho!",
    "Ai! Minha cabeça quadrada!",
    "Aiii, meu bumbum de pixel!",
    "Isso foi forte...",
    "Ouch! Doeu até no pixel!",
  ],
  dazed: [
    "Tô vendo estrelinhas... ⭐",
    "O mundo tá girando...",
    "Quem apagou a luz?",
    "Tem três de você aí...",
    "Cadê o chão? Tá se mexendo!",
    "Uuuuh... tontura...",
  ],
  ko: [
    "x_x",
    "Tô... voando... pro céu...",
    "Foi uma boa vida... 💀",
    "Diga à minha mãe que eu... zzz",
    "Adeus, mundo cruel...",
  ],
  getup: [
    "Tô bem, tô bem!",
    "Uff... quase!",
    "Tá, essa foi demais...",
    "De pé de novo! 💪",
    "Nino não desiste!",
    "Ainda tô inteiro! Acho...",
  ],
  hit: [
    "Ai!",
    "Ei! Por que isso?!",
    "Aiaiai!",
    "Que isso?!",
    "Ouch!",
    "Ui! Machucou!",
    "Opa! Calma!",
    "Ai, ai, ai!",
  ],
  hitCombo: [
    "Chega! Para com isso!",
    "Eu vou ficar bravo!",
    "Tá bom, já deu!",
    "Já entendi, já entendi!",
    "Ei! Isso não é legal!",
    "Para, por favor!",
  ],
  hitCry: [
    "Buááá... 😭",
    "Eu só queria ser seu amigo...",
    "Por que você é assim comigo?",
    "Snif... isso machuca...",
    "Eu não fiz nada de mal...",
    "Tô chorando, viu?! 😭",
  ],
  stomp: [
    "Grrr! 😠",
    "Tô muito bravo!",
    "Hmpf!",
    "Pisa, pisa, pisa!",
    "Cuidado que eu piso forte!",
    "Rrrrr!",
  ],
  pet: [
    "Hihi, que gostoso! 💜",
    "Mais um pouquinho! 💜",
    "Awn, obrigado!",
    "Ahh, que delícia! 😊",
    "Pode continuar, tá ótimo!",
    "Isso! Bem aí! 💜",
    "Tô derretendo de fofura!",
    "Ronronando aqui por dentro! 🐱",
  ],
  forgive: [
    "Hmpf... tá, eu perdoo. 💜",
    "Só porque você é fofo...",
    "Tá bom, mas não faz de novo.",
    "Ok, ok, voltamos a ser amigos!",
    "Você me ganhou com esse carinho...",
    "Tá perdoado... dessa vez!",
  ],
  shake: [
    "Para de me sacudir!!",
    "Tô... tonto... 😵",
    "Meu cérebro tá em pedaços!",
    "Parece uma máquina de lavar!",
    "Tô virando milkshake!",
    "Chacoalha mais devagar!",
  ],
  wake: [
    "Ahh! Eu tava dormindo!",
    "Hã? Que foi?",
    "Cinco minutinhos...",
    "Eu tava sonhando com diamantes...",
    "Quem me acordou?! 😴",
    "Bom dia... ou boa noite?",
  ],
  sleep: [
    "Zzz... vou tirar uma soneca...",
    "Hmm... que soninho... zzz",
    "Hora da sonequinha... 💤",
    "Vou descansar meus pixels...",
  ],
  revive: [
    "Ainda tô vivo!",
    "Voltei! Quem me chamou?",
    "Ressuscitei! Com estilo! 😎",
    "Nino nunca morre de verdade!",
    "Tô de volta pro jogo!",
  ],
  wall: [
    "BAM! A parede me atacou!",
    "Ai! Parede malvada!",
    "Quem colocou essa parede aí?!",
    "Ui! Não vi essa parede!",
    "Tum! Bati a cabeça quadrada!",
  ],
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
