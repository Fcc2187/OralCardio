import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { healthProfileQueryKey } from "@/shared/api/queryKeys";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { useAnnounceAchievements } from "@/shared/achievements/AchievementUnlockProvider";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { Select } from "@/shared/components/ui/Select";
import { TextField } from "@/shared/components/ui/TextField";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Screen } from "@/shared/components/layout/Screen";
import { CARDIAC_CONDITION_LABELS, type CardiacCondition } from "@/shared/types/healthProfile";
import { HttpError } from "@/shared/api/httpClient";

import { useInvitationsQuery } from "@/features/caregivers/api/useCaregiverQueries";

import { submitHealthProfile } from "../api/healthProfileMutationApi";
import { buildHealthProfilePayload, INITIAL_QUESTIONNAIRE_STATE } from "../buildHealthProfilePayload";

export function HealthQuestionnairePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const announce = useAnnounceAchievements();
  // Escape hatch para quem só é cuidador (nunca paciente): sem isso, a
  // filha adulta que só quer acompanhar o pai cardíaco ficaria presa aqui,
  // sem meio de chegar em /acompanhando sem inventar uma condição cardíaca
  // sobre si mesma (ver "bloqueador #4" no plano da fatia de Modo Cuidador).
  const invitationsQuery = useInvitationsQuery();

  const [form, setForm] = useState(INITIAL_QUESTIONNAIRE_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: submitHealthProfile,
    onSuccess: (result) => {
      queryClient.setQueryData(healthProfileQueryKey, result.data);
      invalidateGamifiedQueries(queryClient);
      announce(result.unlocked_achievements);
      navigate("/", { replace: true });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    try {
      const payload = buildHealthProfilePayload(form);
      mutation.mutate(payload);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Formulário inválido.");
    }
  }

  const submitError =
    validationError ??
    (mutation.isError
      ? mutation.error instanceof HttpError
        ? mutation.error.message
        : "Não foi possível salvar seu perfil. Tente novamente."
      : null);

  return (
    <Screen
      title="Antes de começar"
      subtitle="Esse questionário ajuda a personalizar seu acompanhamento. Leva menos de 2 minutos."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg" noValidate>
        <Select
          label="Condição cardíaca"
          required
          value={form.cardiacCondition}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              cardiacCondition: event.target.value as CardiacCondition,
            }))
          }
        >
          <option value="" disabled>
            Selecione uma opção
          </option>
          {Object.entries(CARDIAC_CONDITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <TextField
          label="Detalhes adicionais (opcional)"
          value={form.cardiacConditionDetail}
          onChange={(event) =>
            setForm((current) => ({ ...current, cardiacConditionDetail: event.target.value }))
          }
        />

        <Checkbox
          label="Uso marca-passo"
          checked={form.hasPacemaker}
          onChange={(event) =>
            setForm((current) => ({ ...current, hasPacemaker: event.target.checked }))
          }
        />
        <Checkbox
          label="Tenho válvula protética"
          checked={form.hasProstheticValve}
          onChange={(event) =>
            setForm((current) => ({ ...current, hasProstheticValve: event.target.checked }))
          }
        />

        <Textarea
          label="Medicações em uso (opcional)"
          hint="Separe por vírgula"
          value={form.medicationsText}
          onChange={(event) =>
            setForm((current) => ({ ...current, medicationsText: event.target.value }))
          }
        />
        <Textarea
          label="Alergias (opcional)"
          hint="Separe por vírgula"
          value={form.allergiesText}
          onChange={(event) =>
            setForm((current) => ({ ...current, allergiesText: event.target.value }))
          }
        />

        <TextField
          label="Última visita ao dentista (opcional)"
          type="date"
          value={form.lastDentalVisit}
          onChange={(event) =>
            setForm((current) => ({ ...current, lastDentalVisit: event.target.value }))
          }
        />
        <TextField
          label="Quantas vezes escovava por dia antes (opcional)"
          type="number"
          min={0}
          max={20}
          value={form.brushingFrequencyBefore}
          onChange={(event) =>
            setForm((current) => ({ ...current, brushingFrequencyBefore: event.target.value }))
          }
        />

        <TextField
          label="Nome do dentista (opcional)"
          value={form.dentistName}
          onChange={(event) =>
            setForm((current) => ({ ...current, dentistName: event.target.value }))
          }
        />
        <TextField
          label="Telefone do dentista (opcional)"
          type="tel"
          value={form.dentistPhone}
          onChange={(event) =>
            setForm((current) => ({ ...current, dentistPhone: event.target.value }))
          }
        />
        <TextField
          label="Nome do cardiologista (opcional)"
          value={form.cardiologistName}
          onChange={(event) =>
            setForm((current) => ({ ...current, cardiologistName: event.target.value }))
          }
        />

        {submitError ? <ErrorFeedback message={submitError} /> : null}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Concluir"}
        </Button>
      </form>

      {(invitationsQuery.data?.length ?? 0) > 0 ? (
        <Link
          to="/acompanhando"
          className="flex min-h-tap-target-min items-center justify-center font-body text-body-sm text-primary-action"
        >
          Você foi convidado para acompanhar alguém → Ver convites
        </Link>
      ) : null}
    </Screen>
  );
}
