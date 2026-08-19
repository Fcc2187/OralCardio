import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/shared/components/ui/Button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/** Última barreira para que uma falha de renderização não vire tela branca. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Não registramos conteúdo clínico no console. Uma integração de
    // observabilidade pode ser conectada aqui com sanitização de PII.
    if (import.meta.env.DEV) console.error("Falha inesperada na interface", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col items-center justify-center gap-lg px-lg text-center">
          <div>
            <h1 className="text-display-sm">Não foi possível abrir esta tela</h1>
            <p className="mt-sm font-body text-body-md text-muted">
              Seus dados não foram alterados. Atualize para tentar novamente.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Atualizar aplicativo</Button>
        </main>
      );
    }
    return this.props.children;
  }
}
