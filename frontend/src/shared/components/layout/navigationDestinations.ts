import type { ComponentType, SVGProps } from "react";
import { BookOpen, BrushCleaning, Calendar, Home, User } from "lucide-react";

export interface NavDestination {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAVIGATION_DESTINATIONS: NavDestination[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/escovar", label: "Escovar", icon: BrushCleaning },
  { to: "/educacao", label: "Estudar", icon: BookOpen },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/perfil", label: "Perfil", icon: User },
];

