import { Button } from "./Button";

interface RetryButtonProps {
  onRetry: () => unknown;
  disabled?: boolean;
  label?: string;
}

export function RetryButton({ onRetry, disabled = false, label = "Tentar novamente" }: RetryButtonProps) {
  return (
    <Button variant="secondary" disabled={disabled} onClick={() => void onRetry()}>
      {label}
    </Button>
  );
}
