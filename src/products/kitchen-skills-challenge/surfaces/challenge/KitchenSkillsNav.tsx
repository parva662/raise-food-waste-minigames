import { kitchenDayHashFor, type KitchenSkillsHashSection } from '@/app/routes';
import { isKitchenSkillsNavEnabled } from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import type { KitchenSkillsTaskProgress } from '@/products/kitchen-skills-challenge/domain/session/challengeGate';

const ITEMS: { section: Exclude<KitchenSkillsHashSection, 'review'>; label: string; testId: string }[] = [
  { section: 'portion', label: 'Portion Precision', testId: 'kitchen-day-nav-portion' },
  { section: 'trim', label: 'Trim Smart', testId: 'kitchen-day-nav-trim' },
  { section: 'reuse', label: 'Reuse', testId: 'kitchen-day-nav-reuse' },
];

export function KitchenSkillsNav({
  section,
  progress,
}: {
  section: KitchenSkillsHashSection;
  progress: KitchenSkillsTaskProgress;
}) {
  return (
    <nav className="kitchen-day-activity__nav" data-testid="kitchen-day-nav" aria-label="Kitchen Skills Challenge">
      {ITEMS.map((item) => {
        const enabled = isKitchenSkillsNavEnabled(item.section, progress);
        const className = [
          'kitchen-day-activity__nav-link',
          item.section === section ? 'kitchen-day-activity__nav-link--active' : '',
          enabled ? '' : 'kitchen-day-activity__nav-link--disabled',
        ]
          .filter(Boolean)
          .join(' ');
        if (!enabled) {
          return (
            <span
              key={item.section}
              className={className}
              aria-disabled="true"
              data-testid={item.testId}
            >
              {item.label}
            </span>
          );
        }
        return (
          <a key={item.section} href={kitchenDayHashFor(item.section)} className={className} data-testid={item.testId}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
