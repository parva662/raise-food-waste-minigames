import type { TrimSmartStep } from '../types';

const STEPS: { id: TrimSmartStep; label: string }[] = [
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'practice', label: 'Practice' },
  { id: 'measure', label: 'Measure' },
];

interface TrimSmartStepperProps {
  activeStep: TrimSmartStep;
}

export function TrimSmartStepper({ activeStep }: TrimSmartStepperProps) {
  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav className="trim-smart-stepper" aria-label="Trim Smart progress" data-testid="trim-smart-stepper">
      <ol className="trim-smart-stepper__list">
        {STEPS.map((step, index) => {
          const isActive = step.id === activeStep;
          const isComplete = index < activeIndex;
          return (
            <li
              key={step.id}
              className={
                isActive
                  ? 'trim-smart-stepper__item trim-smart-stepper__item--active'
                  : isComplete
                    ? 'trim-smart-stepper__item trim-smart-stepper__item--complete'
                    : 'trim-smart-stepper__item'
              }
              data-testid={`trim-smart-stepper-${step.id}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="trim-smart-stepper__index">{index + 1}</span>
              <span className="trim-smart-stepper__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
