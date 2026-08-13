import { Outlet } from "react-router-dom";

import { BottomNav } from "./BottomNav";

/**
 * Casco visual das rotas autenticadas com perfil completo: conteúdo rolável
 * com espaço reservado para a navegação inferior fixa.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-[calc(var(--spacing-bottom-nav-height)+var(--spacing-lg))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
