import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { caregiversListQueryKey } from "@/shared/api/queryKeys";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { ConfirmAction } from "@/shared/components/ui/ConfirmAction";
import { calendarDayDelta, relativeDayLabel } from "@/shared/utils/formatDate";

import { inviteCaregiver, patchCaregiverPermissions, revokeCaregiver } from "../api/caregiversApi";
import { translateCaregiverError } from "../caregiverErrorMessages";
import {
  CAREGIVER_STATUS_BADGE_VARIANT,
  CAREGIVER_STATUS_LABELS,
  canEditPermissions,
} from "../caregiverStatus";
import type { Caregiver } from "../types";
import { PendingCaregiverNotice } from "./PendingCaregiverNotice";

interface CaregiverListItemProps {
  caregiver: Caregiver;
  nowMs?: number;
}

export function CaregiverListItem({ caregiver, nowMs = Date.now() }: CaregiverListItemProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleSuccess(updated: Caregiver) {
    setActionError(null);
    queryClient.setQueryData<Caregiver[]>(caregiversListQueryKey, (current) =>
      current?.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  function handleError(error: unknown) {
    setActionError(translateCaregiverError(error));
  }

  // Uma mutation só para as três permissões: desabilitar os TRÊS checkboxes
  // enquanto qualquer uma está em voo evita a corrida de PATCHes
  // concorrentes em que a última resposta vence, e dá feedback imediato num
  // toque que, em 3G, senão pareceria "o app travou".
  const permissionsMutation = useMutation({
    mutationFn: (patch: Partial<Pick<Caregiver, "can_view_reports" | "can_view_appointments" | "receive_alerts">>) =>
      patchCaregiverPermissions(caregiver.id, patch),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const revokeMutation = useMutation({
    mutationFn: () => revokeCaregiver(caregiver.id),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // "Convidar novamente" reusa exatamente o fluxo de convite: o mesmo
  // e-mail bate no índice único revogado e a Fase A.4 reativa o vínculo
  // (mesmo id, novo invited_at) em vez de criar um segundo registro.
  const reinviteMutation = useMutation({
    mutationFn: () =>
      inviteCaregiver({
        caregiver_email: caregiver.caregiver_email,
        can_view_reports: caregiver.can_view_reports,
        can_view_appointments: caregiver.can_view_appointments,
        receive_alerts: caregiver.receive_alerts,
      }),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const editable = canEditPermissions(caregiver.status) && !permissionsMutation.isPending;
  const invitedDayDelta = calendarDayDelta(nowMs, new Date(caregiver.invited_at).getTime());

  return (
    <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
      <div className="flex items-center justify-between gap-sm">
        <p className="break-all font-body text-body-md text-body-strong">
          {caregiver.caregiver_email}
        </p>
        <Badge variant={CAREGIVER_STATUS_BADGE_VARIANT[caregiver.status]}>
          {CAREGIVER_STATUS_LABELS[caregiver.status]}
        </Badge>
      </div>

      {caregiver.status === "pending" ? (
        <PendingCaregiverNotice invitedLabel={relativeDayLabel(invitedDayDelta)} />
      ) : null}

      <div className="flex flex-col gap-xs">
        <Checkbox
          label="Pode ver estatísticas e escovações"
          checked={caregiver.can_view_reports}
          disabled={!editable}
          onChange={(event) =>
            permissionsMutation.mutate({ can_view_reports: event.target.checked })
          }
        />
        <Checkbox
          label="Pode ver consultas agendadas"
          checked={caregiver.can_view_appointments}
          disabled={!editable}
          onChange={(event) =>
            permissionsMutation.mutate({ can_view_appointments: event.target.checked })
          }
        />
        <Checkbox
          label="Receber alertas (em breve — ainda não enviamos alertas)"
          checked={caregiver.receive_alerts}
          disabled={!editable}
          onChange={(event) =>
            permissionsMutation.mutate({ receive_alerts: event.target.checked })
          }
        />
      </div>

      {permissionsMutation.isPending ? (
        <p role="status" className="font-body text-caption text-muted">
          Salvando…
        </p>
      ) : null}

      {actionError ? (
        <p role="alert" className="font-body text-caption text-error">
          {actionError}
        </p>
      ) : null}

      {caregiver.status === "revoked" ? (
        <Button
          variant="secondary"
          disabled={reinviteMutation.isPending}
          onClick={() => reinviteMutation.mutate()}
        >
          {reinviteMutation.isPending ? "Convidando…" : "Convidar novamente"}
        </Button>
      ) : (
        <ConfirmAction
          label="Remover cuidador"
          question={`Remover o acesso de ${caregiver.caregiver_email}? Essa pessoa vai parar de ver seus dados.`}
          variant="secondary"
          disabled={revokeMutation.isPending}
          onConfirm={() => revokeMutation.mutate()}
        />
      )}
    </div>
  );
}
