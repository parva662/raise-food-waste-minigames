import { formatServiceDateLong } from '../../displayFormat';

interface ParticipantHeaderProps {
  serviceDate: string;
}

export function ParticipantHeader({ serviceDate }: ParticipantHeaderProps) {
  return (
    <header className="chef-results-participant-header" data-testid="participant-results-header">
      <p className="chef-results-participant-header__eyebrow">Kitchen forecast results</p>
      <h1 className="chef-results-participant-header__title">Your result</h1>
      <p className="chef-results-participant-header__date">
        Service date: {formatServiceDateLong(serviceDate)}
      </p>
      <p className="chef-results-participant-header__intro">
        Your forecast is simulated against the observed service demand. These values do not
        represent waste personally caused by you.
      </p>
    </header>
  );
}
