/** Ordens que o Nino entende por voz ("Nino, pula!"). Cada uma vira um comando do motor. */
export type VoiceCommand =
  | "jump" | "flip" | "spin" | "dance" | "wave" | "sit" | "sleep" | "clap" | "flex" | "bow"
  | "laugh" | "cry" | "angry" | "love" | "think" | "walk" | "run" | "stop"
  | "walkLeft" | "walkRight" | "runLeft" | "runRight";

const RULES: Array<[VoiceCommand, RegExp]> = [
  ["flip", /\b(cambalhota|salto mortal|giro mortal|mortal|pirueta|backflip|flip)\b/],
  ["jump", /\b(pul[aeo]r?|pulando|pulinho|pulo|salta[r]?|salte)\b/],
  ["spin", /\b(gir[ae]r?|rodopi[ae]r?|rod[ae]r?|roda)\b/],
  ["dance", /\b(danc[ae]r?|dancinha|bail[ae]r?|rebol[ae]r?|balan[cç][ae]r?)\b/],
  ["wave", /\b(acen[ae]r?|tchau|ola|oi|eai|e ai|salve)\b/],
  ["sit", /\b(senta[r]?|sente)\b/],
  ["sleep", /\b(dorm[ei]r?|durma|soneca|cochil[ae]r?)\b/],
  ["clap", /\b(palmas|aplaud[ei]r?|aplausos)\b/],
  ["flex", /\b(forca|musculos?|flexion[ae]r?)\b/],
  ["bow", /\b(reverencia|curv[ae]r?|agradece[r]?)\b/],
  ["laugh", /\b(ri|rir|gargalh[ae]r?|risada|sorri[ar]?)\b/],
  ["cry", /\b(chora[r]?|chore)\b/],
  ["angry", /\b(bravo|raiva|furioso|irrite)\b/],
  ["love", /\b(te amo|beijo|abraco|abracar|carinho|amor)\b/],
  ["think", /\b(pensa[r]?|reflete[r]?)\b/],
  ["run", /\b(corr[ae]r?)\b/],
  ["walk", /\b(and[ae]r?|andando|caminh[ae]r?|passei[ae]r?|volta|vai|va)\b/],
  ["stop", /\b(pare|parar|quieto|parado|congela[r]?)\b/],
];

const RIGHT = /\b(direita|direito)\b/;
const LEFT = /\b(esquerda|esquerdo)\b/;

const normalize = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Devolve as ordens encontradas, na ordem em que foram faladas ("pula e dança" → jump, dance). */
export function matchCommands(text: string): VoiceCommand[] {
  const t = normalize(text);
  const found: Array<[number, VoiceCommand]> = [];
  for (const [cmd, re] of RULES) {
    const m = re.exec(t);
    if (m) found.push([m.index, cmd]);
  }
  // "anda pra direita" / "corre pra esquerda": a direção vira uma ordem só, em vez de "andar" solto.
  const side = RIGHT.test(t) ? "Right" : LEFT.test(t) ? "Left" : null;
  if (side) {
    const run = found.some(([, c]) => c === "run");
    const walk = found.some(([, c]) => c === "walk");
    const at = found.find(([, c]) => c === "run" || c === "walk");
    const dirCmd = ((run ? "run" : "walk") + side) as VoiceCommand;
    if (run || walk || found.length === 0 || /\b(vai|va|ir|move|mexe|mova|vem)\b/.test(t)) {
      const rest = found.filter(([, c]) => c !== "run" && c !== "walk");
      found.length = 0;
      found.push([at ? at[0] : 0, dirCmd], ...rest);
    }
  }
  found.sort((a, b) => a[0] - b[0]);
  const out: VoiceCommand[] = [];
  for (const [, c] of found) {
    // "salto mortal" conta como cambalhota, não como pulo
    if (c === "jump" && found.some(([, x]) => x === "flip")) continue;
    if (!out.includes(c)) out.push(c);
  }
  return out;
}
