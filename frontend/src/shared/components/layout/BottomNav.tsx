import type { SVGProps } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

interface NavDestination {
  to: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M14 3 5 12a4 4 0 0 0 5.66 5.66L19.32 8.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 14.5 15 20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// "Estudar" (não "Educação") por espaço: em 320px, 5 abas ficam com ~64px
// cada, e "Educação" em Inter 14px praticamente não deixa folga — quebra
// fácil em duas linhas e estoura a altura fixa do nav. "Estudar" também
// mantém o mesmo ritmo verbal de "Escovar". Conquistas saiu do menu — segue
// acessível pelo botão "Ver conquistas" do dashboard (Screen com backTo).
const DESTINATIONS: NavDestination[] = [
  { to: "/", label: "Início", icon: HomeIcon },
  { to: "/escovar", label: "Escovar", icon: BrushIcon },
  { to: "/educacao", label: "Estudar", icon: BookIcon },
  { to: "/agenda", label: "Agenda", icon: CalendarIcon },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 flex h-bottom-nav-height border-t border-hairline bg-canvas pb-safe-area-bottom"
    >
      {DESTINATIONS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-xxs font-body text-caption leading-tight",
              // Cor sozinha não basta como indicador de estado (WCAG 1.4.1)
              // — o peso da fonte muda junto no item ativo.
              isActive ? "font-medium text-primary-action" : "text-muted",
            )
          }
        >
          <Icon aria-hidden="true" className="size-6" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
