import { Menu } from 'lucide-react';
import { getTomorrowDate, formatFullDate } from '../utils/dates';
import { SubmissionRulesMessage } from './SubmissionRulesMessage';

export function AppHeader() {
  const tomorrow = getTomorrowDate();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__mobile-bar">
          <button type="button" className="app-header__menu-btn" aria-label="Open menu">
            <Menu size={20} aria-hidden="true" />
          </button>
          <h1 className="app-header__mobile-title">Tomorrow&apos;s Lunch</h1>
          <span className="app-header__menu-spacer" aria-hidden="true" />
        </div>

        <div className="app-header__content">
          <div className="app-header__title-row">
            <h1 className="app-header__title">Tomorrow&apos;s Lunch</h1>
            <time className="app-header__date" dateTime={tomorrow.toISOString()}>
              {formatFullDate(tomorrow)}
            </time>
          </div>
          <p className="app-header__subtitle">
            Select what you plan to eat so the canteen can prepare the right amount.
          </p>
          <p className="app-header__deadline">
            Submit before <strong>18:00</strong> today
          </p>
          <SubmissionRulesMessage />
        </div>
      </div>
    </header>
  );
}
