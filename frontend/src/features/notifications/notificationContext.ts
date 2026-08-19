import { createContext, useContext } from "react";

import type { PushPermissionState } from "./types";

export interface NotificationContextValue {
  permission: PushPermissionState;
  hasSubscription: boolean;
  isBusy: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  enable: () => Promise<void>;
  disable: (notifyServer?: boolean) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications precisa estar dentro do provider");
  return context;
}

