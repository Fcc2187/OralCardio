/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

interface NotificationPushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

function parsePayload(data: PushMessageData | null): NotificationPushPayload | null {
  if (!data) return null;
  try {
    const value: unknown = data.json();
    if (
      typeof value !== "object" ||
      value === null ||
      !("title" in value) ||
      !("body" in value) ||
      !("url" in value) ||
      !("tag" in value) ||
      typeof value.title !== "string" ||
      typeof value.body !== "string" ||
      typeof value.url !== "string" ||
      typeof value.tag !== "string"
    ) {
      return null;
    }
    const target = new URL(value.url, self.location.origin);
    if (target.origin !== self.location.origin) return null;
    return { title: value.title, body: value.body, url: target.href, tag: value.tag };
  } catch {
    return null;
  }
}

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event: PushEvent) => {
  const payload = parsePayload(event.data);
  if (!payload) return;
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const rawUrl: unknown = event.notification.data?.url;
  if (typeof rawUrl !== "string") return;
  const target = new URL(rawUrl, self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === target.origin);
      if (existing) {
        await existing.navigate(target.href);
        return existing.focus();
      }
      return self.clients.openWindow(target.href);
    }),
  );
});

self.addEventListener("pushsubscriptionchange", (event: Event) => {
  const extendableEvent = event as ExtendableEvent;
  extendableEvent.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) =>
      Promise.all(
        clients.map((client) => client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" })),
      ),
    ),
  );
});
