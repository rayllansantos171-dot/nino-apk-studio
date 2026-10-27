import React from "react";
import { THEMES } from "../utils/settings";
import { useSettings } from "../utils/SettingsContext";
import Nino from "./Nino";

/** Escolha do tema de cores do Nino (Roxo, Rosa, Azul, Verde). */
export default function ThemeSelector() {
  const { settings, update } = useSettings();

  return (
    <div className="theme-grid">
      {THEMES.map((t) => {
        const active = settings.theme === t.key;
        return (
          <button
            key={t.key}
            className={`theme-card ${active ? "active" : ""}`}
            onClick={() => update({ theme: t.key })}
            style={
              {
                "--accent": t.accent,
                "--accent-2": t.accent2,
                "--accent-soft": t.soft,
              } as React.CSSProperties
            }
            aria-pressed={active}
          >
            {active && <span className="theme-check">✓</span>}
            <Nino size={42} glow={false} particles={false} />
            <span className="theme-label">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
