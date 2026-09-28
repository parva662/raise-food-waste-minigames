export { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
export { useGameBusEmbed } from '@/platform/gamebus/useGameBusEmbed';
export {
  tryPostBuiltActivity,
  resetGameBusBridgeForTests,
  ingestTaskForTests,
  ingestInputCollectionsForTests,
  getGameBusInputCollections,
  getGameBusTask,
  startGameBusHandshake,
  hasGameBusPostedActivity,
  hasGameBusPostedKey,
  isGameBusSubmissionInFlight,
} from '@/platform/gamebus/bridge';
export {
  getInputCollectionKeys,
  getRawChefForecastsInput,
  getRawKitchenGroupActivitiesInput,
  getRawAuthenticatedMeInput,
  getAuthenticatedGameBusUser,
  SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY,
  SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
  SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY,
  SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY,
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
} from '@/platform/gamebus/inputCollections';
export { parseGameBusAuthenticatedUser, type GameBusAuthenticatedUser } from '@/platform/gamebus/authenticatedUser';
export type {
  ActivityMessage,
  TaskData,
  IframeReadyMessage,
  GameBusInputCollectionsPayload,
  InputCollectionsMessage,
} from '@/platform/gamebus/types';
