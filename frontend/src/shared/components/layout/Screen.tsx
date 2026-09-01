import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Rota de retorno. Necessário em telas sem aba própria no menu inferior
   * (ex.: /conquistas, detalhe/edição de consulta, módulo educacional) —
   * sem isso o usuário não tem como voltar além do gesto do navegador. */
  backTo?: string;
  backLabel?: string;
  maxWidth?: "default" | "wide";
  spacing?: "default" | "compact";
  hideHeader?: boolean;
  className?: string;
  children: ReactNode;
}

const MAX_WIDTH_CLASSES: Record<"default" | "wide", string> = {
  default: "max-w-[28rem]",
  wide: "max-w-[28rem] min-[1024px]:max-w-4xl",
};

const SPACING_CLASSES: Record<"default" | "compact", string> = {
  default: "gap-lg px-lg py-xl",
  compact: "gap-2.5 px-4 py-3 min-[640px]:gap-3 min-[640px]:px-6 min-[1024px]:py-4",
};

/** Moldura de página consistente: largura confortável de leitura, título
 * display e espaçamento vertical do sistema de tokens. */
export function Screen({
  title,
  subtitle,
  backTo,
  backLabel = "Voltar",
  maxWidth = "default",
  spacing = "default",
  hideHeader = false,
  className,
  children,
}: ScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!title) return;
    document.title = `${title} — OralCardio`;
    if (!hideHeader) {
      headingRef.current?.focus();
    }
  }, [title, hideHeader]);

  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col",
        MAX_WIDTH_CLASSES[maxWidth],
        SPACING_CLASSES[spacing],
        className,
      )}
    >
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex min-h-tap-target-min w-fit items-center font-body text-body-sm text-primary-action"
        >
          ← {backLabel}
        </Link>
      ) : null}
      {title && !hideHeader ? (
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
