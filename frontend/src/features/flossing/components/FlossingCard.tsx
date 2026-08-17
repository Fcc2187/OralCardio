import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useEffect, useState } from "react";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";

import { logFlossing } from "../api/flossingApi";

interface FlossingCardProps {
  flossingsToday: number;
}

function safeDailyCount(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
}

/** A conquista "Fio Dental Frequente" exige 30 registros — se o único
 * retorno visual fosse o toast de conquista, o botão pareceria quebrado 29
 * vezes seguidas. Por isso o card sempre mostra um estado explícito de
 * sucesso, independente de ter desbloqueado algo. `mutation.isSuccess`
 * cobre o instante entre a resposta chegar e o dashboard revalidar. */
export function FlossingCard({ flossingsToday }: FlossingCardProps) {
  const queryClient = useQueryClient();
  const [displayCount, setDisplayCount] = useState(() => safeDailyCount(flossingsToday));

  useEffect(() => setDisplayCount(safeDailyCount(flossingsToday)), [flossingsToday]);

  const mutation = useMutation({
    mutationFn: () => logFlossing(),
    onSuccess: () => {
      setDisplayCount((current) => safeDailyCount(current) + 1);
      invalidateGamifiedQueries(queryClient);
    },
  });

  return (
    <Card variant="canvas">
      <p className="font-body text-body-sm font-medium">
        {displayCount === 0
          ? "Já usou fio dental hoje?"
          : `${displayCount} ${displayCount === 1 ? "uso" : "usos"} de fio dental hoje ✓`}
      </p>

      {mutation.isError ? (
        <ErrorFeedback message="Não foi possível registrar. Tente novamente." />
      ) : null}

      <Button
        variant="secondary"
        className="mt-md"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending
          ? "Registrando…"
          : displayCount === 0
            ? "Registrar fio dental"
            : "Registrar novamente"}
      </Button>
    </Card>
  );
}
