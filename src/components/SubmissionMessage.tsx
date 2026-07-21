import { useEffect } from 'react';

interface SubmissionMessageProps {
  message: string | null;
  pointsMessage?: string | null;
  onDismiss?: () => void;
  dismissMs?: number;
}

export function SubmissionMessage({
  message,
  pointsMessage,
  onDismiss,
  dismissMs = 4000,
}: SubmissionMessageProps) {
  useEffect(() => {
    if (!message || !onDismiss) return undefined;
    const timeoutId = window.setTimeout(onDismiss, dismissMs);
    return () => window.clearTimeout(timeoutId);
  }, [message, onDismiss, dismissMs]);

  if (!message) return null;

  return (
    <div className="submission-message" role="status" aria-live="polite">
      <p>{message}</p>
      {pointsMessage && <p className="submission-message__points">{pointsMessage}</p>}
    </div>
  );
}
