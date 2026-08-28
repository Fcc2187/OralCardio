import { ArrowRight, BookOpen, Calendar, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardQuickLinksProps {
  completedEducationModules: number;
  totalEducationModules: number;
  nextAppointmentAt: string | null;
}

function formatNextAppointment(dateString: string | null): string {
  if (!dateString) return "Nenhuma consulta";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Nenhuma consulta";
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);
    return `Consulta: ${formatted}`;
  } catch {
    return "Nenhuma consulta";
  }
}

export function DashboardQuickLinks({
  completedEducationModules,
  totalEducationModules,
  nextAppointmentAt,
}: DashboardQuickLinksProps) {
  const links = [
    {
      to: "/educacao",
      title: "Educação",
      subtitle: `${completedEducationModules} de ${totalEducationModules} concluídos`,
      icon: BookOpen,
      ariaLabel: `Ir para Educação: ${completedEducationModules} de ${totalEducationModules} concluídos`,
    },
    {
      to: "/agenda",
      title: "Agenda",
      subtitle: formatNextAppointment(nextAppointmentAt),
      icon: Calendar,
      ariaLabel: `Ir para Agenda: ${formatNextAppointment(nextAppointmentAt)}`,
    },
    {
      to: "/conquistas",
      title: "Conquistas",
      subtitle: "Veja suas conquistas",
      icon: Trophy,
      ariaLabel: "Ir para Conquistas: Veja suas conquistas",
    },
  ];

  return (
    <section aria-label="Atalhos rápidos" className="grid grid-cols-3 gap-3 min-[640px]:gap-4">
      {links.map(({ to, title, subtitle, icon: Icon, ariaLabel }) => (
        <Link
          key={to}
          to={to}
          aria-label={ariaLabel}
          className="flex min-h-tap-target-min flex-col justify-between rounded-2xl border border-hairline-soft bg-white p-3.5 shadow-xs transition-colors hover:bg-surface-soft/60 active:bg-surface-soft min-[1024px]:p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary-action/10 text-primary-action min-[1024px]:size-11">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <ArrowRight aria-hidden="true" className="size-4 text-muted" />
          </div>

          <div className="mt-3">
            <h3 className="font-body text-body-sm font-semibold text-ink min-[1024px]:text-body-md">
              {title}
            </h3>
            <p className="mt-0.5 font-body text-caption text-muted leading-snug">
              {subtitle}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}

