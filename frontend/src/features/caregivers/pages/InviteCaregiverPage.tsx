import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { caregiversListQueryKey } from "@/shared/api/queryKeys";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { Screen } from "@/shared/components/layout/Screen";

import { inviteCaregiver } from "../api/caregiversApi";
import {
  buildCaregiverInvitePayload,
  INITIAL_CAREGIVER_INVITE_FORM_STATE,
  type CaregiverInviteFormState,
} from "../buildCaregiverInvitePayload";
import { translateCaregiverError } from "../caregiverErrorMessages";
import type { Caregiver } from "../types";

export function InviteCaregiverPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CaregiverInviteFormState>(INITIAL_CAREGIVER_INVITE_FORM_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invited, setInvited] = useState<Caregiver | null>(null);

  const mutation = useMutation({
    mutationFn: inviteCaregiver,
    onSuccess: (caregiver) => {
      queryClient.invalidateQueries({ queryKey: caregiversListQueryKey });
      setInvited(caregiver);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    try {
      const payload = buildCaregiverInvitePayload(form);
      mutation.mutate(payload);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Formulário inválido.");
    }
  }

  // Tela dedicada, não um toast: o e-mail "convidado" NUNCA é enviado de
  // verdade (LoggingEmailSender só escreve log — o envio real é Fase 4). O
  // paciente precisa da instrução completa parada na tela, não algo que some
  // em 3 segundos.
  if (invited) {
    return (
      <Screen title="Convite criado" backTo="/cuidadores" backLabel="Meus cuidadores">
        <div className="flex flex-col gap-md rounded-lg border border-hairline bg-surface-soft p-lg">
          <p className="font-body text-body-md text-body-strong">
            Avise <strong>{invited.caregiver_email}</strong> fora do app.
          </p>
          <p className="font-body text-body-sm text-body">
            Peça a essa pessoa que crie uma conta com este e-mail e confirme o e-mail que ela vai
            receber. Nós ainda não enviamos o convite automaticamente — não existe um link
            secreto, então quem criar conta com esse e-mail ganha o acesso.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(INITIAL_CAREGIVER_INVITE_FORM_STATE);
            setInvited(null);
          }}
        >
          Convidar outra pessoa
        </Button>
      </Screen>
    );
  }

  const errorMessage =
    validationError ?? (mutation.isError ? translateCaregiverError(mutation.error) : null);

  return (
    <Screen title="Convidar cuidador" backTo="/cuidadores" backLabel="Meus cuidadores">
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg" noValidate>
        <TextField
          label="E-mail de quem vai acompanhar"
          type="email"
          required
          value={form.caregiverEmail}
          onChange={(event) =>
            setForm((current) => ({ ...current, caregiverEmail: event.target.value }))
          }
        />

        <div className="flex flex-col gap-xs">
          <Checkbox
            label="Pode ver estatísticas e escovações"
            checked={form.canViewReports}
            onChange={(event) =>
              setForm((current) => ({ ...current, canViewReports: event.target.checked }))
            }
          />
          <Checkbox
            label="Pode ver consultas agendadas"
            checked={form.canViewAppointments}
            onChange={(event) =>
              setForm((current) => ({ ...current, canViewAppointments: event.target.checked }))
            }
          />
          <Checkbox
            label="Receber alertas (em breve — ainda não enviamos alertas)"
            checked={form.receiveAlerts}
            onChange={(event) =>
              setForm((current) => ({ ...current, receiveAlerts: event.target.checked }))
            }
          />
        </div>

        {errorMessage ? <ErrorFeedback message={errorMessage} /> : null}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Convidando…" : "Convidar"}
        </Button>
      </form>
    </Screen>
  );
}
