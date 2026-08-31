import { ArrowRight, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";

interface ModuleCompletionCardProps {
  nextModuleSlug: string | null;
}
export function ModuleCompletionCard({
  nextModuleSlug,
}: ModuleCompletionCardProps) {
  const targetUrl = nextModuleSlug ? `/educacao/${nextModuleSlug}` : "/educacao";
  const buttonLabel = nextModuleSlug ? "Ver próximos" : "Voltar aos módulos";

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-hairline-soft bg-white p-6 shadow-xs min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between min-[1024px]:p-8">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-action/10 text-primary-action min-[640px]:size-14"
        >
          <PartyPopper className="size-6 stroke-[1.8]" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-[1.25rem] font-normal leading-tight text-ink min-[1024px]:text-[1.35rem]">
            Módulo concluído!
          </h3>
          <p className="mt-1 font-body text-body-sm text-muted leading-relaxed">
            Continue aprendendo e cuide ainda mais do seu sorriso e do seu coração.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to={targetUrl}
          className="inline-flex min-h-tap-target-min items-center justify-center gap-2 rounded-full bg-primary-action px-6 py-3 font-body text-body-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-pressed shrink-0"
        >
          <span>{buttonLabel}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}
