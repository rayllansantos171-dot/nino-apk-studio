import React, { useCallback, useEffect, useRef, useState } from "react";
import Nino from "./Nino";
import { Arena, Fx, NinoEngine, Snapshot, Tool, createNinoEngine } from "../utils/ninoEngine";
import { SIZE_PX } from "../utils/settings";
import { useSettings } from "../utils/SettingsContext";
import { playByName } from "../utils/sound";
import { askNino } from "@/lib/ai/nino.functions";
import { respond } from "../utils/replies";
import { speak } from "../utils/speak";
import type { VoiceCommand } from "../utils/voiceCommands";

interface FxItem extends Fx {
  id: number;
}

function getArena(): Arena {
  const shell = document.querySelector(".app-shell") as HTMLElement | null;
  const nav = document.querySelector(".bottom-nav") as HTMLElement | null;
  const r = shell
    ? shell.getBoundingClientRect()
    : ({ left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight } as DOMRect);
  const floor = nav ? nav.getBoundingClientRect().top + 3 : r.bottom - 70;
  return { left: r.left, right: r.right, top: r.top + 4, floor };
}

/** Nino flutuante com física: anda no chão, pode ser pego, jogado, derrubado de alto, golpeado e mimado. */
export default function FloatingAgent() {
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
  const tool: Tool = "grab";
  const toolRef = useRef<Tool>(tool);
  toolRef.current = tool;
  const [fxList, setFxList] = useState<FxItem[]>([]);

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

  // Ordens e perguntas por voz: o Nino obedece na hora e responde pelo balão.
  useEffect(() => {
    const timers: number[] = [];
    const onVoice = (e: Event) => {
      const { text, cmds } = (e as CustomEvent<{ text: string; cmds: VoiceCommand[] }>).detail;
      const engine = engineRef.current;
      if (!engine) return;
      const first = cmds[0];
      if (first) {
        engine.command(first);
        cmds.slice(1).forEach((c, i) => {
          timers.push(window.setTimeout(() => engineRef.current?.command(c), 2200 * (i + 1)));
        });
        return;
      }
      engine.think();
      const finish = (reply: string) => {
        engineRef.current?.speak(reply);
        if (settingsRef.current.soundVibration) speak(reply);
      };
      const local = respond(text).text;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        finish(local);
        return;
      }
      askNino({ data: { messages: [{ role: "user", content: text }] } })
        .then((r) => finish(r.ok ? r.text : local))
        .catch(() => finish(local));
    };
    window.addEventListener("nino-voice", onVoice);
    return () => {
      window.removeEventListener("nino-voice", onVoice);
      timers.forEach((id) => window.clearTimeout(id));
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

  const bubbleLeft = snap ? snap.x + snap.w / 2 > (getArena().left + getArena().right) / 2 : false;

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
          animated
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
    </>
  );
}
