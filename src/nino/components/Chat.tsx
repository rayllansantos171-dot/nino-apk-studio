import React, { useCallback, useEffect, useRef, useState } from "react";
import Nino from "./Nino";
import DefendScene from "./DefendScene";
import { IconBack, IconCamera, IconClose, IconImage, IconSend } from "./Icons";
import { SCENE_LINES, respond, Weapon } from "../utils/replies";
import { playBang, playHit, playPop, playSend, playThud, vibrate } from "../utils/sound";
import { useSettings } from "../utils/SettingsContext";
import { askNino } from "@/lib/ai/nino.functions";
import { withTimeout } from "../utils/withTimeout";
import { fileToDataUrl } from "../utils/image";
import { speak } from "../utils/speak";

interface Msg {
  id: number;
  from: "nino" | "user";
  text: string;
  time: string;
  image?: string | undefined;
}

const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const SUGGESTIONS = ["Qual seu propósito?", "Me conta uma piada", "Que horas são?"];

export default function Chat({
  onBack,
  voiceText,
  onVoiceHandled,
}: {
  onBack: () => void;
  voiceText?: string | null | undefined;
  onVoiceHandled?: (() => void) | undefined;
}) {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, from: "nino", text: "Olá! 👋 Eu sou o Nino! Seu agente de IA. Como posso te ajudar hoje?", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [scene, setScene] = useState<{ weapon: Weapon; line: string } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const speakRef = useRef(false);
  const voiceRef = useRef<string | null>(null);

  useEffect(() => {
    // Rola só a lista de mensagens (scrollIntoView também empurrava a página inteira e quebrava o layout com o teclado).
    const body = bodyRef.current;
    if (body) body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
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

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    try {
      setPendingImage(await fileToDataUrl(file));
    } catch {
      setMessages((m) => [
        ...m,
        { id: idRef.current++, from: "nino", text: "Não consegui abrir essa foto. Tenta outra? 📷", time: now() },
      ]);
    }
  };

  const send = (text: string, image: string | null = null, fromVoice = false) => {
    const clean = text.trim() || (image ? "O que você vê nessa foto?" : "");
    if (!clean || typing) return;
    speakRef.current = fromVoice;
    if (settings.soundVibration) {
      playSend();
      vibrate(15);
    }
    const local = respond(clean);
    const useLocal = !image && (!!local.defend || local.text.includes("Rayllan"));
    const history = [...messages.slice(1), { from: "user" as const, text: clean, image: image ?? undefined }]
      .slice(-20)
      .map((m, i, arr) => ({
        role: m.from === "user" ? ("user" as const) : ("assistant" as const),
        content: m.image && i < arr.length - 1 ? `${m.text} [foto enviada]` : m.text,
        ...(m.image && i === arr.length - 1 ? { image: m.image } : {}),
      }));
    setMessages((m) => [
      ...m,
      { id: idRef.current++, from: "user", text: clean, time: now(), image: image ?? undefined },
    ]);
    setInput("");
    setPendingImage(null);
    setTyping(true);
    const deliver = (text: string, defend?: Weapon) => {
      if (defend) {
        const lines = SCENE_LINES[defend];
        setScene({ weapon: defend, line: lines[Math.floor(Math.random() * lines.length)] ?? "" });
        playScene(defend);
      }
      setMessages((m) => [...m, { id: idRef.current++, from: "nino", text, time: now() }]);
      setTyping(false);
      if (settings.soundVibration && !defend) playPop();
      if (speakRef.current) speak(text);
    };
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (useLocal || offline) {
      const offlineText = image
        ? "Estou sem internet e não consigo ver fotos agora. Tenta de novo quando voltar! 📶"
        : local.text;
      window.setTimeout(() => deliver(offlineText, local.defend), local.defend ? 450 : 700);
      return;
    }
    withTimeout(askNino({ data: { messages: history } }), 25000)
      .then((r) => deliver(r.ok ? r.text : image ? r.error : local.text))
      .catch(() => deliver(image ? "Não consegui ver a foto agora. Tenta de novo! 📷" : local.text));
  };

  // Pergunta feita por voz (o Nino ouviu em segundo plano): responde no chat e lê a resposta.
  useEffect(() => {
    if (!voiceText) {
      voiceRef.current = null;
      return;
    }
    if (typing || voiceRef.current === voiceText) return;
    voiceRef.current = voiceText;
    send(voiceText, null, true);
    onVoiceHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceText, typing]);

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

      <div className="chat-body" ref={bodyRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg-row ${m.from}`}>
            {m.from === "nino" && (
              <div className="msg-avatar">
                <Nino size={28} glow={false} particles={false} />
              </div>
            )}
            <div className={`bubble ${m.from}`}>
              {m.image && <img className="bubble-img" src={m.image} alt="Foto enviada" />}
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
        {pendingImage && (
          <div className="attach-preview">
            <img src={pendingImage} alt="Foto para enviar" />
            <button type="button" className="attach-remove" onClick={() => setPendingImage(null)} aria-label="Remover foto">
              <IconClose size={14} />
            </button>
          </div>
        )}
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(input, pendingImage);
          }}
        >
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              void pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button type="button" className="attach-btn" onClick={() => galleryRef.current?.click()} aria-label="Enviar foto da galeria">
            <IconImage size={20} />
          </button>
          <button type="button" className="attach-btn" onClick={() => cameraRef.current?.click()} aria-label="Tirar foto">
            <IconCamera size={20} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            aria-label="Mensagem"
          />
          <button type="submit" className="send-btn" aria-label="Enviar" disabled={!input.trim() && !pendingImage}>
            <IconSend />
          </button>
        </form>
      </div>

      {scene && <DefendScene weapon={scene.weapon} line={scene.line} onDone={closeScene} />}
    </div>
  );
}
