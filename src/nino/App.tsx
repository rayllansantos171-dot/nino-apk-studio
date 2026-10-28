import React, { useEffect, useRef, useState } from "react";
import "./index.css";
import { SettingsProvider, useSettings } from "./utils/SettingsContext";
import Home, { Splash } from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import SkinShopPage from "./pages/SkinShopPage";
import FloatingAgent from "./components/FloatingAgent";
import { IconAgent, IconPalette, IconSettings } from "./components/Icons";

type View = "splash" | "agente" | "aparencia" | "ajustes" | "chat" | "loja";

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
  const [lastTab, setLastTab] = useState<Exclude<View, "splash" | "chat" | "loja">>("agente");

  // Botão "voltar" do Android: cada tela entra no histórico do WebView em vez de fechar o app.
  const prevView = useRef<View | null>(null);
  useEffect(() => {
    const prev = prevView.current;
    prevView.current = view;
    try {
      if (prev === null || prev === "splash") window.history.replaceState({ ...window.history.state, nino: view }, "");
      else if (window.history.state?.nino !== view) window.history.pushState({ ...window.history.state, nino: view }, "");
    } catch {
      /* ignore */
    }
  }, [view]);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const v = e.state?.nino as View | undefined;
      if (!v || v === "splash") return;
      if (v !== "chat" && v !== "loja") setLastTab(v);
      setView(v);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goTab = (v: Exclude<View, "splash" | "chat" | "loja">) => {
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
        {view === "aparencia" && <SettingsPage mode="aparencia" onOpenShop={() => setView("loja")} />}
        {view === "loja" && <SkinShopPage onBack={() => goTab("aparencia")} />}
        {view === "ajustes" && <SettingsPage mode="ajustes" />}
        {view === "chat" && <ChatPage onBack={() => setView(lastTab)} />}
      </main>

      {showNav && (
        <nav className="bottom-nav">
          <button className={view === "agente" ? "active" : ""} onClick={() => goTab("agente")}>
            <IconAgent />
            <span>Agente</span>
          </button>
          <button className={view === "aparencia" || view === "loja" ? "active" : ""} onClick={() => goTab("aparencia")}>
            <IconPalette />
            <span>Aparência</span>
          </button>
          <button className={view === "ajustes" ? "active" : ""} onClick={() => goTab("ajustes")}>
            <IconSettings />
            <span>Ajustes</span>
          </button>
        </nav>
      )}

      {showFloating && view !== "chat" && <FloatingAgent />}
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
