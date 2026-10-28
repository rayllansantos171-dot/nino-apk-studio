import React from "react";
import { AppearancePanel, SettingsList } from "../components/Settings";
import { IconStore } from "../components/Icons";

export default function SettingsPage({ mode, onOpenShop }: { mode: "aparencia" | "ajustes"; onOpenShop?: () => void }) {
  if (mode === "aparencia") {
    return (
      <div className="page">
        <header className="page-header shop-header">
          <div className="shop-title">
            <h2>Aparência</h2>
            <p>Personalize o Nino do seu jeito.</p>
          </div>
          <button className="icon-btn" onClick={onOpenShop} aria-label="Abrir loja de skins">
            <IconStore size={20} />
          </button>
        </header>
        <AppearancePanel />
      </div>
    );
  }
  return (
    <div className="page">
      <header className="page-header">
        <h2>Ajustes</h2>
        <p>Deixe o Nino do seu jeito.</p>
      </header>
      <SettingsList />
    </div>
  );
}
