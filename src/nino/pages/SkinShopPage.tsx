import React, { useState } from "react";
import { IconBack, IconBolt, IconLock, IconShield, IconSparkle, IconStore } from "../components/Icons";

interface Skin {
  id: string;
  name: string;
  tint: string;
  preview: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
}

/** Skins da loja. Por enquanto são apenas uma prévia: todas permanecem bloqueadas. */
const SKINS: Skin[] = [
  { id: "heroi-cosmico", name: "Herói Cósmico", tint: "#4f8dfd", preview: "#15152e", Icon: IconShield },
  { id: "armadura-de-energia", name: "Armadura de Energia", tint: "#f472b6", preview: "#25142e", Icon: IconBolt },
];

export default function SkinShopPage({ onBack }: { onBack: () => void }) {
  const [openId, setOpenId] = useState<string | null>(SKINS[0]?.id ?? null);
  const open = SKINS.find((s) => s.id === openId) ?? null;

  return (
    <div className="page">
      <header className="page-header shop-header">
        <button className="icon-btn" onClick={onBack} aria-label="Voltar para Aparência">
          <IconBack size={20} />
        </button>
        <div className="shop-title">
          <h2>Loja de Skins</h2>
          <p>Escolha uma nova aparência.</p>
        </div>
        <span className="icon-btn store static" aria-hidden="true">
          <IconStore size={26} />
        </span>
      </header>

      <div className="panel-scroll">
        <div className="shop-banner">
          <span className="shop-banner-ic">
            <IconLock size={22} />
          </span>
          <div>
            <h3>Skins especiais</h3>
            <p>Desbloqueie novos visuais para seu Nino.</p>
          </div>
        </div>

        <div className="skin-grid">
          {SKINS.map((s) => (
            <button
              key={s.id}
              className={`skin-card ${openId === s.id ? "active" : ""}`}
              style={{ "--tint": s.tint, "--preview": s.preview } as React.CSSProperties}
              onClick={() => setOpenId(s.id)}
              aria-pressed={openId === s.id}
              aria-label={`${s.name}, bloqueada. Toque para ver os detalhes`}
            >
              <div className="skin-preview">
                <s.Icon size={24} />
                <IconSparkle size={26} />
                <span className="skin-lock">
                  <IconLock size={24} />
                </span>
              </div>
              <strong>{s.name}</strong>
              <span className="skin-badge">Bloqueada</span>
              <small>Toque para ver</small>
            </button>
          ))}
        </div>

        {open && (
          <div className="skin-details" role="region" aria-label={`Detalhes de ${open.name}`}>
            <div className="skin-details-head">
              <IconLock size={22} />
              <div>
                <h3>{open.name}</h3>
                <p>Esta skin está bloqueada.</p>
              </div>
            </div>
            <button className="outline-btn" onClick={() => setOpenId(null)}>
              Fechar detalhes
            </button>
          </div>
        )}

        <p className="shop-note">Prévia demonstrativa • As skins permanecem bloqueadas</p>

        <button className="outline-btn" onClick={onBack}>
          Voltar para Aparência
        </button>
      </div>
    </div>
  );
}
