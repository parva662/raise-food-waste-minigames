import { Leaf, Drumstick, Soup, CakeSlice } from 'lucide-react';
import type { MenuItem, MenuCategory } from '../types/menu';
import { MenuItemCard } from './MenuItemCard';

interface MenuSectionProps {
  title: string;
  category: MenuCategory;
  items: MenuItem[];
  getQuantity: (itemId: string) => number;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  disabled?: boolean;
}

function SectionIcon({ category }: { category: MenuCategory }) {
  switch (category) {
    case 'vegetarian':
      return <Leaf size={16} className="section-icon section-icon--vegetarian" aria-hidden="true" />;
    case 'classic':
      return <Drumstick size={16} className="section-icon section-icon--meat" aria-hidden="true" />;
    case 'soup':
      return <Soup size={16} className="section-icon section-icon--soup" aria-hidden="true" />;
    case 'dessert':
      return <CakeSlice size={16} className="section-icon section-icon--dessert" aria-hidden="true" />;
  }
}

export function MenuSection({
  title,
  category,
  items,
  getQuantity,
  onIncrement,
  onDecrement,
  disabled = false,
}: MenuSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="menu-section" aria-labelledby={`section-${category}`}>
      <h2 id={`section-${category}`} className="menu-section__title">
        <SectionIcon category={category} />
        {title}
      </h2>
      <div className="menu-section__grid">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={getQuantity(item.id)}
            onIncrement={() => onIncrement(item.id)}
            onDecrement={() => onDecrement(item.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}
