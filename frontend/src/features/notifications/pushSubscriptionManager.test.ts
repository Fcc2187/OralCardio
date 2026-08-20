import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPushPermissionState,
  isIosDevice,
  serializePushSubscription,
} from "./pushSubscriptionManager";

vi.mock("./api/notificationApi", () => ({
  fetchVapidPublicKey: vi.fn(),
  registerPushSubscription: vi.fn(),
  unregisterPushSubscription: vi.fn(),
}));

function configureBrowser({ ios = false, standalone = true } = {}) {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(window, "PushManager", { configurable: true, value: class {} });
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: { permission: "default", requestPermission: vi.fn() },
  });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {} });
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: ios ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)" : "Mozilla/5.0 Android",
  });
  Object.defineProperty(navigator, "platform", {
    configurable: true,
    value: ios ? "iPhone" : "Linux armv8l",
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: standalone }),
  });
}

describe("pushSubscriptionManager", () => {
  beforeEach(() => configureBrowser());

  it("detecta iPhone sem depender do suporte a Push", () => {
    configureBrowser({ ios: true });
    expect(isIosDevice()).toBe(true);
  });

  it("exige instalação na tela inicial no iPhone", () => {
    configureBrowser({ ios: true, standalone: false });
    expect(getPushPermissionState()).toBe("install-required");
  });

  it("aceita Web Push no navegador Android sem exigir instalação", () => {
    configureBrowser({ ios: false, standalone: false });
    expect(getPushPermissionState()).toBe("default");
  });

  it("serializa endpoint, chaves e expiração sem expor outros dados", () => {
    const subscription = {
      endpoint: "https://push.example/subscription",
      expirationTime: Date.UTC(2026, 7, 20),
      toJSON: () => ({ keys: { p256dh: "public-key", auth: "auth-secret" } }),
      getKey: vi.fn(),
    } as unknown as PushSubscription;

    expect(serializePushSubscription(subscription, "a".repeat(43))).toEqual({
      endpoint: "https://push.example/subscription",
      keys: { p256dh: "public-key", auth: "auth-secret" },
      expiration_time: "2026-08-20T00:00:00.000Z",
      device_label: "Android",
      revocation_token: "a".repeat(43),
    });
  });
});
