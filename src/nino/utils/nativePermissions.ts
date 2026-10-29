import { Capacitor, registerPlugin } from "@capacitor/core";

export type PermKey =
  | "internet"
  | "overlay"
  | "notifications"
  | "microphone"
  | "camera"
  | "vibration"
  | "background";

/** true = permitida, false = não permitida, null = não se aplica fora do app Android. */
export type PermStatus = Record<PermKey, boolean | null>;

interface NinoPermissionsPlugin {
  status(): Promise<Record<PermKey, boolean>>;
  request(options: { name: PermKey }): Promise<Record<PermKey, boolean>>;
}

const Native = registerPlugin<NinoPermissionsPlugin>("NinoPermissions");

const isNative = () => Capacitor.getPlatform() === "android";

async function webState(name: "microphone" | "camera"): Promise<boolean | null> {
  try {
    if (!navigator.permissions) return null;
    const r = await navigator.permissions.query({ name: name as PermissionName });
    return r.state === "granted";
  } catch {
    return null;
  }
}

/** Estado atual de cada permissão (no app Android vem do sistema; no navegador, do que ele oferece). */
export async function getPermissionStatus(): Promise<PermStatus> {
  if (isNative()) {
    try {
      return await Native.status();
    } catch {
      /* cai para o estado do navegador */
    }
  }
  return {
    internet: typeof navigator !== "undefined" ? navigator.onLine : true,
    overlay: null,
    notifications: typeof Notification !== "undefined" ? Notification.permission === "granted" : null,
    microphone: await webState("microphone"),
    camera: await webState("camera"),
    vibration: typeof navigator !== "undefined" && "vibrate" in navigator ? true : null,
    background: null,
  };
}

/** Pede a permissão. No Android abre o aviso do sistema (ou as configurações, se ela já foi negada de vez). */
export async function requestPermission(key: PermKey): Promise<void> {
  if (isNative()) {
    try {
      await Native.request({ name: key });
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    if (key === "notifications" && typeof Notification !== "undefined") {
      await Notification.requestPermission();
    } else if ((key === "microphone" || key === "camera") && navigator.mediaDevices) {
      const stream = await navigator.mediaDevices.getUserMedia(key === "microphone" ? { audio: true } : { video: true });
      stream.getTracks().forEach((t) => t.stop());
    }
  } catch {
    /* a pessoa negou */
  }
}
