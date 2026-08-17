import { useEffect, useState } from "react";

import { fetchHealthStatus, type HealthStatus } from "@/features/health/api/healthApi";

type LoadState =
  | { status: "loading" }
  | { status: "success"; data: HealthStatus }
  | { status: "error"; message: string };

export function HealthCheckPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    fetchHealthStatus()
      .then((data) => {
        if (isMounted) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Erro desconhecido";
          setState({ status: "error", message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main>
      <h1>OralCardio</h1>
      <p>Verificação de conexão com a API</p>

      {state.status === "loading" && <p>Verificando conexão…</p>}

      {state.status === "success" && (
        <ul>
          <li>API: {state.data.api ? "✅ online" : "❌ offline"}</li>
          <li>Banco de dados: {state.data.database ? "✅ conectado" : "❌ não configurado"}</li>
        </ul>
      )}

      {state.status === "error" && (
        <p role="alert">Não foi possível conectar à API: {state.message}</p>
      )}
    </main>
  );
}
