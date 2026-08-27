import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { OralCardioLogo } from "./AuthIcons";

interface AuthLayoutProps {
  mode: "sign-in" | "sign-up";
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const ILLUSTRATIONS = {
  "sign-in": "/images/auth/sign-in-illustration-v2.png",
  "sign-up": "/images/auth/sign-up-illustration-v2.png",
} as const;

function Brand({ mode }: { mode: "sign-in" | "sign-up" }) {
  const subtitle =
    mode === "sign-in"
      ? "Cuidar do seu sorriso é cuidar do seu coração."
      : "Comece hoje a cuidar da sua saúde bucal e cardíaca.";

  return (
    <div className="flex flex-col items-center text-center">
      <OralCardioLogo className="size-14 text-primary-action min-[1024px]:size-20" />
      <span className="mt-1.5 font-display text-[1.65rem] font-normal tracking-tight text-ink min-[1024px]:mt-3 min-[1024px]:text-[2rem]">
        OralCardio
      </span>
      <p className="mt-1 max-w-[15rem] font-body text-body-sm text-muted leading-relaxed min-[1024px]:mt-2 min-[1024px]:max-w-[17rem]">
        {subtitle}
      </p>
      <div className="mt-2.5 flex w-20 items-center justify-center gap-1.5 text-primary-action min-[1024px]:mt-3.5 min-[1024px]:w-24" aria-hidden="true">
        <span className="h-px flex-1 bg-primary-action/40" />
        <svg className="size-2.5 fill-primary-action" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="h-px flex-1 bg-primary-action/40" />
      </div>
    </div>
  );
}

export function AuthLayout({ mode, title, subtitle, children, footer }: AuthLayoutProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isSignUp = mode === "sign-up";

  useEffect(() => {
    document.title = `${title} — OralCardio`;
    headingRef.current?.focus();
  }, [title]);

  return (
    <main className="min-h-dvh w-full bg-canvas min-[1024px]:grid min-[1024px]:grid-cols-[minmax(340px,0.38fr)_minmax(0,0.62fr)]">
      <aside className="relative hidden bg-[#F7EFE8] px-10 pt-16 pb-6 min-[1024px]:flex min-[1024px]:flex-col min-[1024px]:items-center min-[1024px]:justify-between overflow-hidden select-none min-h-dvh">
        <Brand mode={mode} />
        <div className={`mt-auto flex w-full justify-center ${isSignUp ? "pb-4" : "pb-12 min-[1024px]:pb-16"}`}>
          <img
            src={ILLUSTRATIONS[mode]}
            alt=""
            className={`${
              isSignUp
                ? "max-h-[340px] w-full max-w-[300px]"
                : "max-h-[320px] w-full max-w-[360px]"
            } object-contain object-bottom`}
          />
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col justify-center px-4 py-8 min-[640px]:px-8 min-[1024px]:items-center min-[1024px]:p-12 bg-canvas">
        <div className={`mx-auto w-full ${isSignUp ? "max-w-[580px]" : "max-w-[420px]"}`}>
          {/* Mobile Brand Header for Login */}
          {mode === "sign-in" ? (
            <header className="mb-6 flex flex-col items-center text-center min-[1024px]:hidden">
              <Brand mode={mode} />
            </header>
          ) : null}

          {/* White Form Card */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-hairline-soft/80 min-[1024px]:p-10">
            <header className="mb-6 flex items-start gap-3.5">
              {isSignUp ? (
                <Link
                  to="/entrar"
                  aria-label="Voltar"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas shadow-xs border border-hairline-soft text-primary-action transition-colors hover:bg-surface-soft min-[1024px]:hidden"
                >
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 19-7-7 7-7" />
                  </svg>
                </Link>
              ) : null}
              <div className="flex flex-col">
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-[1.65rem] font-normal leading-tight text-ink outline-none min-[1024px]:text-[1.85rem]"
                >
                  {title}
                </h1>
                <p className="mt-0.5 font-body text-body-sm text-muted leading-tight min-[1024px]:mt-1">
                  {subtitle}
                </p>
              </div>
            </header>

            {children}
            {footer ? <div className="mt-5 text-center">{footer}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
