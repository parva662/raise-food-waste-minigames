/**
 * PoweResta public API types derived from documentation fixtures.
 * These are documentation-shaped, not verified live response contracts.
 */

export const POWERESTA_API_ORIGIN = 'https://publicapi.fi.poweresta.com';
export const POWERESTA_PUBLIC_BASE = `${POWERESTA_API_ORIGIN}/public`;
export const POWERESTA_LOGIN_PATH = '/login/';

export type PowerestaLoginRequest = {
  tenant: string;
  publicApiUserName: string;
  password: string;
};

export type PowerestaLoginSuccess = {
  token: string;
};

export type PowerestaHttpMethod = 'GET' | 'POST';

export type PowerestaHttpRequest = {
  url: string;
  method: PowerestaHttpMethod;
  headers: Record<string, string>;
  body?: string;
  /** When true, the transport must not attach cookies from a prior login. */
  omitCredentials: true;
};

export type PowerestaHttpResponse = {
  status: number;
  headers: Record<string, string>;
  bodyText: string;
};

export type PowerestaTransport = (request: PowerestaHttpRequest) => Promise<PowerestaHttpResponse>;

export type PowerestaClientConfig = {
  origin?: string;
  transport: PowerestaTransport;
  /**
   * Live network remains off unless both this flag and POWERESTA_LIVE_NETWORK=1 are set.
   * Offline tests inject a fake transport and leave this false.
   */
  allowLiveNetwork?: boolean;
};

export type LocalizedName = {
  language?: string;
  languageId?: string;
  name?: string;
  id?: string;
  type?: string;
};

export type PublishedMenuDiscoveryItem = {
  publishUrl?: string;
  menuNames?: LocalizedName[];
};

export type PublishedMenuMetadata = {
  menuId?: string;
  siteId?: string;
  version?: string;
  menuNames?: Array<{ language?: string; name?: string }>;
  menuInformation?: Array<{ language?: string; information?: string }>;
};

export type DatedMenuRow = {
  names?: Array<{ language?: string; name?: string }>;
  allergens?: Array<{ language?: string; allergens?: string[] }>;
  diets?: Array<{ language?: string; diets?: string[]; dietShorts?: string[] }>;
  ingredients?: Array<{ language?: string; ingredients?: string }>;
  publicInfos?: Array<{ language?: string; publicInfos?: string }>;
  co2Value?: unknown[];
  nutritiveItems?: unknown;
};

export type DatedMenuMealOption = {
  names?: Array<{ language?: string; name?: string }>;
  prices?: unknown[];
  rows?: DatedMenuRow[];
};

export type DatedPublishedMenu = {
  menuId?: string;
  siteId?: string;
  date?: string;
  version?: number;
  mealOptions?: DatedMenuMealOption[];
};

export type PowerestaLanguage = {
  id?: string;
  code?: string;
  name?: string;
};

export type PowerestaUnitOfMeasurement = {
  id?: string;
  code?: string;
  type?: string;
  ratio?: number;
  quantityType?: string;
  names?: LocalizedName[];
};

export type PowerestaRecipeRow = {
  id?: string;
  itemId?: string;
  tradeItemId?: string;
  subRecipeId?: string;
  order?: number;
  type?: number;
  quantity?: string;
  quantityUnitOfMeasurementId?: string;
  lossPreparation?: string;
  translated?: Array<{
    id?: string;
    languageId?: string;
    info?: string;
    header?: string;
    method?: string;
  }>;
  itemNames?: LocalizedName[];
  tradeItemNames?: LocalizedName[];
  subRecipeNames?: LocalizedName[];
  imageId?: string;
  imageType?: number | string;
  imageIdFullUrl?: string;
  imageIdUrl?: string;
  isFoodstuff?: boolean;
  usedTradeItemId?: string;
  [key: string]: unknown;
};

export type PowerestaRecipeDetail = {
  id?: string;
  siteId?: string;
  workspaceId?: string;
  code?: string;
  sizeBatch?: number;
  numberBatch?: number;
  sizePortion?: number;
  numberPortion?: number;
  lossServing?: number;
  lossCooking?: number;
  names?: LocalizedName[];
  rows?: PowerestaRecipeRow[];
  [key: string]: unknown;
};

export type PowerestaRecipeListFilters = {
  siteId?: string;
  code?: string;
  sizeBatch?: number;
  numberBatch?: number;
  sizePortion?: number;
  numberPortion?: number;
  lossServing?: number;
  lossCooking?: number;
  createdAt?: string;
  createdAt_gte?: string;
  createdAt_lte?: string;
  updatedAt?: string;
  updatedAt_gte?: string;
  updatedAt_lte?: string;
  _embed?: string;
};

export type PowerestaCredentialsFromEnv = {
  tenant: string;
  publicApiUserName: string;
  password: string;
  siteName?: string;
  menuName?: string;
};
