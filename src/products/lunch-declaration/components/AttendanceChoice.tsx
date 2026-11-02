import { formatDisplayDate } from '@/shared/time/dates';

export type AttendanceAnswer = 'undecided' | 'yes' | 'no';

interface AttendanceChoiceProps {
  lunchDate: string;
  attendance: AttendanceAnswer;
  disabled?: boolean;
  onSelect: (answer: 'yes' | 'no') => void;
}

export function AttendanceChoice({
  lunchDate,
  attendance,
  disabled = false,
  onSelect,
}: AttendanceChoiceProps) {
  const questionId = 'attendance-choice-question';

  return (
    <section className="attendance-choice" aria-labelledby={questionId}>
      <h2 id={questionId} className="attendance-choice__question">
        Will you eat at the canteen on {formatDisplayDate(lunchDate)}?
      </h2>

      <div className="attendance-choice__options" role="group" aria-labelledby={questionId}>
        <button
          type="button"
          className={`attendance-choice__option${attendance === 'yes' ? ' attendance-choice__option--selected' : ''}`}
          aria-pressed={attendance === 'yes'}
          disabled={disabled}
          onClick={() => onSelect('yes')}
        >
          <span className="attendance-choice__option-label">Yes, I&apos;m having lunch</span>
        </button>

        <button
          type="button"
          className={`attendance-choice__option${attendance === 'no' ? ' attendance-choice__option--selected' : ''}`}
          aria-pressed={attendance === 'no'}
          disabled={disabled}
          onClick={() => onSelect('no')}
        >
          <span className="attendance-choice__option-label">No, I&apos;m not having lunch</span>
        </button>
      </div>
    </section>
  );
}
