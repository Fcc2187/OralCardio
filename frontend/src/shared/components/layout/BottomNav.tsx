import type { SVGProps } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

interface NavDestination {
  to: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

function ImageIcon({ src, ...props }: SVGProps<SVGSVGElement> & { src: string }) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <image href={src} width="24" height="24" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
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
  { to: "/escovar", label: "Escovar", icon: (props) => <ImageIcon src="/images/escovacao.png" {...props} /> },
  { to: "/educacao", label: "Estudar", icon: (props) => <ImageIcon src="/images/leitura.png" {...props} /> },
  { to: "/agenda", label: "Agenda", icon: (props) => <ImageIcon src="/images/agenda.png" {...props} /> },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 flex h-[calc(var(--spacing-bottom-nav-height)+var(--spacing-safe-area-bottom))] border-t border-hairline bg-canvas pb-safe-area-bottom"
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
