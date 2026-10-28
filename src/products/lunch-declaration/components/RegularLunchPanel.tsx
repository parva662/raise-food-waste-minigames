import type { MenuItem } from '@/shared/menu/types';
import { PortionFoodCard } from '@/products/lunch-declaration/components/PortionFoodCard';

interface RegularLunchPanelProps {
  item: MenuItem;
  categoryLabel: string;
  quantity: number;
  sectionActive: boolean;
  menuInteractive: boolean;
  onActivateSection: () => void;
  onAdjust: (delta: number) => void;
  ariaLabel?: string;
}

/** Single exclusive dish option (Classic or Vegetarian). */
export function RegularLunchPanel({
  item,
  categoryLabel,
  quantity,
  sectionActive,
  menuInteractive,
  onActivateSection,
  onAdjust,
  ariaLabel,
}: RegularLunchPanelProps) {
  return (
    <div className="portion-food-grid portion-food-grid--single" aria-label={ariaLabel ?? categoryLabel}>
      <PortionFoodCard
        item={item}
        categoryLabel={categoryLabel}
        quantity={quantity}
        sectionActive={sectionActive}
        menuInteractive={menuInteractive}
        onActivateSection={onActivateSection}
        onIncrement={() => onAdjust(1)}
        onDecrement={() => onAdjust(-1)}
      />
    </div>
  );
}
