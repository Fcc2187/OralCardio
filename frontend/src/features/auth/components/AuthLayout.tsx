import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

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

function Brand() {
  return (
    <div className="flex flex-col items-center text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-12 fill-none stroke-primary-action stroke-[1.5]">
        <path d="M20.8 4.8a5.2 5.2 0 0 0-7.4 0L12 6.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" />
        <path d="M9.1 9.4c-.8.7-.8 2.2-.4 3.3.4 1.3.7 3.7 1.6 3.7.7 0 .8-1.6 1.7-1.6s1 1.6 1.7 1.6c.9 0 1.2-2.4 1.6-3.7.4-1.1.4-2.6-.4-3.3" />
      </svg>
      <span className="mt-md font-display text-display-md text-ink">OralCardio</span>
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
    <main className="min-h-dvh bg-canvas min-[1024px]:m-xs min-[1024px]:grid min-[1024px]:min-h-[calc(100dvh-0.5rem)] min-[1024px]:grid-cols-[minmax(17rem,0.65fr)_minmax(0,1.35fr)] min-[1024px]:overflow-hidden min-[1024px]:rounded-lg min-[1024px]:border min-[1024px]:border-hairline-soft">
      <aside className="relative hidden overflow-hidden bg-surface-soft px-xxl py-[6rem] min-[1024px]:flex min-[1024px]:items-center">
        <div className="flex h-full w-full max-w-[24rem] flex-col items-center justify-between text-center">
          <div>
            <Brand />
            <p className="mt-xl font-body text-body-md text-muted">{mode === "sign-in" ? "Cuidar do seu sorriso é cuidar do seu coração." : "Comece hoje a cuidar da sua saúde bucal e cardíaca."}</p>
            <div className="mt-xl flex w-24 items-center gap-xs text-primary-action" aria-hidden="true">
              <span className="h-px flex-1 bg-primary-action/40" />
              <span>♥</span>
              <span className="h-px flex-1 bg-primary-action/40" />
            </div>
          </div>
          <img src={ILLUSTRATIONS[mode]} alt="" className="w-72 object-contain" />
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col px-lg py-xl min-[1024px]:min-h-0 min-[1024px]:items-center min-[1024px]:justify-center min-[1024px]:px-xxl">
        <div className={`w-full ${isSignUp ? "max-w-[52rem]" : "max-w-[28rem]"}`}>
          {mode === "sign-in" ? (
            <header className="mb-xl flex flex-col items-center text-center min-[1024px]:hidden">
              <Brand />
              <p className="mt-sm font-body text-body-sm text-muted">Cuidar do seu sorriso é cuidar do seu coração.</p>
              <span className="mt-xs text-primary-action" aria-hidden="true">♥</span>
            </header>
          ) : (
            <Link to="/entrar" className="mb-lg inline-flex min-h-tap-target-min items-center font-body text-body-sm text-primary-action min-[1024px]:hidden">
              ← Voltar
            </Link>
          )}

          <div className={`rounded-lg bg-white shadow-soft ${isSignUp ? "p-lg min-[1024px]:p-lg" : "p-lg min-[1024px]:p-xl"}`}>
            <header className="mb-lg flex flex-col gap-xs">
              <h1 ref={headingRef} tabIndex={-1} className="text-display-sm outline-none">{title}</h1>
              <p className="font-body text-body-md text-muted">{subtitle}</p>
            </header>
            {children}
            <div className="mt-lg text-center">{footer}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
