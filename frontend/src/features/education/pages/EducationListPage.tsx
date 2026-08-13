import { useQuery } from "@tanstack/react-query";

import { educationModulesQueryKey } from "@/shared/api/queryKeys";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";

import { fetchModules } from "../api/educationApi";
import { ModuleCard } from "../components/ModuleCard";

export function EducationListPage() {
  const query = useQuery({
    queryKey: educationModulesQueryKey,
    queryFn: fetchModules,
    staleTime: 30_000,
  });

  if (query.isPending) {
    return <LoadingFeedback message="Carregando os módulos…" />;
  }

  if (query.isError) {
    return (
      <Screen title="Educação">
        <ErrorFeedback message="Não foi possível carregar os módulos. Tente novamente em instantes." />
      </Screen>
    );
  }

  const modules = query.data;
  const completedCount = modules.filter((module) => module.is_completed).length;

  return (
    <Screen title="Educação" subtitle={`${completedCount} de ${modules.length} concluídos`}>
      <div className="flex flex-col gap-md">
        {/* Ordem da API (order_index) — não reordenar aqui. */}
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </Screen>
  );
}
