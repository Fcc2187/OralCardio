import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { educationModuleQueryKey } from "@/shared/api/queryKeys";

import { startModule } from "./api/educationApi";
import type { EducationModule } from "./types";

/** Chama `/start` uma única vez por módulo aberto, só quando ainda não
 * iniciado — poupa a chamada em toda reabertura, que é o caso comum.
 * Fire-and-forget e nunca expõe erro: uma falha de bookkeeping não pode
 * bloquear um paciente de ler sobre endocardite. Atualiza o cache via
 * `setQueryData` (não invalida) para não causar refetch/piscada numa
 * chamada que é só contabilidade. O ref-guard evita duas chamadas por causa
 * do double-invoke de efeitos do StrictMode em desenvolvimento. */
export function useModuleStart(module: EducationModule | undefined, slug: string): void {
  const queryClient = useQueryClient();
  const startedModuleIds = useRef(new Set<string>());

  useEffect(() => {
    if (!module || module.is_started) return;
    if (startedModuleIds.current.has(module.id)) return;
    startedModuleIds.current.add(module.id);

    startModule(module.id)
      .then((updated) => {
        queryClient.setQueryData(educationModuleQueryKey(slug), updated);
      })
      .catch(() => {
        // Permite uma nova tentativa quando a tela recuperar foco/refizer a query.
        startedModuleIds.current.delete(module.id);
      });
  }, [module, slug, queryClient]);
}
