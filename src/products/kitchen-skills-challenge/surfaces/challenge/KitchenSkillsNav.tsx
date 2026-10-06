import { kitchenDayHashFor, type KitchenSkillsHashSection } from '@/app/routes';

const ITEMS: { section: Exclude<KitchenSkillsHashSection, 'review'>; label: string; testId: string }[] = [
  { section: 'portion', label: 'Portion Precision', testId: 'kitchen-day-nav-portion' },
  { section: 'trim', label: 'Trim Smart', testId: 'kitchen-day-nav-trim' },
  { section: 'reuse', label: 'Reuse', testId: 'kitchen-day-nav-reuse' },
];

export function KitchenSkillsNav({ section }: { section: KitchenSkillsHashSection }) {
  return (
    <nav className="kitchen-day-activity__nav" data-testid="kitchen-day-nav" aria-label="Kitchen Skills Challenge">
      {ITEMS.map((item) => (
        <a
          key={item.section}
          href={kitchenDayHashFor(item.section)}
          className={
            item.section === section
              ? 'kitchen-day-activity__nav-link kitchen-day-activity__nav-link--active'
              : 'kitchen-day-activity__nav-link'
          }
          data-testid={item.testId}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
