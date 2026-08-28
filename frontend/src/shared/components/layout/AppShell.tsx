import { Outlet } from "react-router-dom";

import { BottomNav } from "./BottomNav";
import { SidebarNav } from "./SidebarNav";

/**
 * Casco visual das rotas autenticadas:
 * - Desktop: SidebarNav sticky à esquerda + conteúdo fluido
 * - Mobile: Conteúdo com padding inferior + BottomNav flutuante
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas min-[1024px]:flex-row">
      <SidebarNav />
      <div className="flex-1 pb-[calc(5.5rem+var(--spacing-safe-area-bottom,0px))] min-[1024px]:pb-8">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
