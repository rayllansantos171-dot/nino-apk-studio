import React from "react";
import { AppearancePanel, SettingsList } from "../components/Settings";

export default function SettingsPage({ mode }: { mode: "aparencia" | "ajustes" }) {
  if (mode === "aparencia") {
    return (
      <div className="page">
        <header className="page-header">
          <h2>Aparência</h2>
          <p>Personalize o Nino do seu jeito.</p>
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
