import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useAuth } from "@/shared/auth/authContext";
import { registerBeforeSignOut } from "@/shared/auth/sessionLifecycle";

import { NotificationContext } from "./notificationContext";
import {
  disablePushSubscription,
  enablePushSubscription,
  flushPendingPushRevocations,
  getCurrentPushSubscription,
  getPushPermissionState,
  synchronizeExistingSubscription,
} from "./pushSubscriptionManager";
import type { PushPermissionState } from "./types";

function errorMessage(error: unknown): string {
  if (
    error instanceof TypeError &&
    /load failed|failed to fetch|networkerror/i.test(error.message)
  ) {
    return "Não foi possível sincronizar este dispositivo. Verifique a conexão e tente novamente.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível atualizar as notificações.";
}

export function NotificationSubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const previousUserId = useRef<string | null>(null);
  const [permission, setPermission] = useState<PushPermissionState>(getPushPermissionState);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void flushPendingPushRevocations();
  }, []);

  const refresh = useCallback(async () => {
    const currentPermission = getPushPermissionState();
    setPermission(currentPermission);
    if (currentPermission === "unsupported" || currentPermission === "install-required") {
      setHasSubscription(false);
      return;
    }
    try {
      setHasSubscription(Boolean(await getCurrentPushSubscription()));
    } catch (nextError) {
      setHasSubscription(false);
      setError(errorMessage(nextError));
    }
  }, []);

  const enable = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      await enablePushSubscription();
      await refresh();
    } catch (nextError) {
      setError(errorMessage(nextError));
      await refresh();
      throw nextError;
    } finally {
      setIsBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(
    async (notifyServer = true) => {
      setIsBusy(true);
      setError(null);
      try {
        await disablePushSubscription(notifyServer);
      } catch (nextError) {
        setError(errorMessage(nextError));
        throw nextError;
      } finally {
        await refresh();
        setIsBusy(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    const previous = previousUserId.current;
    const current = user?.id ?? null;
    previousUserId.current = current;

    if (previous && !current) {
      // O tombstone persistido por disablePushSubscription será retomado pelo
      // efeito acima mesmo após a sessão anterior desaparecer.
      void disablePushSubscription(false).finally(refresh);
      return;
    }
    if (!current) {
      void refresh();
      return;
    }

    async function reconcile() {
      try {
        const state = getPushPermissionState();
        if (state === "granted") {
          // Permissão concedida não é consentimento para uma nova inscrição.
          // Só sincronizamos uma assinatura previamente criada pelo usuário.
          await synchronizeExistingSubscription();
        }
        setError(null);
      } catch (nextError) {
        setError(errorMessage(nextError));
      } finally {
        await refresh();
      }
    }

    void reconcile();
  }, [refresh, user?.id]);

  useEffect(() => {
    if (!user) return undefined;
    return registerBeforeSignOut(async () => {
      try {
        await disablePushSubscription(true);
      } catch {
        // `disablePushSubscription` sempre tenta cancelar localmente, mesmo se
        // a revogação remota falhar. O logout não pode manter o paciente preso.
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const reconcile = () => {
      if (document.visibilityState === "visible" && getPushPermissionState() === "granted") {
        void synchronizeExistingSubscription()
          .then(() => setError(null))
          .catch((nextError: unknown) => setError(errorMessage(nextError)))
          .finally(refresh);
      }
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") reconcile();
    };
    window.addEventListener("online", reconcile);
    window.addEventListener("focus", reconcile);
    document.addEventListener("visibilitychange", reconcile);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("online", reconcile);
      window.removeEventListener("focus", reconcile);
      document.removeEventListener("visibilitychange", reconcile);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [refresh, user]);

  return (
    <NotificationContext.Provider
      value={{ permission, hasSubscription, isBusy, error, refresh, enable, disable }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
