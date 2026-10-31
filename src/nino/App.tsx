import React, { useEffect, useRef, useState } from "react";
import "./index.css";
import { SettingsProvider, useSettings } from "./utils/SettingsContext";
import Home, { Splash } from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import SkinShopPage from "./pages/SkinShopPage";
import FloatingAgent from "./components/FloatingAgent";
import { onVoiceCommand } from "./utils/nativeListen";
import { isNativeAndroid, nativeOverlaySay } from "./utils/nativeOverlay";
import { askNino } from "@/lib/ai/nino.functions";
import { withTimeout } from "./utils/withTimeout";
import { respond } from "./utils/replies";
import { speak } from "./utils/speak";
import { matchCommands } from "./utils/voiceCommands";
import { IconAgent, IconPalette, IconSettings } from "./components/Icons";

type View = "splash" | "agente" | "aparencia" | "ajustes" | "chat" | "loja";

const STARTED_KEY = "nino-ai-started";

/** Mantém a altura do app igual à área visível (com teclado aberto ou fechado) e a página sempre no topo. */
function useViewportFit() {
  useEffect(() => {
    const root = document.documentElement;
    let timer = 0;
    const fit = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-h", `${Math.round(h)}px`);
      if (window.scrollY !== 0 || document.scrollingElement?.scrollTop) window.scrollTo(0, 0);
    };
    const settle = () => {
      fit();
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 250); // o teclado termina de abrir/fechar depois do primeiro evento
    };
    fit();
    const vv = window.visualViewport;
    window.addEventListener("resize", settle);
    window.addEventListener("scroll", fit);
    window.addEventListener("focusin", settle);
    window.addEventListener("focusout", settle);
    vv?.addEventListener("resize", settle);
    vv?.addEventListener("scroll", fit);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", settle);
      window.removeEventListener("scroll", fit);
      window.removeEventListener("focusin", settle);
      window.removeEventListener("focusout", settle);
      vv?.removeEventListener("resize", settle);
      vv?.removeEventListener("scroll", fit);
    };
  }, []);
}

function Shell() {
  useViewportFit();
  const { settings, update } = useSettings();
  const [view, setView] = useState<View>(() => {
    try {
      return localStorage.getItem(STARTED_KEY) ? "agente" : "splash";
    } catch {
      return "splash";
    }
  });
  const [lastTab, setLastTab] = useState<Exclude<View, "splash" | "chat" | "loja">>("agente");

  // Frase dita ao Nino em segundo plano ("Nino, pula!" / "Nino, que horas são?") chega aqui.
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const viewRef = useRef<View>(view);
  viewRef.current = view;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(
    () =>
      onVoiceCommand((text) => {
        // No chat, a frase vira mensagem. Nas outras telas o Nino obedece/responde pelo balão.
        if (viewRef.current === "chat") {
          setVoiceText(text);
          return;
        }
        const cmds = matchCommands(text);
        if (isNativeAndroid()) {
          // No Android o Nino que anda é o da tela (nativo); o do app não é duplicado. Aqui só responde a conversa.
          if (cmds.length) {
            const msg = "Ative o Nino na tela para eu obedecer!";
            speak(msg);
            void nativeOverlaySay(msg);
            return;
          }
          const local = respond(text).text;
          const finish = (reply: string) => {
            speak(reply);
            void nativeOverlaySay(reply);
          };
          withTimeout(askNino({ data: { messages: [{ role: "user", content: text }] } }), 25000)
            .then((r) => finish(r.ok ? r.text : local))
            .catch(() => finish(local));
          return;
        }
        const fire = () => window.dispatchEvent(new CustomEvent("nino-voice", { detail: { text, cmds } }));
        const s = settingsRef.current;
        if (s.floating && s.onScreen && viewRef.current !== "splash") {
          fire();
        } else {
          update({ floating: true, onScreen: true });
          window.setTimeout(fire, 700);
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
  // No Android o Nino que anda é o nativo (sobre outros apps); o do app só existe no navegador.
  const showFloating = settings.floating && settings.onScreen && view !== "splash" && !isNativeAndroid();

  return (
    <div className="app-shell">
      <main className="screen">
        {view === "splash" && <Splash onStart={start} />}
        {view === "agente" && <Home onOpenChat={() => setView("chat")} onOpenSettings={() => goTab("ajustes")} />}
        {view === "aparencia" && <SettingsPage mode="aparencia" onOpenShop={() => setView("loja")} />}
        {view === "loja" && <SkinShopPage onBack={() => goTab("aparencia")} />}
        {view === "ajustes" && <SettingsPage mode="ajustes" />}
        {view === "chat" && (
          <ChatPage onBack={() => setView(lastTab)} voiceText={voiceText} onVoiceHandled={() => setVoiceText(null)} />
        )}
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

      {showFloating && view !== "chat" && <FloatingAgent interactive={view === "agente"} />}
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
