import { formatDisplayDate, formatOperationalTime } from '@/shared/time/dates';
import type { ParsedStudentLunchCheckin } from '@/products/student-journey/read/parseStudentLunchCheckin';
import { describeStudentLunchEntry } from '@/products/student-journey/read/studentJourneyModel';

interface JourneyProgressSectionProps {
  history: readonly ParsedStudentLunchCheckin[];
}

export function JourneyProgressSection({ history }: JourneyProgressSectionProps) {
  const timeline = [...history].reverse();

  return (
    <div className="student-journey-progress" data-testid="student-journey-progress">
      <section className="student-journey-card" aria-labelledby="journey-timeline-title">
        <h2 id="journey-timeline-title" className="student-journey-card__title">
          Participation over time
        </h2>
        <p className="student-journey-card__lead">
          Each mark is one lunch service date you declared for — including No lunch.
        </p>
        {timeline.length === 0 ? (
          <p className="chef-results-empty" data-testid="journey-timeline-empty">
            No participation dates yet.
          </p>
        ) : (
          <ol className="student-journey-timeline" data-testid="journey-timeline">
            {timeline.map((entry) => (
              <li
                key={`timeline:${entry.targetDate}:${entry.activityId}`}
                className="student-journey-timeline__mark"
                title={formatDisplayDate(entry.targetDate)}
              >
                <span className="student-journey-timeline__dot" aria-hidden="true" />
                <span className="student-journey-timeline__label">
                  {formatDisplayDate(entry.targetDate)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="student-journey-card" aria-labelledby="journey-history-title">
        <h2 id="journey-history-title" className="student-journey-card__title">
          Lunch declaration history
        </h2>
        <p className="student-journey-card__lead">
          One entry per lunch service date. Duplicate submissions for the same date keep the latest
          record. No lunch counts as participation.
        </p>

        {history.length === 0 ? (
          <p className="chef-results-empty" data-testid="journey-history-empty">
            No personal lunch declarations found yet.
          </p>
        ) : (
          <ol className="student-journey-history" data-testid="journey-history-list">
            {history.map((entry) => {
              const label = describeStudentLunchEntry(entry);
              return (
                <li key={`${entry.targetDate}:${entry.activityId}`} className="student-journey-history__item">
                  <div className="student-journey-history__when">
                    <p className="student-journey-history__date">{formatDisplayDate(entry.targetDate)}</p>
                    <p className="student-journey-history__submitted">
                      {formatOperationalTime(entry.submittedAt)} Helsinki
                    </p>
                  </div>
                  <div className="student-journey-history__meal">
                    <p className="student-journey-history__option">{label.optionLabel}</p>
                    {label.quantityDetail ? (
                      <p className="student-journey-history__qty">{label.quantityDetail}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="student-journey-card student-journey-card--muted" aria-labelledby="journey-measurements-title">
        <h2 id="journey-measurements-title" className="student-journey-card__title">
          Plate measurements
        </h2>
        <p className="student-journey-card__body" data-testid="journey-measurements-unavailable">
          Personal before/after plate measurements and food-waste progress will appear here when a
          verified GameBus measurement contract and Input Collection are available. This page does
          not estimate plate waste from kitchen closeout data.
        </p>
      </section>
    </div>
  );
}
