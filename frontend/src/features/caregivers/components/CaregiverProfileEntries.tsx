import { Link } from "react-router-dom";

import { useInvitationsQuery, useMyPatientsQuery } from "../api/useCaregiverQueries";

// Queries próprias, para não mexer na estrutura de early-return (loading/
// erro) do ProfilePage — o Modo Cuidador não pode travar o resto do Perfil.
export function CaregiverProfileEntries() {
  const invitationsQuery = useInvitationsQuery();
  const patientsQuery = useMyPatientsQuery();

  const hasCaregivingActivity =
    (invitationsQuery.data?.length ?? 0) > 0 || (patientsQuery.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md">
      <Link
        to="/cuidadores"
        className="flex min-h-tap-target-min items-center font-body text-body-md text-primary-action"
      >
        Meus cuidadores
      </Link>
      {hasCaregivingActivity ? (
        <Link
          to="/acompanhando"
          className="flex min-h-tap-target-min items-center font-body text-body-md text-primary-action"
        >
          Pacientes que acompanho
        </Link>
      ) : null}
    </div>
  );
}
