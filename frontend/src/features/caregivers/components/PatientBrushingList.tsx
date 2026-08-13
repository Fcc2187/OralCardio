import { formatDateTimeLong } from "@/shared/utils/formatDate";

import type { BrushingSession } from "@/features/brushing/types";

interface PatientBrushingListProps {
  sessions: BrushingSession[];
}

export function PatientBrushingList({ sessions }: PatientBrushingListProps) {
  if (sessions.length === 0) {
    return (
      <p className="font-body text-body-sm text-muted">Nenhuma escovação registrada ainda.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-sm">
      {sessions.map((session) => (
        <li key={session.id} className="rounded-md border border-hairline bg-canvas p-sm">
          <p className="font-body text-body-sm text-body">{formatDateTimeLong(session.started_at)}</p>
          <p className="font-body text-caption text-muted">
            {session.is_completed
              ? `Concluída — ${session.duration_seconds ?? 0}s`
              : "Não concluída"}
          </p>
        </li>
      ))}
    </ul>
  );
}
