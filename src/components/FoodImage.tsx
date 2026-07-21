import { useState } from 'react';
import { Leaf, Drumstick, Soup, CakeSlice } from 'lucide-react';
import type { MenuCategory } from '../types/menu';

interface FoodImageProps {
  src: string;
  alt: string;
  category: MenuCategory;
  className?: string;
  fallbackClassName?: string;
  iconSize?: number;
}

function FallbackIcon({ category, size }: { category: MenuCategory; size: number }) {
  switch (category) {
    case 'vegetarian':
      return <Leaf size={size} className="food-image-fallback__icon food-image-fallback__icon--vegetarian" aria-hidden="true" />;
    case 'classic':
      return <Drumstick size={size} className="food-image-fallback__icon food-image-fallback__icon--meat" aria-hidden="true" />;
    case 'soup':
      return <Soup size={size} className="food-image-fallback__icon food-image-fallback__icon--soup" aria-hidden="true" />;
    case 'dessert':
      return <CakeSlice size={size} className="food-image-fallback__icon food-image-fallback__icon--dessert" aria-hidden="true" />;
  }
}

export function FoodImage({
  src,
  alt,
  category,
  className = '',
  fallbackClassName = '',
  iconSize = 24,
}: FoodImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className={`food-image-fallback ${fallbackClassName}`} aria-hidden={alt === ''}>
        <FallbackIcon category={category} size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}
