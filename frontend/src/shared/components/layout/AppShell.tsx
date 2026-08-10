import type { PropsWithChildren } from "react";

/**
 * Casco visual mobile-first da aplicação. As telas futuras (dashboard, timer,
 * módulos, agenda, cuidador) serão renderizadas dentro deste shell.
 */
export function AppShell({ children }: PropsWithChildren) {
  return <div className="app-shell">{children}</div>;
}
