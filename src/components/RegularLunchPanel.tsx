import type { MenuItem } from '../types/menu';
import { PortionFoodCard } from './PortionFoodCard';

interface RegularLunchPanelProps {
  main: MenuItem;
  vegetarian: MenuItem;
  mainQuantity: number;
  vegetarianQuantity: number;
  sectionActive: boolean;
  menuInteractive: boolean;
  onActivateSection: () => void;
  onAdjustMain: (delta: number) => void;
  onAdjustVegetarian: (delta: number) => void;
}

export function RegularLunchPanel({
  main,
  vegetarian,
  mainQuantity,
  vegetarianQuantity,
  sectionActive,
  menuInteractive,
  onActivateSection,
  onAdjustMain,
  onAdjustVegetarian,
}: RegularLunchPanelProps) {
  return (
    <div className="portion-food-grid" aria-label="Regular lunch dishes">
      <PortionFoodCard
        item={main}
        categoryLabel="Main dish"
        quantity={mainQuantity}
        sectionActive={sectionActive}
        menuInteractive={menuInteractive}
        onActivateSection={onActivateSection}
        onIncrement={() => onAdjustMain(1)}
        onDecrement={() => onAdjustMain(-1)}
      />
      <PortionFoodCard
        item={vegetarian}
        categoryLabel="Vegetarian"
        quantity={vegetarianQuantity}
        sectionActive={sectionActive}
        menuInteractive={menuInteractive}
        onActivateSection={onActivateSection}
        onIncrement={() => onAdjustVegetarian(1)}
        onDecrement={() => onAdjustVegetarian(-1)}
      />
    </div>
  );
}
