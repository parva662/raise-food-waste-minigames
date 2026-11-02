import type { ReactNode } from 'react';

interface MealSectionProps {
  title: string;
  description: string;
  active: boolean;
  muted: boolean;
  onActivate: () => void;
  activateDisabled?: boolean;
  children?: ReactNode;
  sectionId: string;
  /** When true, the whole section (not only the header) activates on click. */
  fullSectionActivate?: boolean;
  /** Distinct absence option styling (separated from food menu cards). */
  absenceOption?: boolean;
}

export function MealSection({
  title,
  description,
  active,
  muted,
  onActivate,
  activateDisabled = false,
  children,
  sectionId,
  fullSectionActivate = false,
  absenceOption = false,
}: MealSectionProps) {
  const handleSectionClick = () => {
    if (activateDisabled) return;
    onActivate();
  };

  const sectionClassName = [
    'meal-section',
    fullSectionActivate ? 'meal-section--full-activate' : '',
    absenceOption ? 'meal-section--absence' : '',
    active ? 'meal-section--active' : '',
    muted ? 'meal-section--muted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (fullSectionActivate) {
    return (
      <section className={sectionClassName} aria-labelledby={`${sectionId}-heading`}>
        <button
          type="button"
          id={`${sectionId}-heading`}
          className="meal-section__select meal-section__select--full"
          onClick={handleSectionClick}
          disabled={activateDisabled}
          aria-pressed={active}
        >
          <span className="meal-section__title">{title}</span>
          <span className="meal-section__description">{description}</span>
        </button>
      </section>
    );
  }

  return (
    <section
      className={sectionClassName}
      aria-labelledby={`${sectionId}-heading`}
      onClick={activateDisabled ? undefined : handleSectionClick}
      role="presentation"
    >
      <div
        id={`${sectionId}-heading`}
        className="meal-section__select meal-section__select--static"
        aria-pressed={active}
      >
        <span className="meal-section__title">{title}</span>
        <span className="meal-section__description">{description}</span>
      </div>
      {children !== undefined && (
        <div className="meal-section__body" onClick={(event) => event.stopPropagation()}>
          {children}
        </div>
      )}
    </section>
  );
}
