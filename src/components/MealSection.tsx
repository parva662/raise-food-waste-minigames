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
}: MealSectionProps) {
  const handleSectionClick = () => {
    if (activateDisabled) return;
    onActivate();
  };

  if (fullSectionActivate) {
    return (
      <section
        className={`meal-section meal-section--full-activate${active ? ' meal-section--active' : ''}${muted ? ' meal-section--muted' : ''}`}
        aria-labelledby={`${sectionId}-heading`}
      >
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
      className={`meal-section${active ? ' meal-section--active' : ''}${muted ? ' meal-section--muted' : ''}`}
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
