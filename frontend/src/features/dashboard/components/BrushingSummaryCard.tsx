import { ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";

interface BrushingSummaryCardProps {
  brushingsToday: number;
  streakDays: number;
}

export function BrushingSummaryCard({ brushingsToday, streakDays }: BrushingSummaryCardProps) {
  return (
    <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary-action p-6 text-on-primary shadow-xs min-[1024px]:p-8">
      <div className="relative z-10 max-w-[17rem] min-[1024px]:max-w-[20rem]">
        <p className="font-body text-body-sm font-normal text-on-primary">
          Sua escovação de hoje
        </p>

        <h2 className="mt-1 font-display text-[1.85rem] font-normal leading-tight text-on-primary min-[1024px]:text-[2.2rem]">
          {brushingsToday === 0
            ? "Ainda não escovou"
            : `${brushingsToday} ${brushingsToday === 1 ? "escovação" : "escovações"} hoje`}
        </h2>

        <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3.5 py-1 font-body text-body-sm font-medium backdrop-blur-xs text-white">
          <Flame aria-hidden="true" className="size-4" />
          <span>{streakDays} {streakDays === 1 ? "dia seguido" : "dias seguidos"}</span>
        </div>

        <p className="mt-4 font-body text-body-sm leading-relaxed text-on-primary">
          Escove por 2 minutos em todas as regiões.
        </p>
      </div>

      <div className="relative z-10 mt-6">
        <Link
          to="/escovar"
          className="inline-flex min-h-tap-target-min items-center gap-2 rounded-full bg-white px-6 py-3 font-body text-body-md font-medium text-primary-action shadow-xs transition-colors hover:bg-surface-soft active:bg-surface-soft"
        >
          <span>{brushingsToday === 0 ? "Escovar agora" : "Escovar novamente"}</span>
          <ArrowRight aria-hidden="true" className="size-4.5" />
        </Link>
      </div>

      {/* 3D Tooth and Toothbrush Illustration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1 -right-1 flex items-end justify-end select-none min-[1024px]:bottom-0 min-[1024px]:right-2"
      >
        <img
          src="/images/home/brushing-hero.webp"
          alt=""
          className="h-44 w-auto object-contain object-bottom min-[1024px]:h-56"
        />
      </div>
    </article>
  );
}
