import React from "react";
import Nino from "../components/Nino";
import { Toggle } from "../components/Settings";
import { IconChat, IconChevron, IconCube, IconMove, IconRocket, IconSettings, IconShield } from "../components/Icons";
import { useSettings } from "../utils/SettingsContext";
import { setNativeOverlay } from "../utils/nativeOverlay";

/** Tela inicial de boas-vindas. */
export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div className="splash">
      <div className="splash-logo">
        <span className="crown">♛</span>
        <h1 className="pixel-title">
          NINO<em>AI</em>
        </h1>
        <p>
          Seu agente virtual.
          <br />
          Sempre com você.
        </p>
      </div>
      <div className="splash-hero">
        <Nino size={210} action="wave" expression="happy" />
      </div>
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

  return (
    <div className="home panel-scroll">
      <header className="home-header">
        <div>
          <h1 className="pixel-title small">
            NINO<em>AI</em>
          </h1>
          <p className="subtitle">Seu Agente de IA</p>
        </div>
        <button className="icon-btn" aria-label="Ajustes" onClick={onOpenSettings}>
          <IconSettings size={22} />
        </button>
      </header>

      <section className="hero">
        <div className="speech hero-speech">E ai! Bora ficar por aqui? 🚀</div>
        <button className="hero-nino" onClick={onOpenChat} aria-label="Conversar com o Nino">
          <Nino size={150} action="idle" expression="normal" glow={settings.glow} particles={settings.particles} />
        </button>
        <div className="status-pill">
          <i className={`dot ${settings.floating ? "ok" : ""}`} />
          <b>{settings.floating ? "Agente ativo" : "Agente pausado"}</b>
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
          <Toggle
            on={settings.floating}
            onChange={(v) => update({ floating: v, onScreen: v ? settings.onScreen : false })}
            label="Agente flutuante"
          />
        </div>

        <button
          className={`primary-btn wide ${settings.onScreen ? "active" : ""}`}
          disabled={!settings.floating}
          onClick={() => {
            const next = !settings.onScreen;
            update({ onScreen: next });
            void setNativeOverlay(next);
          }}
        >
          <IconRocket size={20} /> {settings.onScreen ? "DESATIVAR DA TELA" : "ATIVAR NA TELA"}
        </button>

        <div className="list-card inner">
          <button className="list-row" onClick={() => update({ roaming: !settings.roaming })}>
            <span className="row-ic">
              <IconMove size={20} />
            </span>
            <span className="row-text">
              <strong>Movimento</strong>
              <small>{settings.roaming ? "Passeio suave pela tela" : "Parado"}</small>
            </span>
            <IconChevron size={18} className="chev" />
          </button>
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
        </div>

        <div className="info-row">
          <span className="row-ic">
            <IconShield size={22} />
          </span>
          <p>Para aparecer sobre outros aplicativos, permita a sobreposição nas configurações do Android.</p>
        </div>
      </section>

      <button className="outline-btn chat-cta" onClick={onOpenChat}>
        <IconChat size={18} /> Conversar com o Nino
      </button>
    </div>
  );
}
