interface PendingCaregiverNoticeProps {
  invitedLabel: string;
}

/** Reaparece em TODA linha `pending` — não há e-mail automático (isso é
 * Fase 4), nem expiração, lembrete ou reenvio. O paciente esquece com
 * facilidade; o aviso persistente + a idade do convite são a única
 * mitigação nesta fatia. */
export function PendingCaregiverNotice({ invitedLabel }: PendingCaregiverNoticeProps) {
  return (
    <div className="rounded-md bg-surface-soft p-sm">
      <p className="font-body text-caption text-body">
        Convidado {invitedLabel.toLowerCase()}. Avise essa pessoa fora do app: ela precisa criar
        uma conta com este e-mail e confirmar o e-mail que vai receber. Ainda não enviamos o
        convite automaticamente — não existe um link secreto, então quem criar conta com este
        e-mail ganha o acesso.
      </p>
    </div>
  );
}
