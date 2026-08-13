interface FeedbackProps {
  message: string;
}

export function LoadingFeedback({ message }: FeedbackProps) {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-md p-xl text-center"
    >
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-pill border-4 border-hairline border-t-primary-action"
      />
      <p className="font-body text-body-md text-muted">{message}</p>
    </div>
  );
}

export function ErrorFeedback({ message }: FeedbackProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center gap-sm rounded-md border border-error/30 bg-error/10 p-lg text-center"
    >
      <p className="font-body text-body-md text-error">{message}</p>
    </div>
  );
}
