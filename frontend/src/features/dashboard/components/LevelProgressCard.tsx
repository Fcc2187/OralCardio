import { Star } from "lucide-react";

interface LevelProgressCardProps {
  levelName: string;
  totalPoints: number;
  currentLevelMinPoints: number;
  nextLevelName: string | null;
  nextLevelMinPoints: number | null;
}

const LEVEL_IMAGE_BY_NAME: Record<string, string> = {
  Semente: "/images/levels/semente.webp",
  Broto: "/images/levels/broto.webp",
  Raiz: "/images/levels/raiz.webp",
  Flor: "/images/levels/flor.webp",
  Fruto: "/images/levels/fruto.webp",
  "Guardião do Coração": "/images/levels/guardiao-coracao.webp",
};

export function LevelProgressCard({
  levelName,
  totalPoints,
  currentLevelMinPoints,
  nextLevelName,
  nextLevelMinPoints,
}: LevelProgressCardProps) {
  const isMaxLevel = nextLevelName === null || nextLevelMinPoints === null;

  const progressPercent = isMaxLevel
    ? 100
    : Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((totalPoints - currentLevelMinPoints) /
              Math.max(1, nextLevelMinPoints - currentLevelMinPoints)) *
              100,
          ),
        ),
      );

  const levelImage = LEVEL_IMAGE_BY_NAME[levelName] ?? "/images/levels/semente.webp";

  return (
    <article className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-xs">
      <div className="flex items-start gap-4">
        {/* Plant Illustration */}
        <div className="flex size-20 shrink-0 items-center justify-center min-[1024px]:size-24">
          <img
            src={levelImage}
            alt=""
            aria-hidden="true"
            className="size-full object-contain"
          />
        </div>

        {/* Level Details & Progress */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-body text-caption text-muted">Seu nível</p>
              <h2 className="font-display text-[1.4rem] font-normal leading-tight text-ink min-[1024px]:text-[1.6rem]">
                {levelName}
              </h2>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-primary-action px-3 py-1 font-body text-caption font-medium text-white min-[1024px]:text-body-xs">
              <Star aria-hidden="true" className="size-3.5 fill-current" />
              <span>{totalPoints} pontos</span>
            </div>
          </div>

          <p className="mt-1.5 font-body text-body-xs text-muted leading-tight">
            Continue assim e colha grandes conquistas!
          </p>

          <div className="mt-3">
            <div className="flex justify-between font-body text-caption text-muted">
              <span>{isMaxLevel ? "Nível máximo" : "Próximo nível"}</span>
            </div>

            <div
              className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-soft"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso do nível: ${progressPercent}%`}
            >
              <div
                className="h-full rounded-full bg-primary-action transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="mt-1 text-right font-body text-caption text-muted">
              {isMaxLevel
                ? "Nível máximo atingido"
                : `${totalPoints} / ${nextLevelMinPoints} pontos`}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

