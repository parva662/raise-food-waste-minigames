import { Leaf, Drumstick, Soup, CakeSlice } from 'lucide-react';

export function CategoryLegend() {
  return (
    <div className="category-legend" aria-label="Menu category legend">
      <span className="category-legend__item">
        <Leaf size={14} className="category-legend__icon category-legend__icon--vegetarian" aria-hidden="true" />
        Vegetarian
      </span>
      <span className="category-legend__item">
        <Drumstick size={14} className="category-legend__icon category-legend__icon--meat" aria-hidden="true" />
        Contains meat
      </span>
      <span className="category-legend__item">
        <Soup size={14} className="category-legend__icon category-legend__icon--soup" aria-hidden="true" />
        Soup
      </span>
      <span className="category-legend__item">
        <CakeSlice size={14} className="category-legend__icon category-legend__icon--dessert" aria-hidden="true" />
        Dessert
      </span>
    </div>
  );
}
