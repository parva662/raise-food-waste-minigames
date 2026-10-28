import { formatDisplayDate, formatOperationalTime } from '@/shared/time/dates';
import type { StudentJourneyParticipationSummary } from '@/products/student-journey/read/studentJourneyModel';
import { describeStudentLunchEntry } from '@/products/student-journey/read/studentJourneyModel';
import type { ParsedStudentLunchCheckin } from '@/products/student-journey/read/parseStudentLunchCheckin';

interface JourneyOverviewSectionProps {
  actorName: string | null;
  summary: StudentJourneyParticipationSummary;
  latestEntry: ParsedStudentLunchCheckin | null;
}

export function JourneyOverviewSection({
  actorName,
  summary,
  latestEntry,
}: JourneyOverviewSectionProps) {
  const latestLabel = latestEntry ? describeStudentLunchEntry(latestEntry) : null;

  return (
    <div className="student-journey-overview" data-testid="student-journey-overview">
      <section className="student-journey-card" aria-labelledby="journey-participation-title">
        <h2 id="journey-participation-title" className="student-journey-card__title">
          My participation
        </h2>
        <p className="student-journey-card__lead">
          {actorName
            ? `A snapshot of ${actorName}'s lunch declarations recorded in GameBus.`
            : 'A snapshot of your lunch declarations recorded in GameBus.'}
        </p>
        <dl className="student-journey-metrics">
          <div className="student-journey-metric">
            <dt>Declarations</dt>
            <dd data-testid="journey-declaration-count">{summary.declarationCount}</dd>
          </div>
          <div className="student-journey-metric">
            <dt>Service dates</dt>
            <dd data-testid="journey-service-date-count">{summary.distinctServiceDates}</dd>
          </div>
          <div className="student-journey-metric student-journey-metric--wide">
            <dt>Most recent</dt>
            <dd data-testid="journey-most-recent">
              {summary.mostRecentServiceDate ? (
                <>
                  <span>{formatDisplayDate(summary.mostRecentServiceDate)}</span>
                  {latestLabel ? (
                    <span className="student-journey-metric__detail">{latestLabel.optionLabel}</span>
                  ) : null}
                  {summary.mostRecentSubmittedAt ? (
                    <span className="student-journey-metric__detail">
                      Submitted {formatOperationalTime(summary.mostRecentSubmittedAt)} Helsinki
                    </span>
                  ) : null}
                </>
              ) : (
                'No declarations yet'
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="student-journey-card student-journey-card--muted" aria-labelledby="journey-streak-title">
        <h2 id="journey-streak-title" className="student-journey-card__title">
          My streak
        </h2>
        <p className="student-journey-card__body" data-testid="journey-streak-unavailable">
          Streak values are not available from a verified GameBus data source in this app yet. Use
          GameBus&apos;s own Streaks feature in the campaign if your organiser has enabled it.
        </p>
      </section>

      <section className="student-journey-card student-journey-card--muted" aria-labelledby="journey-badges-title">
        <h2 id="journey-badges-title" className="student-journey-card__title">
          My badges
        </h2>
        <p className="student-journey-card__body" data-testid="journey-badges-unavailable">
          Badges are awarded and displayed by GameBus. This dashboard does not invent or calculate
          badge progress independently.
        </p>
      </section>

      <section className="student-journey-card" aria-labelledby="journey-next-title">
        <h2 id="journey-next-title" className="student-journey-card__title">
          My next step
        </h2>
        <p className="student-journey-card__body" data-testid="journey-next-step">
          Open <strong>Student Lunch</strong> from the GameBus left menu (or My Tasks) when a lunch
          declaration mission is available. This page is read-only and does not start or complete
          tasks.
        </p>
      </section>
    </div>
  );
}
