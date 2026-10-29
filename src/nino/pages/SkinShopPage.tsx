import React, { useState } from "react";
import Nino from "../components/Nino";
import { IconBack, IconBolt, IconLock, IconShield, IconSparkle, IconStore } from "../components/Icons";
import { useSettings } from "../utils/SettingsContext";
import { setNativeOverlaySkin } from "../utils/nativeOverlay";
import type { SkinKey } from "../utils/settings";

interface LockedSkin {
  id: string;
  name: string;
  tint: string;
  preview: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
}

/** Skins ainda bloqueadas (prévia). As cores acompanham a cor do personagem (tema escolhido). */
const LOCKED: LockedSkin[] = [
  { id: "heroi-cosmico", name: "Herói Cósmico", tint: "var(--accent)", preview: "color-mix(in srgb, var(--accent) 14%, #0b0b16)", Icon: IconShield },
  { id: "armadura-de-energia", name: "Armadura de Energia", tint: "var(--accent-soft)", preview: "color-mix(in srgb, var(--accent) 8%, #120c1c)", Icon: IconBolt },
];

const ANGEL_ID = "anjo";

export default function SkinShopPage({ onBack }: { onBack: () => void }) {
  const { settings, update } = useSettings();
  const [openId, setOpenId] = useState<string | null>(ANGEL_ID);
  const lockedOpen = LOCKED.find((s) => s.id === openId) ?? null;
  const angelEquipped = settings.skin === "anjo";

  const equip = (skin: SkinKey) => {
    update({ skin });
    void setNativeOverlaySkin(skin);
  };

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
            <IconSparkle size={22} />
          </span>
          <div>
            <h3>Skins especiais</h3>
            <p>Novos visuais para o seu Nino.</p>
          </div>
        </div>

        <div className="skin-grid">
          <button
            className={`skin-card wide ${openId === ANGEL_ID ? "active" : ""}`}
            style={{ "--tint": "#ffd24d", "--preview": "color-mix(in srgb, var(--accent) 12%, #0e0c1c)" } as React.CSSProperties}
            onClick={() => setOpenId(ANGEL_ID)}
            aria-pressed={openId === ANGEL_ID}
            aria-label={`Anjo, ${angelEquipped ? "equipada" : "disponível"}. Toque para ver os detalhes`}
          >
            <div className="skin-preview">
              <Nino skin="anjo" size={84} glow={false} particles={false} />
            </div>
            <div className="skin-info">
              <strong>Anjo</strong>
              <span className={`skin-badge ${angelEquipped ? "ok" : "free"}`}>
                {angelEquipped ? "Equipada" : "Disponível"}
              </span>
              <small>Toque para ver</small>
            </div>
          </button>

          {LOCKED.map((s) => (
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

        {openId === ANGEL_ID && (
          <div className="skin-details" role="region" aria-label="Detalhes de Anjo">
            <div className="skin-details-head angel">
              <IconSparkle size={22} />
              <div>
                <h3>Anjo</h3>
                <p>Auréola dourada e asas que batem enquanto o Nino anda.</p>
              </div>
            </div>
            {angelEquipped ? (
              <>
                <p className="skin-state">Skin equipada. É assim que o Nino aparece agora.</p>
                <button className="outline-btn" onClick={() => equip("padrao")}>
                  Voltar ao visual padrão
                </button>
              </>
            ) : (
              <button className="primary-btn wide" onClick={() => equip("anjo")}>
                Equipar skin Anjo
              </button>
            )}
            <button className="outline-btn" onClick={() => setOpenId(null)}>
              Fechar detalhes
            </button>
          </div>
        )}

        {lockedOpen && (
          <div className="skin-details" role="region" aria-label={`Detalhes de ${lockedOpen.name}`}>
            <div className="skin-details-head">
              <IconLock size={22} />
              <div>
                <h3>{lockedOpen.name}</h3>
                <p>Esta skin está bloqueada.</p>
              </div>
            </div>
            <button className="outline-btn" onClick={() => setOpenId(null)}>
              Fechar detalhes
            </button>
          </div>
        )}

        <p className="shop-note">As skins bloqueadas chegam em breve</p>

        <button className="outline-btn" onClick={onBack}>
          Voltar para Aparência
        </button>
      </div>
    </div>
  );
}
