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

export async function recordHedelmatPortion(user: User) {
  const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
  await user.click(recipeInput);
  await user.type(recipeInput, 'Hedelmät M,G');
  await user.click(screen.getByRole('option', { name: 'Hedelmät M,G' }));
  await user.type(screen.getByTestId('kitchen-day-actual-banaani'), '1500');
  await user.type(screen.getByTestId('kitchen-day-actual-omena'), '1200');
  await user.type(screen.getByTestId('kitchen-day-actual-viinirypale-tumma-kiveton'), '1000');
  await user.type(screen.getByTestId('kitchen-day-final-recipe-weight'), '3700');
  await user.click(screen.getByTestId('kitchen-day-submit-portion'));
}

export async function selectTrimIngredient(user: User, query: string, optionName: string) {
  const input = screen.getByTestId('kitchen-day-ingredient-name');
  await user.click(input);
  if (query) await user.type(input, query);
  await user.click(screen.getByRole('option', { name: optionName }));
}

export async function completeTrimAfterIngredient(user: User) {
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.type(screen.getByTestId('kitchen-day-starting-weight'), '5000');
  await user.click(screen.getByTestId('kitchen-day-weight-continue'));
  await user.click(screen.getByTestId('kitchen-day-technique-trimming'));
  await user.click(screen.getByTestId('kitchen-day-technique-continue'));
  await user.type(screen.getByTestId('kitchen-day-estimated-waste'), '600');
  await user.click(screen.getByTestId('kitchen-day-estimate-continue'));
  await user.click(screen.getByTestId('kitchen-day-start-preparation'));
  await user.click(screen.getByTestId('kitchen-day-finish-preparation'));
  await user.click(screen.getByTestId('kitchen-day-timer-continue'));
  await user.type(screen.getByTestId('kitchen-day-actual-waste'), '450');
  await user.click(screen.getByTestId('kitchen-day-submit-trim'));
}

export async function recordBanaaniTrim(user: User) {
  await selectTrimIngredient(user, 'Banaani', 'Banaani');
  await completeTrimAfterIngredient(user);
}
