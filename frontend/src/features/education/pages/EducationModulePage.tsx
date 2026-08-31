import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { HttpError } from "@/shared/api/httpClient";
import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import {
  educationModuleQueryKey,
  educationModulesQueryKey,
} from "@/shared/api/queryKeys";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { RetryButton } from "@/shared/components/ui/RetryButton";

import { completeModule, fetchModuleBySlug, fetchModules } from "../api/educationApi";
import { ModuleCompletionCard } from "../components/ModuleCompletionCard";
import { ModuleCompletionToast } from "../components/ModuleCompletionToast";
import { ModuleContent } from "../components/ModuleContent";
import { ModuleHero } from "../components/ModuleHero";
import { ModuleVideoPlayer } from "../components/ModuleVideoPlayer";
import { getEducationModuleMedia } from "../moduleMedia";
import { parseModuleContent } from "../parseModuleContent";
import { useModuleStart } from "../useModuleStart";
import { useVisibleReadingTime } from "../useVisibleReadingTime";

interface CompletionVariables {
  moduleId: string;
  slug: string;
  readTimeSeconds: number;
}

export function EducationModulePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const activeSlugRef = useRef(slug);
  const completionInFlightRef = useRef(false);
  const [showToast, setShowToast] = useState(false);

  const moduleQuery = useQuery({
    queryKey: educationModuleQueryKey(slug),
    queryFn: () => fetchModuleBySlug(slug),
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: educationModulesQueryKey,
    queryFn: fetchModules,
    staleTime: 30_000,
  });

  useModuleStart(moduleQuery.data, slug);
  const getReadTimeSeconds = useVisibleReadingTime(
    Boolean(moduleQuery.data && !moduleQuery.data.is_completed),
    slug,
  );

  const completeMutation = useMutation({
    mutationFn: ({ moduleId, readTimeSeconds }: CompletionVariables) =>
      completeModule(moduleId, readTimeSeconds),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(educationModuleQueryKey(variables.slug), result);
      queryClient.invalidateQueries({ queryKey: educationModulesQueryKey, exact: true });
      invalidateGamifiedQueries(queryClient);
      if (activeSlugRef.current === variables.slug) setShowToast(true);
    },
  });

  const { reset: resetCompleteMutation } = completeMutation;

  useEffect(() => {
    activeSlugRef.current = slug;
    completionInFlightRef.current = false;
    resetCompleteMutation();
    setShowToast(false);
  }, [slug, resetCompleteMutation]);

  useEffect(() => {
    if (moduleQuery.data?.title) {
      document.title = `${moduleQuery.data.title} — OralCardio`;
    }
  }, [moduleQuery.data?.title]);

  useEffect(() => {
    if (!moduleQuery.isPending && !moduleQuery.isError) {
      headingRef.current?.focus();
    }
  }, [moduleQuery.isPending, moduleQuery.isError]);

  if (moduleQuery.isPending) {
    return <LoadingFeedback message="Carregando o módulo…" />;
  }

  if (moduleQuery.isError) {
    const isNotFound =
      moduleQuery.error instanceof HttpError && moduleQuery.error.status === 404;
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 min-[1024px]:px-10 min-[1024px]:py-10">
        <header className="flex items-center gap-4">
          <Link
            to="/educacao"
            aria-label="Voltar para Educação"
            className="flex size-10 items-center justify-center rounded-full border border-hairline-soft bg-white text-ink shadow-xs transition-colors hover:bg-surface-soft min-h-tap-target-min min-w-tap-target-min"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[1.85rem] font-normal leading-tight text-ink outline-none"
          >
            Módulo não encontrado
          </h1>
        </header>
        <ErrorFeedback
          message={
            isNotFound
              ? "Esse módulo não existe ou não está mais disponível."
              : "Não foi possível carregar o módulo. Tente novamente em instantes."
          }
        />
        {!isNotFound ? <RetryButton onRetry={() => moduleQuery.refetch()} /> : null}
      </main>
    );
  }

  const module = moduleQuery.data;
  const isCompleted = Boolean(
    module.is_completed ||
      (completeMutation.isSuccess &&
        completeMutation.variables.moduleId === module.id &&
        completeMutation.variables.slug === module.slug),
  );

  const blocks = parseModuleContent(module.content);
  const media = getEducationModuleMedia(module.slug);

  const modulesList = listQuery.data ?? [];
  const totalCount = modulesList.length;
  const completedCount = isCompleted
    ? Math.max(
        modulesList.filter((m) => m.is_completed).length,
        modulesList.filter((m) => (m.slug === module.slug ? true : m.is_completed)).length,
      )
    : modulesList.filter((m) => m.is_completed).length;

  const sortedModules = [...modulesList].sort((a, b) => a.order_index - b.order_index);
  const currentIndex = sortedModules.findIndex((m) => m.slug === module.slug);
  const nextModule =
    currentIndex >= 0 && currentIndex < sortedModules.length - 1
      ? sortedModules[currentIndex + 1]
      : null;

  function handleModuleCompletion() {
    if (isCompleted || completeMutation.isPending || completionInFlightRef.current) return;

    const completedSlug = module.slug;
    completionInFlightRef.current = true;
    completeMutation.mutate(
      {
        moduleId: module.id,
        slug: completedSlug,
        readTimeSeconds: getReadTimeSeconds(),
      },
      {
        onSettled: () => {
          if (activeSlugRef.current === completedSlug) {
            completionInFlightRef.current = false;
          }
        },
      },
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 min-[1024px]:px-10 min-[1024px]:py-10">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/educacao"
            aria-label="Voltar para Educação"
            className="flex size-10 items-center justify-center rounded-full border border-hairline-soft bg-white text-ink shadow-xs transition-colors hover:bg-surface-soft min-h-tap-target-min min-w-tap-target-min"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[1.4rem] font-normal text-ink outline-none min-[1024px]:text-[1.6rem]"
          >
            Educação
          </h1>
        </div>

        {totalCount > 0 ? (
          <div
            aria-label={`Progresso: ${completedCount} de ${totalCount} concluídos`}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline-soft bg-white px-3.5 py-1.5 font-body text-caption font-semibold text-body shadow-2xs"
          >
            <BookOpen className="size-4 text-primary-action stroke-[2]" aria-hidden="true" />
            <span>
              {completedCount} de {totalCount}
            </span>
          </div>
        ) : null}
      </header>

      {/* Hero do Módulo */}
      <ModuleHero module={{ ...module, is_completed: isCompleted }} />

      {/* Conteúdo Teórico */}
      <ModuleContent blocks={blocks} fallbackDescription={module.description} />

      {/* Seção do Vídeo Instrutivo */}
      <section aria-labelledby="video-heading" className="flex flex-col gap-3.5">
        <h3
          id="video-heading"
          className="font-display text-[1.35rem] font-normal leading-tight text-ink min-[1024px]:text-[1.5rem]"
        >
          Vídeo instrutivo
        </h3>

        <ModuleVideoPlayer
          title={`Vídeo instrutivo: ${module.title}`}
          src={media?.videoSrc ?? null}
          onEnded={handleModuleCompletion}
        />
      </section>

      {/* Feedback de erro no salvamento */}
      {completeMutation.isError ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-hairline-soft bg-white p-4 shadow-xs">
          <ErrorFeedback message="Não foi possível salvar sua conclusão. Tente novamente." />
          <Button
            onClick={handleModuleCompletion}
            disabled={completeMutation.isPending}
            className="w-fit"
          >
            {completeMutation.isPending ? "Salvando…" : "Tentar novamente"}
          </Button>
        </div>
      ) : null}

      {/* Card de Conclusão e Próximo Módulo */}
      {isCompleted ? (
        <ModuleCompletionCard nextModuleSlug={nextModule?.slug ?? null} />
      ) : null}

      {/* Toast Acessível de Conclusão */}
      <ModuleCompletionToast
        isVisible={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </main>
  );
}
