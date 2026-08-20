import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Rota de retorno. Necessário em telas sem aba própria no menu inferior
   * (ex.: /conquistas, detalhe/edição de consulta, módulo educacional) —
   * sem isso o usuário não tem como voltar além do gesto do navegador. */
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}

/** Moldura de página consistente: largura confortável de leitura, título
 * display e espaçamento vertical do sistema de tokens. */
export function Screen({ title, subtitle, backTo, backLabel = "Voltar", children }: ScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!title) return;
    document.title = `${title} — OralCardio`;
    headingRef.current?.focus();
  }, [title]);

  return (
    <main className="mx-auto flex w-full max-w-[28rem] flex-col gap-lg px-lg py-xl">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex min-h-tap-target-min w-fit items-center font-body text-body-sm text-primary-action"
        >
          ← {backLabel}
        </Link>
      ) : null}
      {title ? (
        <header className="flex flex-col gap-xs">
          <h1 ref={headingRef} tabIndex={-1} className="text-display-sm outline-none">
            {title}
          </h1>
          {subtitle ? <p className="font-body text-body-md text-muted">{subtitle}</p> : null}
        </header>
      ) : null}
      {children}
    </main>
  );
}
