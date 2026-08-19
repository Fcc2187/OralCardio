import {
  fetchVapidPublicKey,
  registerPushSubscription,
  unregisterPushSubscription,
} from "./api/notificationApi";
import type { PushPermissionState, PushSubscriptionPayload } from "./types";

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function encodeBase64Url(value: ArrayBuffer | null): string {
  if (!value) return "";
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isIosDevice(): boolean {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as NavigatorWithStandalone).standalone)
  );
}

export function getPushPermissionState(): PushPermissionState {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window) ||
    !window.isSecureContext
  ) {
    return "unsupported";
  }
  if (isIosDevice() && !isStandaloneDisplay()) return "install-required";
  return Notification.permission;
}

export function getDeviceLabel(): string {
  if (isIosDevice()) return "iPhone ou iPad";
  if (/Android/.test(navigator.userAgent)) return "Android";
  return "Navegador web";
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function serializePushSubscription(
  subscription: PushSubscription,
): PushSubscriptionPayload {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh ?? encodeBase64Url(subscription.getKey("p256dh"));
  const auth = json.keys?.auth ?? encodeBase64Url(subscription.getKey("auth"));
  if (!p256dh || !auth) throw new Error("O navegador não forneceu as chaves da inscrição.");
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth },
    expiration_time: subscription.expirationTime
      ? new Date(subscription.expirationTime).toISOString()
      : null,
    device_label: getDeviceLabel(),
  };
}

export async function synchronizeExistingSubscription(): Promise<boolean> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return false;
  await registerPushSubscription(serializePushSubscription(subscription));
  return true;
}

export async function enablePushSubscription(): Promise<void> {
  const capability = getPushPermissionState();
  if (capability === "unsupported") throw new Error("Este navegador não oferece Web Push.");
  if (capability === "install-required") {
    throw new Error("Adicione o OralCardio à Tela de Início antes de ativar notificações.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("A permissão de notificações não foi concedida.");

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { public_key: publicKey } = await fetchVapidPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    });
  }
  await registerPushSubscription(serializePushSubscription(subscription));
}

export async function disablePushSubscription(notifyServer = true): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;
  let serverError: unknown;
  if (notifyServer) {
    try {
      await unregisterPushSubscription(subscription.endpoint);
    } catch (error) {
      serverError = error;
    }
  }
  await subscription.unsubscribe();
  if (serverError) throw serverError;
}
