import { kitchenDayHashFor, type KitchenDayHashSection } from './routes';

const ITEMS: { section: Exclude<KitchenDayHashSection, 'review'>; label: string; testId: string }[] = [
  { section: 'trim', label: 'Trim Smart', testId: 'kitchen-day-nav-trim' },
  { section: 'reuse', label: 'Reuse', testId: 'kitchen-day-nav-reuse' },
  { section: 'portion', label: 'Portion Precision', testId: 'kitchen-day-nav-portion' },
];

export function KitchenDayNav({ section }: { section: KitchenDayHashSection }) {
  return (
    <nav className="kitchen-day-activity__nav" data-testid="kitchen-day-nav" aria-label="Kitchen Day">
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
