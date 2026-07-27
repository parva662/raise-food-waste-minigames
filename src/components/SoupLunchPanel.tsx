import type { MenuItem } from '../types/menu';
import { PortionFoodCard } from './PortionFoodCard';

interface SoupLunchPanelProps {
  soup: MenuItem;
  dessert: MenuItem;
  soupQuantity: number;
  dessertQuantity: number;
  sectionActive: boolean;
  menuInteractive: boolean;
  onActivateSection: () => void;
  onAdjustSoup: (delta: number) => void;
  onAdjustDessert: (delta: number) => void;
}

export function SoupLunchPanel({
  soup,
  dessert,
  soupQuantity,
  dessertQuantity,
  sectionActive,
  menuInteractive,
  onActivateSection,
  onAdjustSoup,
  onAdjustDessert,
}: SoupLunchPanelProps) {
  return (
    <div className="portion-food-grid" aria-label="Soup lunch dishes">
      <PortionFoodCard
        item={soup}
        categoryLabel="Soup"
        quantity={soupQuantity}
        sectionActive={sectionActive}
        menuInteractive={menuInteractive}
        onActivateSection={onActivateSection}
        onIncrement={() => onAdjustSoup(1)}
        onDecrement={() => onAdjustSoup(-1)}
      />
      <PortionFoodCard
        item={dessert}
        categoryLabel="Dessert"
        quantity={dessertQuantity}
        sectionActive={sectionActive}
        menuInteractive={menuInteractive}
        onActivateSection={onActivateSection}
        onIncrement={() => onAdjustDessert(1)}
        onDecrement={() => onAdjustDessert(-1)}
      />
    </div>
  );
}
