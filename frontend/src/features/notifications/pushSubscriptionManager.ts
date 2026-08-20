import {
  fetchVapidPublicKey,
  registerPushSubscription,
  revokePushSubscriptionWithDeviceToken,
} from "./api/notificationApi";
import type { PushPermissionState, PushSubscriptionPayload } from "./types";

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface PendingPushRevocation {
  endpoint: string;
  revocationToken: string;
  pending: boolean;
}

const PUSH_REVOCATIONS_STORAGE_KEY = "oralcardio.push-revocations.v1";
const MAX_PENDING_PUSH_REVOCATIONS = 10;

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

function readPendingPushRevocations(): PendingPushRevocation[] {
  try {
    const rawValue = window.localStorage.getItem(PUSH_REVOCATIONS_STORAGE_KEY);
    if (!rawValue) return [];
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PendingPushRevocation =>
        typeof item === "object" &&
        item !== null &&
        "endpoint" in item &&
        "revocationToken" in item &&
        "pending" in item &&
        typeof item.endpoint === "string" &&
        typeof item.revocationToken === "string" &&
        typeof item.pending === "boolean",
    );
  } catch {
    return [];
  }
}

function writePendingPushRevocations(records: PendingPushRevocation[]): void {
  try {
    window.localStorage.setItem(
      PUSH_REVOCATIONS_STORAGE_KEY,
      JSON.stringify(records.slice(-MAX_PENDING_PUSH_REVOCATIONS)),
    );
  } catch {
    // Sem storage persistente, a revogação ainda é tentada durante esta sessão.
  }
}

function createRevocationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes.buffer);
}

function getOrCreateRevocationToken(endpoint: string): string {
  const records = readPendingPushRevocations();
  const existing = records.find((item) => item.endpoint === endpoint);
  if (existing) return existing.revocationToken;
  const revocationToken = createRevocationToken();
  writePendingPushRevocations([...records, { endpoint, revocationToken, pending: false }]);
  return revocationToken;
}

function sameBytes(first: Uint8Array, second: Uint8Array): boolean {
  if (first.length !== second.length) return false;
  return first.every((value, index) => value === second[index]);
}

function usesVapidPublicKey(subscription: PushSubscription, publicKey: string): boolean {
  const applicationServerKey = subscription.options.applicationServerKey;
  if (applicationServerKey instanceof ArrayBuffer) {
    return sameBytes(new Uint8Array(applicationServerKey), decodeBase64Url(publicKey));
  }
  if (!applicationServerKey) {
    // Browsers antigos podem não expor a opção. Neles a sincronização normal
    // continua sendo o fallback seguro no próximo acesso ao app.
    return true;
  }
  return false;
}

function forgetPendingPushRevocation(endpoint: string): void {
  writePendingPushRevocations(
    readPendingPushRevocations().filter((item) => item.endpoint !== endpoint),
  );
}

function markPushRevocationPending(endpoint: string): void {
  const records = readPendingPushRevocations();
  const record = records.find((item) => item.endpoint === endpoint);
  if (record) {
    writePendingPushRevocations(
      records.map((item) => (item.endpoint === endpoint ? { ...item, pending: true } : item)),
    );
    return;
  }
  writePendingPushRevocations([
    ...records,
    { endpoint, revocationToken: createRevocationToken(), pending: true },
  ]);
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
  revocationToken: string,
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
    revocation_token: revocationToken,
  };
}

export async function synchronizeExistingSubscription(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;

  const { public_key: publicKey } = await fetchVapidPublicKey();
  if (subscription && !usesVapidPublicKey(subscription, publicKey)) {
    try {
      await revokePushSubscriptionWithDeviceToken(
        subscription.endpoint,
        getOrCreateRevocationToken(subscription.endpoint),
      );
      forgetPendingPushRevocation(subscription.endpoint);
    } catch {
      markPushRevocationPending(subscription.endpoint);
    }
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    // Já havia uma inscrição explícita antes da rotação VAPID; recriá-la não
    // transforma uma simples permissão concedida em novo consentimento.
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    });
  }
  await registerPushSubscription(
    serializePushSubscription(subscription, getOrCreateRevocationToken(subscription.endpoint)),
  );
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

  if (await synchronizeExistingSubscription()) return;

  const registration = await navigator.serviceWorker.ready;
  const { public_key: publicKey } = await fetchVapidPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeBase64Url(publicKey),
  });
  await registerPushSubscription(
    serializePushSubscription(subscription, getOrCreateRevocationToken(subscription.endpoint)),
  );
}

export async function disablePushSubscription(notifyServer = true): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;
  let serverError: unknown;
  if (notifyServer) {
    try {
      const revocationToken = getOrCreateRevocationToken(subscription.endpoint);
      await revokePushSubscriptionWithDeviceToken(subscription.endpoint, revocationToken);
      forgetPendingPushRevocation(subscription.endpoint);
    } catch (error) {
      serverError = error;
      markPushRevocationPending(subscription.endpoint);
    }
  } else {
    markPushRevocationPending(subscription.endpoint);
  }
  await subscription.unsubscribe();
  if (serverError) throw serverError;
}

/**
 * Repete revogações que sobreviveram a logout offline. A capability não lê
 * dados nem cria subscriptions; ela só pode tornar inativo o endpoint salvo.
 */
export async function flushPendingPushRevocations(): Promise<void> {
  const records = readPendingPushRevocations().filter((record) => record.pending);
  await Promise.all(
    records.map(async (record) => {
      try {
        await revokePushSubscriptionWithDeviceToken(record.endpoint, record.revocationToken);
        forgetPendingPushRevocation(record.endpoint);
      } catch {
        // Mantém o tombstone para a próxima abertura ou reconexão.
      }
    }),
  );
}
