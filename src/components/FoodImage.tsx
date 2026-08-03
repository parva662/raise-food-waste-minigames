import { useState } from 'react';
import { Leaf, Drumstick, Soup, CakeSlice } from 'lucide-react';
import type { MenuCategory } from '../types/menu';

interface FoodImageProps {
  src: string;
  placeholderSrc?: string;
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

type ImageStage = 'primary' | 'placeholder' | 'icon';

export function FoodImage({
  src,
  placeholderSrc,
  alt,
  category,
  className = '',
  fallbackClassName = '',
  iconSize = 24,
}: FoodImageProps) {
  const [stage, setStage] = useState<ImageStage>('primary');

  if (stage === 'icon') {
    return (
      <div className={`food-image-fallback ${fallbackClassName}`} aria-hidden={alt === ''}>
        <FallbackIcon category={category} size={iconSize} />
      </div>
    );
  }

  const activeSrc = stage === 'placeholder' && placeholderSrc ? placeholderSrc : src;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading="lazy"
      data-placeholder={stage === 'placeholder' ? 'true' : undefined}
      onError={() => {
        setStage((current) => {
          if (current === 'primary' && placeholderSrc && placeholderSrc !== src) {
            return 'placeholder';
          }
          return 'icon';
        });
      }}
    />
  );
}
