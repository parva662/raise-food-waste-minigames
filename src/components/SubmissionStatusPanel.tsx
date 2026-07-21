import { useEffect, useState } from 'react';
import type { SubmissionWindowStatus } from '../types/declaration';
import { formatCountdown } from '../services/submissionWindow';

interface SubmissionStatusPanelProps {
  status: SubmissionWindowStatus;
  now: Date;
}

export function SubmissionStatusPanel({ status, now }: SubmissionStatusPanelProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!status.countdownTargetIso) {
      setCountdown('');
      return;
    }
    setCountdown(formatCountdown(now, status.countdownTargetIso));
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(new Date(), status.countdownTargetIso!));
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [status.countdownTargetIso, now]);

  return (
    <section
      className={`submission-status submission-status--${status.phase}`}
      aria-live="polite"
    >
      <h3 className="submission-status__title">{status.message}</h3>
      <ul className="submission-status__details">
        {status.detailLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {status.countdownTargetIso && (
        <p className="submission-status__countdown">
          Time remaining: <strong>{countdown || '…'}</strong>
        </p>
      )}
    </section>
  );
}
