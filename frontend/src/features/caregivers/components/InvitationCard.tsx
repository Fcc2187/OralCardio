import { Button } from "@/shared/components/ui/Button";
import { formatDateTimeLong } from "@/shared/utils/formatDate";

import type { Caregiver } from "../types";

interface InvitationCardProps {
  invitation: Caregiver;
  onAccept: () => void;
  isAccepting: boolean;
}

// A lista de convites não traz o nome do paciente (só `list_my_patients`
// resolve isso, na Fase A.3) — o convite ainda não foi aceito, então essa
// informação não é adiável para depois.
export function InvitationCard({ invitation, onAccept, isAccepting }: InvitationCardProps) {
  return (
    <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-md">
      <p className="font-body text-body-sm text-muted">
        Convite recebido em {formatDateTimeLong(invitation.invited_at)}
      </p>
      <Button disabled={isAccepting} onClick={onAccept}>
        {isAccepting ? "Aceitando…" : "Aceitar convite"}
      </Button>
    </div>
  );
}
