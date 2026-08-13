import { useQuery } from "@tanstack/react-query";

import { caregiversListQueryKey } from "@/shared/api/queryKeys";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";

import { listCaregivers } from "../api/caregiversApi";
import { CaregiverListItem } from "../components/CaregiverListItem";

export function MyCaregiversPage() {
  const query = useQuery({
    queryKey: caregiversListQueryKey,
    queryFn: listCaregivers,
    staleTime: 30_000,
  });

  if (query.isPending) {
    return <LoadingFeedback message="Carregando seus cuidadores…" />;
  }

  if (query.isError) {
    return (
      <Screen title="Meus cuidadores" backTo="/perfil" backLabel="Perfil">
        <ErrorFeedback message="Não foi possível carregar seus cuidadores. Tente novamente em instantes." />
      </Screen>
    );
  }

  const caregivers = query.data;

  return (
    <Screen
      title="Meus cuidadores"
      subtitle="Convide alguém de confiança para acompanhar seus cuidados com a saúde bucal."
      backTo="/perfil"
      backLabel="Perfil"
    >
      <LinkButton to="/cuidadores/novo">Convidar cuidador</LinkButton>

      {caregivers.length === 0 ? (
        <EmptyState
          title="Nenhum cuidador ainda"
          message="Convide um familiar para acompanhar seus dados de saúde bucal."
        />
      ) : (
        <div className="flex flex-col gap-md">
          {caregivers.map((caregiver) => (
            <CaregiverListItem key={caregiver.id} caregiver={caregiver} />
          ))}
        </div>
      )}
    </Screen>
  );
}
