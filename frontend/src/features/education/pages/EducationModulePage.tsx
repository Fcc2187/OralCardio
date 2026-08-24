import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { HttpError } from "@/shared/api/httpClient";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { educationModuleQueryKey, educationModulesQueryKey } from "@/shared/api/queryKeys";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { RetryButton } from "@/shared/components/ui/RetryButton";

import { completeModule, fetchModuleBySlug } from "../api/educationApi";
import { EDUCATION_CATEGORY_LABELS } from "../categoryLabels";
import { ModuleContent } from "../components/ModuleContent";
import { parseModuleContent } from "../parseModuleContent";
import { useModuleStart } from "../useModuleStart";
import { useVisibleReadingTime } from "../useVisibleReadingTime";

const MODULE_VIDEO_BY_SLUG: Record<string, string | null> = {
  "conexao-boca-coracao": "/videos/video-1.mp4",
  "o-que-e-bacteremia": "/videos/video-2.mp4",
  "entendendo-endocardite": "/videos/video-3.mp4",
  "gengivite-risco-silencioso": "/videos/video-4.mp4",
  "tecnicas-escovacao-fio-dental": "/videos/video-5.mp4",
  "medicamentos-cardiacos-odontologia": null, // slot reservado para video-6.mp4
};

export function EducationModulePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: educationModuleQueryKey(slug),
    queryFn: () => fetchModuleBySlug(slug),
    staleTime: 30_000,
  });

  useModuleStart(query.data, slug);
  const getReadTimeSeconds = useVisibleReadingTime(Boolean(query.data && !query.data.is_completed));

  const completeMutation = useMutation({
    mutationFn: (moduleId: string) => completeModule(moduleId, getReadTimeSeconds()),
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
        {!isNotFound ? <RetryButton onRetry={() => query.refetch()} /> : null}
      </Screen>
    );
  }

  const module = query.data;
  const blocks = parseModuleContent(module.content);
  const videoSrc = MODULE_VIDEO_BY_SLUG[module.slug];
  const videoIsPending = module.slug === "medicamentos-cardiacos-odontologia" && videoSrc === null;
  const contentWithVideo = videoSrc
    ? [...blocks, { type: "video" as const, title: "Vídeo instrutivo", src: videoSrc }]
    : blocks;

  return (
    <Screen
      title={module.title}
      subtitle={EDUCATION_CATEGORY_LABELS[module.category]}
      backTo="/educacao"
      backLabel="Educação"
    >
      <ModuleContent blocks={contentWithVideo} fallbackDescription={module.description} />
      {videoIsPending ? (
        <p className="font-body text-body-sm text-muted">Vídeo instrutivo em breve.</p>
      ) : null}

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
