import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createIdempotencyKey } from "@/shared/api/httpClient";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";

import { logFlossing } from "../api/flossingApi";

interface FlossingCardProps {
  flossingsToday: number;
}

function safeDailyCount(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
}

export function FlossingCard({ flossingsToday }: FlossingCardProps) {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string | null>(null);
  const [displayCount, setDisplayCount] = useState(() => safeDailyCount(flossingsToday));

  useEffect(() => setDisplayCount(safeDailyCount(flossingsToday)), [flossingsToday]);

  const mutation = useMutation({
    mutationFn: (idempotencyKey: string) => logFlossing(null, { idempotencyKey }),
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      setDisplayCount((current) => safeDailyCount(current) + 1);
      invalidateGamifiedQueries(queryClient);
    },
  });

  const buttonLabel = mutation.isPending
    ? "Registrando…"
    : displayCount === 0
      ? "Registrar uso"
      : "Registrar novamente";

  return (
    <article className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-canvas p-2 min-[1024px]:size-16">
          <img
            src="/images/home/flossing.webp"
            alt=""
            aria-hidden="true"
            className="size-10 object-contain min-[1024px]:size-11"
          />
        </div>

        <div className="flex-1">
          <h2 className="font-display text-[1.25rem] font-normal leading-tight text-ink min-[1024px]:text-[1.35rem]">
            Já usou fio dental hoje?
          </h2>
          <p className="mt-1 font-body text-body-sm text-muted leading-snug">
            {displayCount === 0
              ? "Use o fio dental pelo menos uma vez ao dia."
              : `${displayCount} ${displayCount === 1 ? "uso" : "usos"} de fio dental hoje ✓`}
          </p>
        </div>
      </div>

      {mutation.isError ? (
        <div className="mt-3">
          <ErrorFeedback message="Não foi possível registrar. Tente novamente." />
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button
          variant="secondary"
          className="h-10 rounded-full px-5 font-body text-body-sm font-medium text-primary-action min-h-tap-target-min inline-flex items-center gap-1.5"
          onClick={() => {
            idempotencyKeyRef.current ??= createIdempotencyKey();
            mutation.mutate(idempotencyKeyRef.current);
          }}
          disabled={mutation.isPending}
        >
          <span>{buttonLabel}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </article>
  );
}
