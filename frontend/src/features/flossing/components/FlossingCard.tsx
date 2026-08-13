import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAnnounceAchievements } from "@/shared/achievements/AchievementUnlockProvider";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";

import { logFlossing } from "../api/flossingApi";

interface FlossingCardProps {
  flossedToday: boolean;
}

/** A conquista "Fio Dental Frequente" exige 30 registros — se o único
 * retorno visual fosse o toast de conquista, o botão pareceria quebrado 29
 * vezes seguidas. Por isso o card sempre mostra um estado explícito de
 * sucesso, independente de ter desbloqueado algo. `mutation.isSuccess`
 * cobre o instante entre a resposta chegar e o dashboard revalidar. */
export function FlossingCard({ flossedToday }: FlossingCardProps) {
  const queryClient = useQueryClient();
  const announce = useAnnounceAchievements();

  const mutation = useMutation({
    mutationFn: () => logFlossing(),
    onSuccess: (result) => {
      invalidateGamifiedQueries(queryClient);
      announce(result.unlocked_achievements);
    },
  });

  const isDone = flossedToday || mutation.isSuccess;

  return (
    <Card variant="canvas">
      <p className="font-body text-body-sm font-medium">
        {isDone ? "Fio dental registrado hoje ✓" : "Já usou fio dental hoje?"}
      </p>

      {mutation.isError ? (
        <ErrorFeedback message="Não foi possível registrar. Tente novamente." />
      ) : null}

      {!isDone ? (
        <Button
          variant="secondary"
          className="mt-md"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Registrando…" : "Registrar fio dental"}
        </Button>
      ) : null}
    </Card>
  );
}
