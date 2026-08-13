import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
      <p className="font-display text-title-md">{title}</p>
      <p className="font-body text-body-sm text-muted">{message}</p>
      {action}
    </div>
  );
}
