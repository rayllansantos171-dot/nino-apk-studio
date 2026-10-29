import React from "react";
import type { Action, Expression } from "../utils/ninoEngine";
import type { SkinKey } from "../utils/settings";
import { useSettings } from "../utils/SettingsContext";

export type { Action, Expression };

interface Props {
  expression?: Expression;
  action?: Action;
  size?: number;
  flip?: boolean;
  glow?: boolean;
  particles?: boolean;
  flash?: boolean;
  /** Só o Nino ativado (flutuante) e a cena de defesa se mexem; os demais ficam parados. */
  animated?: boolean;
  /** Visual do Nino. Sem este valor, usa a skin equipada na loja. */
  skin?: SkinKey;
  /** Arma de brincadeira usada na cena em que ele defende o criador. */
  weapon?: "club" | "pistol" | null;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/** Retângulos da asa esquerda: x, y, largura, altura, cor. */
const WING_RECTS: ReadonlyArray<readonly [number, number, number, number, string]> = [
  [14, 62, 14, 10, "#f6f3ff"],
  [4, 70, 24, 10, "#f6f3ff"],
  [-6, 78, 34, 10, "#efeaff"],
  [-12, 86, 40, 9, "#e4ddfa"],
  [-8, 93, 34, 8, "#d6cdf3"],
  [2, 99, 24, 7, "#c8bdec"],
  [14, 62, 14, 3, "#ffffff"],
];

/** Mascote Nino em estilo voxel (blocos), desenhado em SVG. As cores seguem o tema (--accent). */
export default function Nino({
  expression = "normal",
  action = "idle",
  size = 160,
  flip = false,
  glow = true,
  particles = true,
  flash = false,
  animated = false,
  skin,
  weapon = null,
  className = "",
  style,
  onClick,
}: Props) {
  const { settings } = useSettings();
  const activeSkin: SkinKey = skin ?? settings.skin;
  const angel = activeSkin === "anjo";

  const eyes = (() => {
    switch (expression) {
      case "happy":
        return (
          <g className="nino-eyes" fill="none" stroke="var(--accent-soft)" strokeWidth="4" strokeLinecap="square">
            <polyline points="42,46 49,38 56,46" />
            <polyline points="64,46 71,38 78,46" />
          </g>
        );
      case "wink":
        return (
          <g className="nino-eyes">
            <rect x="44" y="32" width="9" height="18" fill="var(--accent-soft)" />
            <polyline
              points="64,34 78,41 64,48"
              fill="none"
              stroke="var(--accent-soft)"
              strokeWidth="4"
              strokeLinecap="square"
            />
          </g>
        );
      case "surprise":
        return (
          <g className="nino-eyes" fill="var(--accent-soft)">
            <rect x="44" y="28" width="10" height="24" />
            <rect x="66" y="28" width="10" height="24" />
          </g>
        );
      case "angry":
        return (
          <g className="nino-eyes" fill="#ff5a7a">
            <polygon points="43,38 54,32 54,50 43,50" />
            <polygon points="66,32 77,38 77,50 66,50" />
          </g>
        );
      case "dizzy":
        return (
          <g
            className="nino-eyes nino-eyes-dizzy"
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="3.5"
            strokeLinecap="square"
          >
            <polyline points="43,32 54,50" />
            <polyline points="54,32 43,50" />
            <polyline points="66,32 77,50" />
            <polyline points="77,32 66,50" />
          </g>
        );
      case "sad":
        return (
          <g className="nino-eyes">
            <rect x="44" y="36" width="9" height="13" fill="var(--accent-soft)" />
            <rect x="67" y="36" width="9" height="13" fill="var(--accent-soft)" />
            <rect className="tear" x="46" y="50" width="4" height="9" fill="#7dd3fc" />
            <rect className="tear tear2" x="69" y="50" width="4" height="9" fill="#7dd3fc" />
          </g>
        );
      case "love":
        return (
          <g className="nino-eyes nino-eyes-love" fill="#ff5a9a">
            <polygon points="41,35 44,32 47,35 50,32 53,35 53,40 47,47 41,40" />
            <polygon points="67,35 70,32 73,35 76,32 79,35 79,40 73,47 67,40" />
          </g>
        );
      case "sleep":
        return (
          <g className="nino-eyes" fill="var(--accent-soft)">
            <rect x="43" y="44" width="11" height="3" />
            <rect x="66" y="44" width="11" height="3" />
          </g>
        );
      default:
        return (
          <g className="nino-eyes" fill="var(--accent-soft)">
            <rect x="44" y="32" width="9" height="18" />
            <rect x="67" y="32" width="9" height="18" />
          </g>
        );
    }
  })();

  return (
    <div
      className={`nino nino-${action} ${glow ? "nino-glow" : ""} ${flash ? "nino-flash" : ""} ${weapon ? "nino-armed" : ""} ${animated ? "" : "nino-still"} ${angel ? "nino-skin-anjo" : ""} ${className}`}
      style={{ width: size, height: size * (170 / 120), ...style }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label="Nino"
    >
      <div className="nino-flip" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
        <svg viewBox="0 0 120 170" width="100%" height="100%" shapeRendering="crispEdges" style={{ overflow: "visible" }}>
          {/* sombra / aura no chão */}
          <ellipse className="nino-shadow" cx="60" cy="163" rx="34" ry="5" fill="var(--accent)" opacity="0.35" />

          {particles && (
            <g className="nino-particles" fill="var(--accent-soft)">
              <rect className="p p1" x="8" y="60" width="4" height="4" />
              <rect className="p p2" x="104" y="40" width="5" height="5" />
              <rect className="p p3" x="14" y="120" width="3" height="3" />
              <rect className="p p4" x="108" y="110" width="4" height="4" />
              <rect className="p p5" x="96" y="12" width="3" height="3" />
            </g>
          )}

          <g className="nino-all">
            {/* skin Anjo: asas atrás do corpo (a direita é desenhada espelhada, sem transform no SVG) */}
            {angel && (
              <g className="nino-wings">
                <g className="nino-wing nino-wing-l">
                  {WING_RECTS.map(([x, y, w, h, fill], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
                  ))}
                </g>
                <g className="nino-wing nino-wing-r">
                  {WING_RECTS.map(([x, y, w, h, fill], i) => (
                    <rect key={i} x={120 - x - w} y={y} width={w} height={h} fill={fill} />
                  ))}
                </g>
              </g>
            )}

            {/* pernas */}
            <g className="nino-leg nino-leg-l">
              <rect x="40" y="122" width="18" height="30" fill="#2a1f40" />
              <rect x="40" y="122" width="6" height="30" fill="#34264f" />
              <rect x="38" y="150" width="22" height="9" fill="var(--accent)" />
              <rect x="38" y="150" width="22" height="3" fill="var(--accent-soft)" opacity="0.6" />
            </g>
            <g className="nino-leg nino-leg-r">
              <rect x="62" y="122" width="18" height="30" fill="#2a1f40" />
              <rect x="62" y="122" width="6" height="30" fill="#34264f" />
              <rect x="60" y="150" width="22" height="9" fill="var(--accent)" />
              <rect x="60" y="150" width="22" height="3" fill="var(--accent-soft)" opacity="0.6" />
            </g>

            {/* braço esquerdo */}
            <g className="nino-arm nino-arm-l">
              <rect x="21" y="76" width="14" height="36" fill="#241a38" />
              <rect x="21" y="76" width="5" height="36" fill="#34264f" />
              <rect x="21" y="108" width="14" height="10" fill="var(--accent)" />
            </g>

            {/* corpo (moletom) */}
            <g className="nino-torso">
              <rect x="34" y="74" width="52" height="52" fill="#241a38" />
              <rect x="34" y="74" width="10" height="52" fill="#2d2147" />
              <rect x="76" y="74" width="10" height="52" fill="#1c142d" />
              {/* textura de pixels */}
              <g fill="#3a2b5c" opacity="0.55">
                <rect x="46" y="100" width="6" height="6" />
                <rect x="58" y="110" width="6" height="6" />
                <rect x="70" y="98" width="6" height="6" />
                <rect x="40" y="114" width="6" height="6" />
              </g>
              {/* bolso */}
              <rect x="44" y="108" width="32" height="14" fill="#1a1229" />
              {/* cordões */}
              <rect x="53" y="80" width="3" height="16" fill="var(--accent)" />
              <rect x="64" y="80" width="3" height="16" fill="var(--accent)" />
              <rect x="52" y="94" width="5" height="3" fill="var(--accent-soft)" />
              <rect x="63" y="94" width="5" height="3" fill="var(--accent-soft)" />
              {/* coroa */}
              <polygon points="50,106 50,97 55,101 60,94 65,101 70,97 70,106" fill="var(--accent)" />
              <rect x="50" y="104" width="20" height="2" fill="var(--accent-soft)" />
            </g>

            {/* braço direito */}
            <g className="nino-arm nino-arm-r">
              <rect x="85" y="76" width="14" height="36" fill="#241a38" />
              <rect x="94" y="76" width="5" height="36" fill="#1c142d" />
              <rect x="85" y="108" width="14" height="10" fill="var(--accent)" />
            </g>

            {/* cacete de brinquedo */}
            {weapon === "club" && (
              <g className="nino-weapon nino-club">
                <rect x="118" y="92" width="7" height="24" fill="#7a4a22" />
                <rect x="119" y="92" width="2" height="24" fill="#9a6232" />
                <rect x="114" y="52" width="15" height="42" fill="#a8713a" />
                <rect x="114" y="52" width="4" height="42" fill="#c48a4c" />
                <rect x="114" y="60" width="15" height="3" fill="#5b3a1a" />
                <rect x="114" y="74" width="15" height="3" fill="#5b3a1a" />
                <rect x="114" y="88" width="15" height="3" fill="#5b3a1a" />
                <rect x="111" y="64" width="3" height="4" fill="#d9d9e6" />
                <rect x="129" y="70" width="3" height="4" fill="#d9d9e6" />
                <rect x="111" y="80" width="3" height="4" fill="#d9d9e6" />
              </g>
            )}

            {/* pistola de brinquedo */}
            {weapon === "pistol" && (
              <g className="nino-weapon nino-pistol">
                <rect x="116" y="92" width="26" height="8" fill="#3a3a4f" />
                <rect x="116" y="92" width="26" height="2" fill="#5a5a75" />
                <rect x="114" y="98" width="9" height="16" fill="#2a2a3a" />
                <rect x="124" y="100" width="6" height="3" fill="#2a2a3a" />
                <rect x="140" y="90" width="3" height="3" fill="#8a8aa5" />
                <g className="muzzle">
                  <polygon points="143,96 153,89 150,96 158,96 150,99 153,105 143,98" fill="#ffe066" />
                  <polygon points="143,96 149,93 148,96 152,96 148,98 149,101 143,98" fill="#fff7cc" />
                </g>
              </g>
            )}

            {/* cabeça */}
            <g className="nino-head">
              {/* fones de ouvido */}
              <rect x="16" y="28" width="12" height="28" fill="var(--accent)" />
              <rect x="18" y="32" width="6" height="20" fill="var(--accent-soft)" opacity="0.7" />
              <rect x="92" y="28" width="12" height="28" fill="var(--accent)" />
              <rect x="96" y="32" width="6" height="20" fill="var(--accent-soft)" opacity="0.7" />
              <rect x="26" y="4" width="68" height="7" fill="#34264f" />
              <rect x="20" y="12" width="6" height="20" fill="#34264f" />
              <rect x="94" y="12" width="6" height="20" fill="#34264f" />

              {/* caixa da cabeça */}
              <rect x="26" y="8" width="68" height="64" fill="#2a1f40" />
              <rect x="26" y="8" width="68" height="6" fill="#3a2b5c" />
              <rect x="26" y="8" width="6" height="64" fill="#34264f" />
              <rect x="88" y="8" width="6" height="64" fill="#1c142d" />
              <rect x="26" y="66" width="68" height="6" fill="#1c142d" />

              {/* tela do rosto */}
              <rect x="34" y="17" width="52" height="47" fill="#0b0614" />
              <rect
                className="nino-screen"
                x="34"
                y="17"
                width="52"
                height="47"
                fill="none"
                stroke={expression === "angry" ? "#ff5a7a" : "var(--accent)"}
                strokeWidth="2"
              />
              {eyes}
              {/* skin Anjo: auréola dourada */}
              {angel && (
                <g className="nino-halo">
                  <rect x="42" y="-9" width="36" height="3" fill="#ffe27a" />
                  <rect x="42" y="-9" width="36" height="1" fill="#fff6c8" />
                  <rect x="42" y="-2" width="36" height="3" fill="#f2b632" />
                  <rect x="37" y="-6" width="5" height="5" fill="#ffd24d" />
                  <rect x="78" y="-6" width="5" height="5" fill="#ffd24d" />
                </g>
              )}
              {expression === "surprise" && (
                <g fill="var(--accent-soft)" className="nino-excl">
                  <rect x="98" y="-6" width="5" height="14" />
                  <rect x="98" y="11" width="5" height="5" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>

      {action === "dance" && (
        <>
          <span className="note n1">♪</span>
          <span className="note n2">♫</span>
        </>
      )}
      {action === "panic" && <span className="note n3">!</span>}
      {(action === "dazed" || action === "ko") && <span className="dizzy-stars">★ ★ ★</span>}
      {action === "sleep" && <span className="note n4">z</span>}
      {action === "think" && <span className="note n3">?</span>}
      {action === "clap" && <span className="note n1">✦</span>}
      {action === "flex" && <span className="note n2">✦</span>}
    </div>
  );
}
