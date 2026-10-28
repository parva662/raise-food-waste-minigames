import type { MenuItem } from '@/shared/menu/types';
import { FoodImage } from '@/products/lunch-declaration/components/FoodImage';
import { QuantityControl } from '@/products/lunch-declaration/components/QuantityControl';

interface SoupDessertPackagePanelProps {
  soup: MenuItem;
  dessert: MenuItem;
  packageQuantity: number;
  sectionActive: boolean;
  menuInteractive: boolean;
  onActivateSection: () => void;
  onAdjustPackage: (delta: number) => void;
}

export function SoupDessertPackagePanel({
  soup,
  dessert,
  packageQuantity,
  sectionActive,
  menuInteractive,
  onActivateSection,
  onAdjustPackage,
}: SoupDessertPackagePanelProps) {
  const selected = packageQuantity > 0;
  const maxQuantity = Math.min(soup.maxQuantity, dessert.maxQuantity);
  const canDecrement = menuInteractive && sectionActive;

  return (
    <div className="portion-food-grid portion-food-grid--single" aria-label="Soup + Dessert package">
      <div
        className={`portion-food-card portion-food-card--package${selected ? ' portion-food-card--selected' : ''}${!sectionActive ? ' portion-food-card--inactive-section' : ''}`}
      >
        <button
          type="button"
          className="portion-food-card__select"
          onClick={() => {
            if (!menuInteractive) return;
            onActivateSection();
          }}
          disabled={!menuInteractive}
          aria-pressed={selected || sectionActive}
          aria-label={`Select Soup + Dessert package: ${soup.name} and ${dessert.name}`}
        >
          <div className="portion-food-card__package-images">
            <FoodImage
              src={soup.imageDedicated ?? soup.image}
              placeholderSrc={soup.imagePlaceholder}
              alt=""
              category={soup.category}
              className="portion-food-card__image"
              fallbackClassName="portion-food-card__image-fallback"
              iconSize={20}
            />
            <FoodImage
              src={dessert.imageDedicated ?? dessert.image}
              placeholderSrc={dessert.imagePlaceholder}
              alt=""
              category={dessert.category}
              className="portion-food-card__image"
              fallbackClassName="portion-food-card__image-fallback"
              iconSize={20}
            />
          </div>
          <p className="portion-food-card__role">Soup + Dessert package</p>
          <h3 className="portion-food-card__name">
            {soup.name}
            <span className="portion-food-card__package-sep"> + </span>
            {dessert.name}
          </h3>
          <p className="portion-food-card__package-hint">One quantity sets both soup and dessert.</p>
        </button>
        <div className="portion-food-card__quantity">
          <QuantityControl
            quantity={packageQuantity}
            maxQuantity={maxQuantity}
            onIncrement={() => onAdjustPackage(1)}
            onDecrement={() => onAdjustPackage(-1)}
            incrementDisabled={!menuInteractive || packageQuantity >= maxQuantity}
            decrementDisabled={!canDecrement || packageQuantity <= 0}
            itemName="Soup + Dessert package"
            compact
          />
        </div>
      </div>
    </div>
  );
}
