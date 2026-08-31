import type { ComponentType, SVGProps } from "react";
import { BookOpen, Calendar, Home, User } from "lucide-react";

import { ToothbrushIcon } from "../icons/ToothbrushIcon";

export interface NavDestination {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAVIGATION_DESTINATIONS: NavDestination[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/escovar", label: "Escovar", icon: ToothbrushIcon },
  { to: "/educacao", label: "Estudar", icon: BookOpen },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/perfil", label: "Perfil", icon: User },
];

