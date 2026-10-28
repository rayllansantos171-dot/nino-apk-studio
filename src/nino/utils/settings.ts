export type ThemeKey = "roxo" | "rosa" | "azul" | "verde";
export type SizeKey = "small" | "medium" | "large";
export type SpeedKey = "slow" | "normal" | "fast";

export interface Settings {
  theme: ThemeKey;
  size: SizeKey;
  speed: SpeedKey;
  glow: boolean;
  particles: boolean;
  stepSound: boolean;
  floating: boolean; // agente flutuante habilitado
  onScreen: boolean; // Nino ativo na tela
  roaming: boolean; // passeio suave
  bubbles: boolean; // balões de conversa
  freeDrag: boolean; // posição livre para arrastar
  notifications: boolean;
  listening: boolean; // escuta em segundo plano (Android)
  soundVibration: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "roxo",
  size: "medium",
  speed: "normal",
  glow: true,
  particles: true,
  stepSound: true,
  floating: true,
  onScreen: false,
  roaming: true,
  bubbles: true,
  freeDrag: true,
  notifications: true,
  listening: false,
  soundVibration: true,
};

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  accent: string;
  accent2: string;
  soft: string;
}

export const THEMES: ThemeDef[] = [
  { key: "roxo", label: "Roxo", accent: "#a855f7", accent2: "#7c3aed", soft: "#d8b4fe" },
  { key: "rosa", label: "Rosa", accent: "#ec4899", accent2: "#be185d", soft: "#f9a8d4" },
  { key: "azul", label: "Azul", accent: "#3b82f6", accent2: "#1d4ed8", soft: "#93c5fd" },
  { key: "verde", label: "Verde", accent: "#22c55e", accent2: "#15803d", soft: "#86efac" },
];

export const SIZE_PX: Record<SizeKey, number> = { small: 72, medium: 104, large: 144 };
export const MOVE_MS: Record<SpeedKey, number> = { slow: 5200, normal: 3200, fast: 1600 };

const KEY = "nino-ai-settings-v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
