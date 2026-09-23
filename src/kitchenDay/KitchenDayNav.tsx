import { kitchenDayHashFor, type KitchenDayHashSection } from './routes';

const ITEMS: { section: KitchenDayHashSection; label: string; testId: string }[] = [
  { section: 'trim', label: 'Trim Smart', testId: 'kitchen-day-nav-trim' },
  { section: 'reuse', label: 'Reuse', testId: 'kitchen-day-nav-reuse' },
  { section: 'portion', label: 'Portion Precision', testId: 'kitchen-day-nav-portion' },
  { section: 'my-day', label: 'My day', testId: 'kitchen-day-nav-my-day' },
];

export function KitchenDayNav({ section }: { section: KitchenDayHashSection }) {
  return (
    <nav className="kd-nav" data-testid="kitchen-day-nav" aria-label="Kitchen Day">
      {ITEMS.map((item) => (
        <a
          key={item.section}
          href={kitchenDayHashFor(item.section)}
          className={item.section === section ? 'kd-nav__link kd-nav__link--active' : 'kd-nav__link'}
          data-testid={item.testId}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
