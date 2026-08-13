import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { caregiverInvitationsQueryKey, caregiverPatientsQueryKey } from "@/shared/api/queryKeys";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";

import { acceptInvitation } from "../api/caregiverPanelApi";
import { useInvitationsQuery, useMyPatientsQuery } from "../api/useCaregiverQueries";
import { translateCaregiverError } from "../caregiverErrorMessages";
import { InvitationCard } from "../components/InvitationCard";
import { patientDisplayName } from "../findPatientLink";

export function CaregivingPage() {
  const queryClient = useQueryClient();
  const invitationsQuery = useInvitationsQuery();
  const patientsQuery = useMyPatientsQuery();

  const acceptMutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caregiverInvitationsQueryKey });
      queryClient.invalidateQueries({ queryKey: caregiverPatientsQueryKey });
    },
  });

  if (invitationsQuery.isPending || patientsQuery.isPending) {
    return <LoadingFeedback message="Carregando…" />;
  }

  if (invitationsQuery.isError || patientsQuery.isError) {
    return (
      <Screen title="Acompanhando">
        <ErrorFeedback message="Não foi possível carregar seus convites e pacientes. Tente novamente em instantes." />
      </Screen>
    );
  }

  const invitations = invitationsQuery.data;
  const patients = patientsQuery.data;
  const isEmpty = invitations.length === 0 && patients.length === 0;

  return (
    <Screen title="Acompanhando" subtitle="Pessoas que você ajuda a cuidar da saúde bucal.">
      {acceptMutation.isError ? (
        <ErrorFeedback message={translateCaregiverError(acceptMutation.error)} />
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="Nenhum convite ou paciente ainda"
          message="Quando alguém te convidar para acompanhar seus cuidados, o convite aparece aqui."
        />
      ) : (
        <>
          {invitations.length > 0 ? (
            // Convites primeiro: aceitar é a ação que a pessoa veio fazer.
            <section className="flex flex-col gap-md">
              <h2 className="font-display text-title-lg">Convites pendentes</h2>
              {invitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  isAccepting={acceptMutation.isPending}
                  onAccept={() => acceptMutation.mutate(invitation.id)}
                />
              ))}
            </section>
          ) : null}

          {patients.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="font-display text-title-lg">Pessoas que você acompanha</h2>
              {patients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/acompanhando/${patient.patient_id}`}
                  className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md"
                >
                  <p className="font-display text-title-md">{patientDisplayName(patient)}</p>
                </Link>
              ))}
            </section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
