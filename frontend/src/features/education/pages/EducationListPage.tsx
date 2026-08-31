import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { educationModulesQueryKey } from "@/shared/api/queryKeys";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { RetryButton } from "@/shared/components/ui/RetryButton";

import { fetchModules } from "../api/educationApi";
import { EducationProgressSummary } from "../components/EducationProgressSummary";
import { ModuleCard } from "../components/ModuleCard";
import { calculateEducationProgress } from "../educationProgress";

export function EducationListPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  const query = useQuery({
    queryKey: educationModulesQueryKey,
    queryFn: fetchModules,
    staleTime: 30_000,
  });

  useEffect(() => {
    document.title = "Educação — OralCardio";
  }, []);

  useEffect(() => {
    if (!query.isPending && !query.isError) {
      headingRef.current?.focus();
    }
  }, [query.isPending, query.isError]);

  if (query.isPending) {
    return <LoadingFeedback message="Carregando os módulos…" />;
  }

  if (query.isError) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 min-[1024px]:px-10 min-[1024px]:py-10">
        <header>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[1.85rem] font-normal leading-tight text-ink outline-none min-[1024px]:text-[2.2rem]"
          >
            Educação
          </h1>
        </header>
        <ErrorFeedback message="Não foi possível carregar os módulos. Tente novamente em instantes." />
        <RetryButton onRetry={() => query.refetch()} />
      </main>
    );
  }

  const modules = query.data;
  const progress = calculateEducationProgress(modules);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 min-[1024px]:px-10 min-[1024px]:py-10">
      {/* Top Header */}
      <header className="flex flex-col">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[1.85rem] font-normal leading-tight text-ink outline-none min-[1024px]:text-[2.2rem]"
        >
          Educação
        </h1>
        <p className="mt-1 font-body text-body-sm text-muted">
          {progress.completed} de {progress.total} concluídos
        </p>
      </header>

      {/* Resumo Geral de Progresso */}
      <EducationProgressSummary progress={progress} />

      {/* Lista de Módulos */}
      <section aria-labelledby="modules-heading" className="flex flex-col gap-4">
        <h2
          id="modules-heading"
          className="font-display text-[1.35rem] font-normal leading-tight text-ink min-[1024px]:text-[1.5rem]"
        >
          Módulos disponíveis
        </h2>

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-hairline-soft bg-white p-6 text-center">
            <p className="font-body text-body-md text-muted">
              Nenhum módulo educativo disponível no momento.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {/* Ordem da API (order_index) preservada */}
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
