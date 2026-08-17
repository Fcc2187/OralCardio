import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { HttpError } from "@/shared/api/httpClient";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { educationModuleQueryKey, educationModulesQueryKey } from "@/shared/api/queryKeys";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";

import { completeModule, fetchModuleBySlug } from "../api/educationApi";
import { EDUCATION_CATEGORY_LABELS } from "../categoryLabels";
import { ModuleContent } from "../components/ModuleContent";
import { computeReadTimeSeconds } from "../computeReadTimeSeconds";
import { parseModuleContent } from "../parseModuleContent";
import { useModuleStart } from "../useModuleStart";

export function EducationModulePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const readingStartedAtRef = useRef(Date.now());

  const query = useQuery({
    queryKey: educationModuleQueryKey(slug),
    queryFn: () => fetchModuleBySlug(slug),
    staleTime: 30_000,
  });

  useModuleStart(query.data, slug);

  const completeMutation = useMutation({
    mutationFn: (moduleId: string) =>
      completeModule(moduleId, computeReadTimeSeconds(readingStartedAtRef.current, Date.now())),
    onSuccess: (result) => {
      queryClient.setQueryData(educationModuleQueryKey(slug), result);
      queryClient.invalidateQueries({ queryKey: educationModulesQueryKey });
      invalidateGamifiedQueries(queryClient);
    },
  });

  if (query.isPending) {
    return <LoadingFeedback message="Carregando o módulo…" />;
  }

  if (query.isError) {
    const isNotFound = query.error instanceof HttpError && query.error.status === 404;
    return (
      <Screen title="Módulo não encontrado" backTo="/educacao" backLabel="Educação">
        <ErrorFeedback
          message={
            isNotFound
              ? "Esse módulo não existe ou não está mais disponível."
              : "Não foi possível carregar o módulo. Tente novamente em instantes."
          }
        />
      </Screen>
    );
  }

  const module = query.data;
  const blocks = parseModuleContent(module.content);

  return (
    <Screen
      title={module.title}
      subtitle={EDUCATION_CATEGORY_LABELS[module.category]}
      backTo="/educacao"
      backLabel="Educação"
    >
      <ModuleContent blocks={blocks} fallbackDescription={module.description} />

      {completeMutation.isError ? (
        <ErrorFeedback message="Não foi possível salvar sua conclusão. Tente novamente." />
      ) : null}

      {module.is_completed ? (
        <Badge variant="coral">Concluído</Badge>
      ) : (
        <Button
          onClick={() => completeMutation.mutate(module.id)}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? "Salvando…" : "Marcar como concluído"}
        </Button>
      )}
    </Screen>
  );
}
