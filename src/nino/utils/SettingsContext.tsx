// @ts-nocheck -- imported Nino code, written for looser TS settings
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  THEMES,
  loadSettings,
  saveSettings,
} from "./settings";

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
    const t = THEMES.find((x) => x.key === settings.theme) ?? THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-2", t.accent2);
    root.style.setProperty("--accent-soft", t.soft);
    root.dataset.glow = settings.glow ? "on" : "off";
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  return ctx;
}
