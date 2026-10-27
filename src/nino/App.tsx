import React, { useState } from "react";
import "./index.css";
import { SettingsProvider, useSettings } from "./utils/SettingsContext";
import Home, { Splash } from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import FloatingAgent from "./components/FloatingAgent";
import { IconAgent, IconPalette, IconSettings } from "./components/Icons";

type View = "splash" | "agente" | "aparencia" | "ajustes" | "chat";

const STARTED_KEY = "nino-ai-started";

function Shell() {
  const { settings } = useSettings();
  const [view, setView] = useState<View>(() => {
    try {
      return localStorage.getItem(STARTED_KEY) ? "agente" : "splash";
    } catch {
      return "splash";
    }
  });
  const [lastTab, setLastTab] = useState<Exclude<View, "splash" | "chat">>("agente");

  const goTab = (v: Exclude<View, "splash" | "chat">) => {
    setLastTab(v);
    setView(v);
  };

  const start = () => {
    try {
      localStorage.setItem(STARTED_KEY, "1");
    } catch {
      /* ignore */
    }
    goTab("agente");
  };

  const showNav = view !== "splash" && view !== "chat";
  const showFloating = settings.floating && settings.onScreen && view !== "splash";

  return (
    <div className="app-shell">
      <main className="screen">
        {view === "splash" && <Splash onStart={start} />}
        {view === "agente" && <Home onOpenChat={() => setView("chat")} onOpenSettings={() => goTab("ajustes")} />}
        {view === "aparencia" && <SettingsPage mode="aparencia" />}
        {view === "ajustes" && <SettingsPage mode="ajustes" />}
        {view === "chat" && <ChatPage onBack={() => setView(lastTab)} />}
      </main>

      <div id="hud-slot" />

      {showNav && (
        <nav className="bottom-nav">
          <button className={view === "agente" ? "active" : ""} onClick={() => goTab("agente")}>
            <IconAgent />
            <span>Agente</span>
          </button>
          <button className={view === "aparencia" ? "active" : ""} onClick={() => goTab("aparencia")}>
            <IconPalette />
            <span>Aparência</span>
          </button>
          <button className={view === "ajustes" ? "active" : ""} onClick={() => goTab("ajustes")}>
            <IconSettings />
            <span>Ajustes</span>
          </button>
        </nav>
      )}

      {showFloating && view !== "chat" && <FloatingAgent onOpenChat={() => setView("chat")} />}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}
