import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconBell, IconBolt, IconCamera, IconGlobe, IconMic, IconMove, IconShield } from "./Icons";
import { getPermissionStatus, requestPermission, type PermKey, type PermStatus } from "../utils/nativePermissions";

interface Item {
  key: PermKey;
  title: string;
  desc: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
}

const ITEMS: Item[] = [
  { key: "internet", title: "Internet", desc: "Conversar com o Nino e carregar o app", Icon: IconGlobe },
  { key: "overlay", title: "Sobrepor a outros apps", desc: "O Nino anda por cima de outros aplicativos", Icon: IconMove },
  { key: "notifications", title: "Notificações", desc: "Avisos do Nino e do serviço em segundo plano", Icon: IconBell },
  { key: "microphone", title: "Microfone", desc: "Ouvir “Nino” e as suas ordens por voz", Icon: IconMic },
  { key: "camera", title: "Câmera", desc: "Tirar fotos para mostrar ao Nino", Icon: IconCamera },
  { key: "vibration", title: "Vibração", desc: "Reações e toques do Nino", Icon: IconBolt },
  { key: "background", title: "Segundo plano", desc: "Manter o Nino ligado com a tela apagada", Icon: IconShield },
];

/** Lista de permissões do app: estado de cada uma e botão para permitir. */
export default function PermissionsList() {
  const [status, setStatus] = useState<PermStatus | null>(null);
  const [busy, setBusy] = useState<PermKey | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const s = await getPermissionStatus();
    if (alive.current) setStatus(s);
  }, []);

  useEffect(() => {
    alive.current = true;
    void refresh();
    // Depois de liberar nas configurações do Android, o estado se atualiza sozinho ao voltar para o app.
    const onBack = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("focus", onBack);
    const timer = window.setInterval(onBack, 2500);
    return () => {
      alive.current = false;
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("focus", onBack);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const ask = async (key: PermKey) => {
    setBusy(key);
    try {
      await requestPermission(key);
    } finally {
      setBusy(null);
      void refresh();
    }
  };

  const applicable = status ? ITEMS.filter((i) => status[i.key] !== null) : [];
  const allowed = status ? applicable.filter((i) => status[i.key] === true).length : 0;

  return (
    <>
      <div className="perm-head">
        <h3 className="section-title">Permissões</h3>
        {status && (
          <span className="perm-count">
            {allowed} de {applicable.length} permitidas
          </span>
        )}
      </div>
      <div className="list-card perm-list">
        {ITEMS.map(({ key, title, desc, Icon }) => {
          const st = status ? status[key] : undefined;
          return (
            <div className="list-row perm-row" key={key}>
              <span className="row-ic">
                <Icon size={20} />
              </span>
              <span className="row-text">
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <span className="perm-act">
                {st === undefined && <span className="perm-badge na">…</span>}
                {st === true && <span className="perm-badge ok">Permitida</span>}
                {st === null && <span className="perm-badge na">Só no app</span>}
                {st === false && (
                  <>
                    <span className="perm-badge off">{key === "internet" ? "Sem conexão" : "Não permitida"}</span>
                    {key !== "internet" && (
                      <button className="perm-btn" disabled={busy === key} onClick={() => void ask(key)}>
                        {busy === key ? "Abrindo…" : "Permitir"}
                      </button>
                    )}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="perm-note">
        Se o Android não mostrar o pedido, ele abre as configurações do app para você liberar ali. Ao voltar, o estado
        se atualiza sozinho.
      </p>
    </>
  );
}
