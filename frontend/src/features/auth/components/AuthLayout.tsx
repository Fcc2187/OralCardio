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
  "sign-in": "/images/auth/sign-in-illustration.svg",
  "sign-up": "/images/auth/sign-up-illustration.svg",
} as const;

export function AuthLayout({ mode, title, subtitle, children, footer }: AuthLayoutProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} — OralCardio`;
    headingRef.current?.focus();
  }, [title]);

  return (
    <main className="min-h-dvh bg-canvas min-[1024px]:grid min-[1024px]:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-surface-soft px-xxl py-xxl min-[1024px]:flex min-[1024px]:flex-col min-[1024px]:items-center min-[1024px]:justify-center">
        <div className="flex max-w-sm flex-col items-center text-center">
          <img src="/images/auth/oral-cardio-mark.svg" alt="OralCardio" className="h-auto w-52" />
          <p className="mt-lg font-body text-body-md text-muted">{mode === "sign-in" ? "Cuidar do seu sorriso é cuidar do seu coração." : "Comece hoje a cuidar da sua saúde bucal e cardíaca."}</p>
          <span className="my-lg text-primary-action" aria-hidden="true">♥</span>
          <img src={ILLUSTRATIONS[mode]} alt="" className="max-h-80 w-full object-contain" />
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col px-lg py-xl min-[1024px]:items-center min-[1024px]:justify-center min-[1024px]:px-xxl">
        <div className="w-full max-w-[28rem]">
          {mode === "sign-in" ? (
            <header className="mb-xl flex flex-col items-center text-center min-[1024px]:hidden">
              <img src="/images/auth/oral-cardio-mark.svg" alt="OralCardio" className="h-auto w-40" />
              <p className="mt-sm font-body text-body-sm text-muted">Cuidar do seu sorriso é cuidar do seu coração.</p>
              <span className="mt-xs text-primary-action" aria-hidden="true">♥</span>
            </header>
          ) : (
            <Link to="/entrar" className="mb-lg inline-flex min-h-tap-target-min items-center font-body text-body-sm text-primary-action min-[1024px]:hidden">
              ← Voltar
            </Link>
          )}

          <div className="rounded-lg bg-white p-lg shadow-soft min-[1024px]:p-xl">
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
