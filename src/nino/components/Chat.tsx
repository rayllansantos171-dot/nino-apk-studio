import React, { useCallback, useEffect, useRef, useState } from "react";
import Nino from "./Nino";
import DefendScene from "./DefendScene";
import { IconBack, IconSend, IconSmile } from "./Icons";
import { SCENE_LINES, respond, Weapon } from "../utils/replies";
import { playBang, playHit, playPop, playSend, playThud, vibrate } from "../utils/sound";
import { useSettings } from "../utils/SettingsContext";
import { askNino } from "@/lib/ai/nino.functions";

interface Msg {
  id: number;
  from: "nino" | "user";
  text: string;
  time: string;
}

const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const SUGGESTIONS = ["Qual seu propósito?", "Me conta uma piada", "Que horas são?"];

export default function Chat({ onBack }: { onBack: () => void }) {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, from: "nino", text: "Olá! 👋 Eu sou o Nino! Seu agente de IA. Como posso te ajudar hoje?", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [scene, setScene] = useState<{ weapon: Weapon; line: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const closeScene = useCallback(() => setScene(null), []);

  const playScene = (weapon: Weapon) => {
    if (!settings.soundVibration) return;
    vibrate(80);
    if (weapon === "pistol") {
      [450, 700, 950].forEach((ms) => window.setTimeout(playBang, ms));
    } else {
      window.setTimeout(playHit, 450);
      window.setTimeout(playThud, 750);
    }
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    if (settings.soundVibration) {
      playSend();
      vibrate(15);
    }
    const local = respond(clean);
    const useLocal = !!local.defend || local.text.includes("Rayllan");
    const history = [...messages.slice(1), { from: "user" as const, text: clean }]
      .slice(-20)
      .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));
    setMessages((m) => [...m, { id: idRef.current++, from: "user", text: clean, time: now() }]);
    setInput("");
    setTyping(true);
    const deliver = (text: string, defend?: Weapon) => {
      if (defend) {
        const lines = SCENE_LINES[defend];
        setScene({ weapon: defend, line: lines[Math.floor(Math.random() * lines.length)] });
        playScene(defend);
      }
      setMessages((m) => [...m, { id: idRef.current++, from: "nino", text, time: now() }]);
      setTyping(false);
      if (settings.soundVibration && !defend) playPop();
    };
    if (useLocal) {
      window.setTimeout(() => deliver(local.text, local.defend), local.defend ? 450 : 700);
      return;
    }
    askNino({ data: { messages: history } })
      .then((r) => deliver(r.ok ? r.text : r.error))
      .catch(() => deliver("Ops, perdi a conexão. Tente de novo! 📡"));
  };

  return (
    <div className={`chat ${scene ? "shake" : ""}`}>
      <header className="chat-header">
        <button className="icon-btn" onClick={onBack} aria-label="Voltar">
          <IconBack />
        </button>
        <div className="chat-avatar">
          <Nino size={30} glow={false} particles={false} />
        </div>
        <div className="chat-title">
          <strong>Nino</strong>
          <span className="online">Online</span>
        </div>
      </header>

      <div className="chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`msg-row ${m.from}`}>
            {m.from === "nino" && (
              <div className="msg-avatar">
                <Nino size={28} glow={false} particles={false} />
              </div>
            )}
            <div className={`bubble ${m.from}`}>
              <p>{m.text}</p>
              <time>{m.time}</time>
            </div>
          </div>
        ))}
        {typing && (
          <div className="msg-row nino">
            <div className="msg-avatar">
              <Nino size={28} glow={false} particles={false} />
            </div>
            <div className="bubble nino typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-footer">
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <IconSmile className="input-ic" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            aria-label="Mensagem"
          />
          <button type="submit" className="send-btn" aria-label="Enviar" disabled={!input.trim()}>
            <IconSend />
          </button>
        </form>
      </div>

      {scene && <DefendScene weapon={scene.weapon} line={scene.line} onDone={closeScene} />}
    </div>
  );
}
