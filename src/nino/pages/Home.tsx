import React from "react";
import Nino from "../components/Nino";
import { IconChat, IconChevron, IconCube, IconMic, IconMove, IconRocket, IconSettings, IconShield } from "../components/Icons";
import { useSettings } from "../utils/SettingsContext";
import { getNativeOverlayRunning, isNativeAndroid, setNativeOverlay } from "../utils/nativeOverlay";
import { getNativeListening, setNativeListening } from "../utils/nativeListen";

/** Tela inicial de boas-vindas. */
export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div className="splash">
      <img className="splash-art" src="/nino-icon.webp" alt="Nino AI" width={600} height={600} decoding="async" />
      <button className="primary-btn" onClick={onStart}>
        Começar <IconChevron size={18} />
      </button>
      <p className="splash-foot">
        Mais que um assistente,
        <br />
        um amigo digital. 💜
      </p>
    </div>
  );
}

/** Aba "Agente". */
export default function Home({
  onOpenChat,
  onOpenSettings,
}: {
  onOpenChat: () => void;
  onOpenSettings: () => void;
}) {
  const { settings, update } = useSettings();
  const native = isNativeAndroid();

  // A escuta pode ser parada pela notificação; mantém o botão igual ao estado real.
  React.useEffect(() => {
    if (!native) return;
    const sync = () => {
      void getNativeListening().then((running) => {
        update({ listening: running });
      });
      // O botão "NA TELA" também segue o serviço de verdade (ele pode ter sido fechado pelo sistema).
      void getNativeOverlayRunning().then((on) => {
        update({ floating: on, onScreen: on });
      });
    };
    sync();
    const timers: number[] = [];
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Ao voltar da tela de permissão, o Nino pode levar um instante para subir: confere algumas vezes.
      sync();
      [1200, 3000].forEach((ms) => timers.push(window.setTimeout(sync, ms)));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  const toggleListening = async () => {
    const next = !settings.listening;
    const running = await setNativeListening(next);
    update({ listening: next ? running : false });
  };

  return (
    <div className="home panel-scroll">
      <header className="home-header">
        <div>
          <h1 className="pixel-title small">
            NINO<em>AI</em>
          </h1>
          <p className="subtitle">Seu Agente de IA</p>
        </div>
      </header>

      <section className="hero">
        <div className="speech hero-speech">E ai! Bora ficar por aqui? 🚀</div>
        <button className="hero-nino" onClick={onOpenChat} aria-label="Conversar com o Nino">
          <Nino size={150} action="idle" expression="normal" glow={settings.glow} particles={settings.particles} />
        </button>
        <div className="status-pill">
          <i className={`dot ${settings.onScreen ? "ok" : ""}`} />
          <b>{settings.onScreen ? "Agente ativo" : "Agente pausado"}</b>
          <span>| Pronto para te acompanhar</span>
        </div>
      </section>

      <section className="card">
        <div className="list-row float-row">
          <span className="row-ic big">
            <Nino size={34} glow={false} particles={false} />
          </span>
          <span className="row-text">
            <strong className="lg">Agente flutuante</strong>
            <small>Nino vai andar pela sua tela, conversar e te ajudar em tudo.</small>
          </span>
        </div>

        <button
          className={`primary-btn wide ${settings.onScreen ? "active" : ""}`}
          aria-pressed={settings.onScreen}
          onClick={() => {
            const next = !settings.onScreen;
            if (!native) update({ floating: next, onScreen: next });
            void (async () => {
              // Ao ativar o Nino na tela, ele já passa a ouvir "Nino + ordem" (pede o microfone se precisar).
              if (next && native && !settings.listening) {
                const running = await setNativeListening(true);
                update({ listening: running });
              }
              const on = await setNativeOverlay(next, settings.skin);
              // No Android só vale "ativo" quando o serviço realmente subiu (ou foi desligado).
              if (native) update({ floating: next && on, onScreen: next && on });
            })();
          }}
        >
          <IconRocket size={20} /> {settings.onScreen ? "DESATIVAR DA TELA" : "ATIVAR NA TELA"}
        </button>

        <div className="list-card inner">
          <button className="list-row" onClick={() => update({ bubbles: !settings.bubbles })}>
            <span className="row-ic">
              <IconChat size={20} />
            </span>
            <span className="row-text">
              <strong>Balões de conversa</strong>
              <small>{settings.bubbles ? "Ativados" : "Desativados"}</small>
            </span>
            <IconChevron size={18} className="chev" />
          </button>
          <button className="list-row" onClick={() => update({ freeDrag: !settings.freeDrag })}>
            <span className="row-ic">
              <IconCube size={20} />
            </span>
            <span className="row-text">
              <strong>Posição na tela</strong>
              <small>{settings.freeDrag ? "Livre para arrastar" : "Fixa"}</small>
            </span>
            <IconChevron size={18} className="chev" />
          </button>
          {native && (
            <button className="list-row" onClick={() => void toggleListening()} aria-pressed={settings.listening}>
              <span className="row-ic">
                <IconMic size={20} />
              </span>
              <span className="row-text">
                <strong>Escutar em segundo plano</strong>
                <small>{settings.listening ? "Ouvindo: “Nino pular”, “Nino anda pra direita”, “Nino dança”…" : "Desativado"}</small>
              </span>
              <IconChevron size={18} className="chev" />
            </button>
          )}
        </div>

        <div className="info-row">
          <span className="row-ic">
            <IconShield size={22} />
          </span>
          <p>Para aparecer sobre outros aplicativos, permita a sobreposição nas configurações do Android.</p>
        </div>
        {native && (
          <div className="info-row">
            <span className="row-ic">
              <IconMic size={22} />
            </span>
            <p>
              O Nino só ouve com a escuta ligada, e uma notificação fica visível enquanto isso. Para parar, desligue aqui
              ou toque em “Parar” na notificação. O áudio é reconhecido pelo Android e não fica gravado no app.
            </p>
          </div>
        )}
      </section>

      <button className="outline-btn chat-cta" onClick={onOpenChat}>
        <IconChat size={18} /> Conversar com o Nino
      </button>
    </div>
  );
}
