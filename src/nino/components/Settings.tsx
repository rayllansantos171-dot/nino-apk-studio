import React, { useState } from "react";
import ThemeSelector from "./ThemeSelector";
import {
  IconBell,
  IconBolt,
  IconChevron,
  IconCube,
  IconFoot,
  IconGlobe,
  IconInfo,
  IconNormal,
  IconRefresh,
  IconShield,
  IconSize,
  IconSlow,
  IconSparkle,
  IconVolume,
  IconHeart,
} from "./Icons";
import { SizeKey, SpeedKey } from "../utils/settings";
import { useSettings } from "../utils/SettingsContext";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  );
}

function OptionGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string; icon: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="option-group">
      {options.map((o) => (
        <button
          key={o.key}
          className={`option ${value === o.key ? "active" : ""}`}
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
        >
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Aba "Aparência": tema, tamanho, velocidade e efeitos. */
export function AppearancePanel() {
  const { settings, update } = useSettings();

  return (
    <div className="panel-scroll">
      <h3 className="section-title">Tema</h3>
      <ThemeSelector />

      <h3 className="section-title">Tamanho</h3>
      <OptionGroup<SizeKey>
        value={settings.size}
        onChange={(v) => update({ size: v })}
        options={[
          { key: "small", label: "Pequeno", icon: <IconSize size={20} /> },
          { key: "medium", label: "Médio", icon: <IconSize size={24} /> },
          { key: "large", label: "Grande", icon: <IconSize size={28} /> },
        ]}
      />

      <h3 className="section-title">Velocidade</h3>
      <OptionGroup<SpeedKey>
        value={settings.speed}
        onChange={(v) => update({ speed: v })}
        options={[
          { key: "slow", label: "Lenta", icon: <IconSlow size={22} /> },
          { key: "normal", label: "Normal", icon: <IconNormal size={22} /> },
          { key: "fast", label: "Rápida", icon: <IconBolt size={22} /> },
        ]}
      />

      <h3 className="section-title">Efeitos</h3>
      <div className="list-card">
        <div className="list-row">
          <span className="row-ic small">
            <IconSparkle size={18} />
          </span>
          <span className="row-title">Efeitos de brilho</span>
          <Toggle on={settings.glow} onChange={(v) => update({ glow: v })} label="Efeitos de brilho" />
        </div>
        <div className="list-row">
          <span className="row-ic small">
            <IconCube size={18} />
          </span>
          <span className="row-title">Partículas</span>
          <Toggle on={settings.particles} onChange={(v) => update({ particles: v })} label="Partículas" />
        </div>
        <div className="list-row">
          <span className="row-ic small">
            <IconFoot size={18} />
          </span>
          <span className="row-title">Som de passos</span>
          <Toggle on={settings.stepSound} onChange={(v) => update({ stepSound: v })} label="Som de passos" />
        </div>
      </div>
    </div>
  );
}

/** Aba "Ajustes": notificações, comportamento, permissões, som, idioma e sobre. */
export function SettingsList() {
  const { settings, update, reset } = useSettings();
  const [toast, setToast] = useState<string | null>(null);

  const show = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="panel-scroll">
      <div className="list-card">
        <div className="list-row">
          <span className="row-ic">
            <IconBell size={20} />
          </span>
          <span className="row-text">
            <strong>Notificações</strong>
            <small>Balões e alertas</small>
          </span>
          <Toggle
            on={settings.notifications}
            onChange={(v) => update({ notifications: v, bubbles: v })}
            label="Notificações"
          />
        </div>

        <button
          className="list-row"
          onClick={() => {
            update({ roaming: !settings.roaming });
            show(settings.roaming ? "Nino vai ficar parado." : "Nino vai passear pela tela!");
          }}
        >
          <span className="row-ic">
            <IconHeart size={20} />
          </span>
          <span className="row-text">
            <strong>Comportamento</strong>
            <small>{settings.roaming ? "Como Nino se comporta: passeando" : "Como Nino se comporta: parado"}</small>
          </span>
          <IconChevron size={18} className="chev" />
        </button>

        <button
          className="list-row"
          onClick={() =>
            show("No app Android, ative 'Sobreposição de tela' nas configurações do sistema para o Nino aparecer sobre outros apps.")
          }
        >
          <span className="row-ic">
            <IconShield size={20} />
          </span>
          <span className="row-text">
            <strong>Permissões</strong>
            <small>Sobreposição de tela</small>
          </span>
          <IconChevron size={18} className="chev" />
        </button>

        <div className="list-row">
          <span className="row-ic">
            <IconVolume size={20} />
          </span>
          <span className="row-text">
            <strong>Som e vibração</strong>
            <small>Efeitos e voz</small>
          </span>
          <Toggle
            on={settings.soundVibration}
            onChange={(v) => update({ soundVibration: v })}
            label="Som e vibração"
          />
        </div>

        <button className="list-row" onClick={() => show("Idioma: Português (BR)")}>
          <span className="row-ic flag">
            <IconGlobe size={20} />
          </span>
          <span className="row-text">
            <strong>Idioma</strong>
            <small>Português (BR)</small>
          </span>
          <IconChevron size={18} className="chev" />
        </button>

        <button className="list-row" onClick={() => show("Nino AI — versão 1.0.0 💜")}>
          <span className="row-ic">
            <IconInfo size={20} />
          </span>
          <span className="row-text">
            <strong>Sobre</strong>
            <small>Versão 1.0.0</small>
          </span>
          <IconChevron size={18} className="chev" />
        </button>
      </div>

      <button
        className="outline-btn"
        onClick={() => {
          reset();
          show("Nino reiniciado!");
        }}
      >
        <IconRefresh size={18} /> Reiniciar o Nino
      </button>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
