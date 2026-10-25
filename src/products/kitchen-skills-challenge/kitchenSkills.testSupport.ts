import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

type User = ReturnType<typeof userEvent.setup>;

/** Select grams then type, matching the student path of overriding the kg default. */
export async function typeMassGrams(user: User, testId: string, value: string) {
  await user.click(screen.getByTestId(`${testId}-unit-g`));
  await user.type(screen.getByTestId(testId), value);
}

export async function recordRescueDecision(user: User, grams: string, destination: string) {
  await typeMassGrams(user, 'kitchen-day-reusable-waste', grams);
  await user.type(screen.getByTestId('kitchen-day-reuse-destination'), destination);
  await user.click(screen.getByTestId('kitchen-day-save-rescue'));
}

export async function recordAnkanrintaPortion(user: User) {
  const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
  await user.click(recipeInput);
  await user.type(recipeInput, 'Ankanrinta FLOW');
  await user.click(screen.getByRole('option', { name: 'Ankanrinta FLOW' }));
  await typeMassGrams(user, 'kitchen-day-actual-ankka-rintafilee', '11250');
  await typeMassGrams(user, 'kitchen-day-actual-rosmariini-tuore-100g', '450');
  await typeMassGrams(user, 'kitchen-day-actual-berner-merisuola-keskikarkea-25', '900');
  await typeMassGrams(user, 'kitchen-day-actual-meira-luomu-mustapippuri', '900');
  await typeMassGrams(user, 'kitchen-day-final-recipe-weight', '13500');
  await user.click(screen.getByTestId('kitchen-day-submit-portion'));
}

export async function recordFlowMustamakkaraPortion(user: User) {
  const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
  await user.click(recipeInput);
  await user.type(recipeInput, 'FLOW mustamakkara');
  await user.click(screen.getByRole('option', { name: 'FLOW mustamakkara' }));
  await typeMassGrams(user, 'kitchen-day-actual-tapola-gluteeniton', '1974');
  await typeMassGrams(user, 'kitchen-day-actual-kaskein-750-g-puolukka-pakaste', '1316');
  await typeMassGrams(user, 'kitchen-day-actual-deliverde-500g-rucola', '263');
  await typeMassGrams(user, 'kitchen-day-actual-elonen-iso-ruisvuoka-1000g', '1316');
  await typeMassGrams(user, 'kitchen-day-actual-coop-kidesokeri-1-kg', '132');
  await typeMassGrams(user, 'kitchen-day-final-recipe-weight', '5000');
  await user.click(screen.getByTestId('kitchen-day-submit-portion'));
}

export async function recordBanaanismoothiePortion(user: User) {
  const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
  await user.click(recipeInput);
  await user.type(recipeInput, 'Banaanismoothie');
  await user.click(screen.getByRole('option', { name: 'Banaanismoothie L, G' }));
  await typeMassGrams(user, 'kitchen-day-actual-banaani-banaani-1kg-peru-1lk', '2000');
  await typeMassGrams(user, 'kitchen-day-actual-hunaja-juokseva-hunajainen', '40');
  await typeMassGrams(user, 'kitchen-day-actual-piima-rasvaton-valio-luomutm', '3000');
  await typeMassGrams(user, 'kitchen-day-final-recipe-weight', '5040');
  await user.click(screen.getByTestId('kitchen-day-submit-portion'));
}

export async function recordHedelmatPortion(user: User) {
  const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
  await user.click(recipeInput);
  await user.type(recipeInput, 'Hedelmät M,G');
  await user.click(screen.getByRole('option', { name: 'Hedelmät M,G' }));
  await typeMassGrams(user, 'kitchen-day-actual-banaani', '1500');
  await typeMassGrams(user, 'kitchen-day-actual-omena', '1200');
  await typeMassGrams(user, 'kitchen-day-actual-viinirypale-tumma-kiveton', '1000');
  await typeMassGrams(user, 'kitchen-day-final-recipe-weight', '3700');
  await user.click(screen.getByTestId('kitchen-day-submit-portion'));
}

export async function selectTrimIngredient(user: User, query: string, optionName: string) {
  const input = screen.getByTestId('kitchen-day-ingredient-name');
  await user.click(input);
  if (query) await user.type(input, query);
  await user.click(screen.getByRole('option', { name: optionName }));
}

export async function completeTrimAfterIngredient(user: User, actualWaste = '450') {
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await typeMassGrams(user, 'kitchen-day-starting-weight', '5000');
  await user.click(screen.getByTestId('kitchen-day-weight-continue'));
  await user.click(screen.getByTestId('kitchen-day-technique-trimming'));
  await user.click(screen.getByTestId('kitchen-day-technique-continue'));
  await typeMassGrams(user, 'kitchen-day-estimated-waste', '600');
  await user.click(screen.getByTestId('kitchen-day-estimate-continue'));
  await user.click(screen.getByTestId('kitchen-day-start-preparation'));
  await user.click(screen.getByTestId('kitchen-day-finish-preparation'));
  await user.click(screen.getByTestId('kitchen-day-timer-continue'));
  await typeMassGrams(user, 'kitchen-day-actual-waste', actualWaste);
  await user.click(screen.getByTestId('kitchen-day-submit-trim'));
}

export async function recordBanaaniTrim(user: User, actualWaste = '450') {
  await selectTrimIngredient(user, 'Banaani', 'Banaani');
  await completeTrimAfterIngredient(user, actualWaste);
}

export async function recordOmenaTrim(user: User, actualWaste = '200') {
  await selectTrimIngredient(user, 'Omena', 'Omena');
  await completeTrimAfterIngredient(user, actualWaste);
}
