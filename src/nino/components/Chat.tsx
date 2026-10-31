import React, { useCallback, useEffect, useRef, useState } from "react";
import Nino from "./Nino";
import DefendScene from "./DefendScene";
import { IconBack, IconCamera, IconClose, IconFile, IconImage, IconMic, IconSend } from "./Icons";
import { SCENE_LINES, respond, Weapon } from "../utils/replies";
import { playBang, playHit, playPop, playSend, playThud, vibrate } from "../utils/sound";
import { useSettings } from "../utils/SettingsContext";
import { askNino } from "@/lib/ai/nino.functions";
import { withTimeout } from "../utils/withTimeout";
import { fileToDataUrl } from "../utils/image";
import { speak } from "../utils/speak";
import { dictate } from "../utils/nativeListen";
import { extractDocument, type ExtractedDoc } from "../utils/pdf";

interface Msg {
  id: number;
  from: "nino" | "user";
  text: string;
  time: string;
  image?: string | undefined;
  docName?: string | undefined;
}

const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const SUGGESTIONS = ["Qual seu propósito?", "Me conta uma piada", "Que horas são?"];
const DOC_SUGGESTIONS = ["Corrigir o texto", "Resumir", "Explicar em palavras simples"];

const copyText = async (t: string) => {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    return false;
  }
};

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
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pendingDoc, setPendingDoc] = useState<ExtractedDoc | null>(null);
  const [readingDoc, setReadingDoc] = useState(false);
  const [listening, setListening] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const say = (text: string) =>
    setMessages((m) => [...m, { id: idRef.current++, from: "nino", text, time: now() }]);

  const pickDoc = async (file?: File | null) => {
    if (!file) return;
    setReadingDoc(true);
    try {
      const doc = await extractDocument(file);
      if (doc.text.trim().length < 5) {
        say("Não achei texto nesse arquivo. Se for um PDF escaneado (foto de página), tira uma foto da página e me manda como imagem. 📷");
      } else {
        setPendingDoc(doc);
      }
    } catch {
      say("Não consegui abrir esse PDF. Ele pode estar protegido ou corrompido. Tenta outro? 📄");
    } finally {
      setReadingDoc(false);
    }
  };

  const startDictation = async () => {
    if (listening || typing) return;
    setListening(true);
    try {
      const text = await dictate();
      if (text) send(text, null, true);
    } catch (e) {
      say(e instanceof Error && e.message ? e.message + " 🎤" : "Não consegui ouvir agora. Tenta de novo! 🎤");
    } finally {
      setListening(false);
    }
  };

  const copyMsg = async (m: Msg) => {
    if (await copyText(m.text)) {
      setCopiedId(m.id);
      window.setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500);
    }
  };

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

  const send = (text: string, image: string | null = null, fromVoice = false, doc: ExtractedDoc | null = null) => {
    const clean = text.trim() || (image ? "O que você vê nessa foto?" : doc ? "Corrija este texto." : "");
    if (!clean || typing) return;
    speakRef.current = fromVoice;
    if (settings.soundVibration) {
      playSend();
      vibrate(15);
    }
    const local = respond(clean);
    const useLocal = !image && !doc && (!!local.defend || local.text.includes("Rayllan"));
    const history = [...messages.slice(1), { from: "user" as const, text: clean, image: image ?? undefined, docName: undefined as string | undefined }]
      .slice(-20)
      .map((m, i, arr) => ({
        role: m.from === "user" ? ("user" as const) : ("assistant" as const),
        content: m.image && i < arr.length - 1 ? `${m.text} [foto enviada]` : m.text,
        ...(m.image && i === arr.length - 1 ? { image: m.image } : {}),
        ...(doc && i === arr.length - 1 ? { document: doc.text } : {}),
      }));
    setMessages((m) => [
      ...m,
      { id: idRef.current++, from: "user", text: clean, time: now(), image: image ?? undefined, docName: doc?.name },
    ]);
    setInput("");
    setPendingImage(null);
    setPendingDoc(null);
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
      if (speakRef.current && !doc) speak(text);
    };
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (useLocal || offline) {
      const offlineText = doc
        ? "Estou sem internet e não consigo corrigir documentos agora. Tenta de novo quando voltar! 📶"
        : image
        ? "Estou sem internet e não consigo ver fotos agora. Tenta de novo quando voltar! 📶"
        : local.text;
      window.setTimeout(() => deliver(offlineText, local.defend), local.defend ? 450 : 700);
      return;
    }
    withTimeout(askNino({ data: { messages: history } }), doc ? 70000 : 25000)
      .then((r) => deliver(r.ok ? r.text : image || doc ? r.error : local.text))
      .catch(() =>
        deliver(
          doc
            ? "Demorei demais para ler o documento. Tenta de novo ou manda um trecho menor! 📄"
            : image
            ? "Não consegui ver a foto agora. Tenta de novo! 📷"
            : local.text,
        ),
      );
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
              {m.docName && (
                <div className="doc-chip in-bubble">
                  <IconFile size={16} />
                  <span>{m.docName}</span>
                </div>
              )}
              <p className="bubble-text">{m.text}</p>
              <time>{m.time}</time>
              {m.from === "nino" && m.id !== 1 && m.text.length > 40 && (
                <button type="button" className="copy-btn" onClick={() => void copyMsg(m)}>
                  {copiedId === m.id ? "Copiado ✓" : "Copiar"}
                </button>
              )}
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
          {(pendingDoc ? DOC_SUGGESTIONS : SUGGESTIONS).map((s) => (
            <button key={s} className="chip" onClick={() => send(s, null, false, pendingDoc)}>
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
        {(pendingDoc || readingDoc) && (
          <div className="doc-chip">
            <IconFile size={16} />
            {pendingDoc ? (
              <span>
                {pendingDoc.name} · {pendingDoc.pages} pág.{pendingDoc.truncated ? " (só o começo)" : ""}
              </span>
            ) : (
              <span>Lendo o PDF…</span>
            )}
            {pendingDoc && (
              <button type="button" className="attach-remove" onClick={() => setPendingDoc(null)} aria-label="Remover documento">
                <IconClose size={14} />
              </button>
            )}
          </div>
        )}
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(input, pendingImage, false, pendingDoc);
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
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf,text/plain,.txt"
            hidden
            onChange={(e) => {
              void pickDoc(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button type="button" className="attach-btn" onClick={() => pdfRef.current?.click()} aria-label="Enviar PDF para corrigir" disabled={readingDoc}>
            <IconFile size={20} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Ouvindo…" : pendingDoc ? "O que fazer com o PDF?" : "Digite sua mensagem..."}
            aria-label="Mensagem"
          />
          {input.trim() || pendingImage || pendingDoc ? (
            <button type="submit" className="send-btn" aria-label="Enviar">
              <IconSend />
            </button>
          ) : (
            <button
              type="button"
              className={`send-btn mic-btn ${listening ? "on" : ""}`}
              aria-label="Falar"
              onClick={() => void startDictation()}
              disabled={listening}
            >
              <IconMic />
            </button>
          )}
        </form>
      </div>

      {scene && <DefendScene weapon={scene.weapon} line={scene.line} onDone={closeScene} />}
    </div>
  );
}
