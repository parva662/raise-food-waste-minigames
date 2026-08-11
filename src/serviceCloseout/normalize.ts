import type { DailyMealSlots } from '../types/mealChoice';
import type { PortionWeightProvider } from './portionWeight/types';
import {
  CLOSEOUT_CATEGORY_KEYS,
  type CloseoutCategoryKey,
  type ServiceCloseout,
  type ServiceCloseoutDraft,
  isCloseoutDraftComplete,
} from './types';

export function normalizeServiceCloseout(
  draft: ServiceCloseoutDraft,
  targetDate: string,
  slots: DailyMealSlots,
  portionWeights: PortionWeightProvider,
  submittedAt: string,
): ServiceCloseout {
  if (!isCloseoutDraftComplete(draft)) {
    throw new Error('Service closeout draft is incomplete');
  }

  const slotByCategory: Record<CloseoutCategoryKey, { id: string }> = {
    main: slots.main,
    vegetarian: slots.vegetarian,
    soup: slots.soup,
    dessert: slots.dessert,
  };

  const categories = Object.fromEntries(
    CLOSEOUT_CATEGORY_KEYS.map((key) => {
      const itemId = slotByCategory[key].id;
      const portionWeightGrams = portionWeights.getPortionWeightGrams(itemId, key);
      return [
        key,
        {
          itemId,
          preparedQuantity: draft[key].preparedQuantity as number,
          portionWeightGrams,
          overproductionGrams: draft[key].overproductionGrams as number,
        },
      ];
    }),
  ) as Pick<ServiceCloseout, CloseoutCategoryKey>;

  return {
    targetDate,
    headChefUserId: draft.headChefUserId as string,
    actualCustomers: draft.actualCustomers as number,
    ...categories,
    submittedAt,
  };
}
