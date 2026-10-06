import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

type User = ReturnType<typeof userEvent.setup>;

export async function recordAnkanrintaPortion(user: User) {
  const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
  await user.click(recipeInput);
  await user.type(recipeInput, 'Ankanrinta FLOW');
  await user.click(screen.getByRole('option', { name: 'Ankanrinta FLOW' }));
  await user.type(screen.getByTestId('kitchen-day-actual-ankka-rintafilee'), '11250');
  await user.type(screen.getByTestId('kitchen-day-actual-rosmariini-tuore-100g'), '450');
  await user.type(screen.getByTestId('kitchen-day-actual-berner-merisuola-keskikarkea-25'), '900');
  await user.type(screen.getByTestId('kitchen-day-actual-meira-luomu-mustapippuri'), '900');
  await user.type(screen.getByTestId('kitchen-day-final-recipe-weight'), '13500');
  await user.click(screen.getByTestId('kitchen-day-submit-portion'));
}

export async function selectTrimIngredient(user: User, ingredientId: string) {
  await user.selectOptions(screen.getByTestId('kitchen-day-ingredient-name'), ingredientId);
}

export async function completeTrimAfterIngredient(
  user: User,
  options?: { technique?: string; submit?: 'save' | 'another' },
) {
  const technique = options?.technique ?? 'trimming';
  const submit = options?.submit ?? 'save';
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.type(screen.getByTestId('kitchen-day-starting-weight'), '5000');
  await user.click(screen.getByTestId('kitchen-day-weight-continue'));
  await user.click(screen.getByTestId(`kitchen-day-technique-${technique}`));
  await user.click(screen.getByTestId('kitchen-day-technique-continue'));
  await user.type(screen.getByTestId('kitchen-day-estimated-waste'), '600');
  await user.click(screen.getByTestId('kitchen-day-estimate-continue'));
  await user.click(screen.getByTestId('kitchen-day-start-preparation'));
  await user.click(screen.getByTestId('kitchen-day-finish-preparation'));
  await user.click(screen.getByTestId('kitchen-day-timer-continue'));
  await user.type(screen.getByTestId('kitchen-day-actual-waste'), '450');
  if (submit === 'another') {
    await user.click(screen.getByTestId('kitchen-day-add-more-ingredients'));
    return;
  }
  await user.click(screen.getByTestId('kitchen-day-submit-trim'));
}

export async function recordDuckBreastTrim(user: User, submit: 'save' | 'another' = 'save') {
  await selectTrimIngredient(user, 'ankka-rintafilee');
  await completeTrimAfterIngredient(user, { submit });
}
