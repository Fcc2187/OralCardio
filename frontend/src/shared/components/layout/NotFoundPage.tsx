import { LinkButton } from "@/shared/components/ui/LinkButton";

import { Screen } from "./Screen";

export function NotFoundPage() {
  return (
    <Screen title="Página não encontrada">
      <LinkButton to="/">Voltar ao início</LinkButton>
    </Screen>
  );
}
