import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Nino from "./Nino";
import { IconChat, IconFist, IconHand, IconHeart } from "./Icons";
import { Arena, Fx, NinoEngine, Snapshot, Tool, createNinoEngine } from "../utils/ninoEngine";
import { SIZE_PX } from "../utils/settings";
import { useSettings } from "../utils/SettingsContext";
import { playByName } from "../utils/sound";

interface Props {
  onOpenChat: () => void;
}

interface FxItem extends Fx {
  id: number;
}

const HINTS: Record<Tool, string> = {
  grab: "Arraste para pegar. Solte de lá de cima!",
  punch: "Toque nele para bater.",
  pet: "Toque nele para fazer carinho.",
};

function getArena(): Arena {
  const shell = document.querySelector(".app-shell") as HTMLElement | null;
  const hud = document.querySelector(".nino-hud") as HTMLElement | null;
  const r = shell
    ? shell.getBoundingClientRect()
    : ({ left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight } as DOMRect);
  const floor = hud ? hud.getBoundingClientRect().top + 3 : r.bottom - 70;
  return { left: r.left, right: r.right, top: r.top + 4, floor };
}

function Heart({ fill }: { fill: 0 | 0.5 | 1 }) {
  const rects = (
    <>
      <rect x="1" y="0" width="3" height="1" />
      <rect x="5" y="0" width="3" height="1" />
      <rect x="0" y="1" width="9" height="3" />
      <rect x="1" y="4" width="7" height="1" />
      <rect x="2" y="5" width="5" height="1" />
      <rect x="3" y="6" width="3" height="1" />
      <rect x="4" y="7" width="1" height="1" />
    </>
  );
  return (
    <span className="heart">
      <svg viewBox="0 0 9 8" fill="#3a2b5c" shapeRendering="crispEdges">
        {rects}
      </svg>
      {fill > 0 && (
        <svg
          viewBox="0 0 9 8"
          fill="#ff4d6d"
          shapeRendering="crispEdges"
          style={{ clipPath: fill === 0.5 ? "inset(0 50% 0 0)" : undefined }}
        >
          {rects}
        </svg>
      )}
    </span>
  );
}

/** Nino flutuante com física: anda no chão, pode ser pego, jogado, derrubado de alto, golpeado e mimado. */
export default function FloatingAgent({ onOpenChat }: Props) {
  const { settings } = useSettings();
  const size = SIZE_PX[settings.size];

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const elRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NinoEngine | null>(null);
  const keyRef = useRef("");
  const fxId = useRef(0);

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [tool, setTool] = useState<Tool>("grab");
  const toolRef = useRef<Tool>("grab");
  toolRef.current = tool;
  const [fxList, setFxList] = useState<FxItem[]>([]);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById("hud-slot"));
  }, []);

  useEffect(() => {
    const engine = createNinoEngine({
      getArena,
      getWidth: () => sizeRef.current,
      getOptions: () => ({
        roaming: settingsRef.current.roaming,
        bubbles: settingsRef.current.bubbles,
        speed: settingsRef.current.speed,
        freeDrag: settingsRef.current.freeDrag,
      }),
      onChange: (s) => {
        const el = elRef.current;
        if (el) {
          el.style.transform = `translate(${s.x}px, ${s.y}px)`;
          el.style.visibility = "visible";
        }
        const key = [s.action, s.expression, s.flip, s.bubble, s.hp, s.mood, s.held, s.flash].join("|");
        if (key !== keyRef.current) {
          keyRef.current = key;
          setSnap(s);
        }
      },
      onFx: (fx) => {
        setFxList((l) => [...l.slice(-14), { ...fx, id: ++fxId.current }]);
      },
      onSound: (n) => {
        if (settingsRef.current.soundVibration && (n !== "step" || settingsRef.current.stepSound)) playByName(n);
      },
    });
    engineRef.current = engine;
    engine.start();
    engine.greet();
    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  const removeFx = useCallback((id: number) => {
    setFxList((l) => l.filter((f) => f.id !== id));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    engineRef.current?.pointerDown(e.clientX, e.clientY, toolRef.current);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    engineRef.current?.pointerMove(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    engineRef.current?.pointerUp();
  };

  const mood = snap ? snap.mood : 55;
  const hp = snap ? snap.hp : 10;
  const bubbleLeft = snap ? snap.x + snap.w / 2 > (getArena().left + getArena().right) / 2 : false;

  const hud = (
    <div className="nino-hud">
      <div className="hud-stats">
        <div className="hearts" aria-label={`Vida ${hp / 2} de 5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Heart key={i} fill={hp >= i * 2 + 2 ? 1 : hp === i * 2 + 1 ? 0.5 : 0} />
          ))}
        </div>
        <div className="mood">
          <span className="mood-label">{snap ? snap.moodLabel : "De boa"}</span>
          <div className="mood-bar" aria-label={`Humor ${mood}%`}>
            <i style={{ width: `${mood}%` }} />
          </div>
        </div>
        <p className="hud-hint">{HINTS[tool]}</p>
      </div>
      <div className="hud-tools">
        <button
          className={tool === "grab" ? "active" : ""}
          onClick={() => setTool("grab")}
          aria-label="Pegar e jogar"
          aria-pressed={tool === "grab"}
        >
          <IconHand size={20} />
          <span>Pegar</span>
        </button>
        <button
          className={tool === "punch" ? "active" : ""}
          onClick={() => setTool("punch")}
          aria-label="Bater"
          aria-pressed={tool === "punch"}
        >
          <IconFist size={20} />
          <span>Bater</span>
        </button>
        <button
          className={tool === "pet" ? "active" : ""}
          onClick={() => setTool("pet")}
          aria-label="Carinho"
          aria-pressed={tool === "pet"}
        >
          <IconHeart size={20} />
          <span>Carinho</span>
        </button>
        <button onClick={onOpenChat} aria-label="Conversar">
          <IconChat size={20} />
          <span>Chat</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={elRef}
        className={`floating-agent tool-${tool} ${snap && snap.held ? "held" : ""}`}
        style={{ width: size, height: size * (170 / 120), visibility: "hidden" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {snap && snap.bubble && <div className={`speech ${bubbleLeft ? "left" : "right"}`}>{snap.bubble}</div>}
        <Nino
          size={size}
          action={snap ? snap.action : "idle"}
          expression={snap ? snap.expression : "normal"}
          flip={snap ? snap.flip : false}
          flash={snap ? snap.flash : false}
          glow={settings.glow}
          particles={settings.particles}
        />
      </div>

      {fxList.map((f) => (
        <span
          key={f.id}
          className={`fx fx-${f.kind}`}
          style={{ left: f.x, top: f.y }}
          onAnimationEnd={() => removeFx(f.id)}
        >
          {f.text}
        </span>
      ))}

      {slot ? createPortal(hud, slot) : null}
    </>
  );
}
