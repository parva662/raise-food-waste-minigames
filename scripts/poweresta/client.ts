import { extractLoginToken, buildAuthorizationHeaderValue, buildLoginRequestBody } from './auth.ts';
import { PowerestaClientError } from './errors.ts';
import { createDisabledLiveTransport, parseJsonBody } from './http.ts';
import {
  assertOkStatus,
  parseDatedPublishedMenus,
  parseLanguages,
  parsePublishedMenuDiscovery,
  parsePublishedMenuMetadata,
  parseRecipeDetail,
  parseRecipeList,
  parseUnitOfMeasurement,
} from './parse.ts';
import {
  POWERESTA_API_ORIGIN,
  type DatedPublishedMenu,
  type PowerestaClientConfig,
  type PowerestaHttpRequest,
  type PowerestaLanguage,
  type PowerestaLoginRequest,
  type PowerestaRecipeDetail,
  type PowerestaRecipeListFilters,
  type PowerestaTransport,
  type PowerestaUnitOfMeasurement,
  type PublishedMenuDiscoveryItem,
  type PublishedMenuMetadata,
} from './types.ts';
import {
  buildLanguagesUrl,
  buildLoginUrl,
  buildPublishedMenuDatesUrl,
  buildPublishedMenuMetadataUrl,
  buildPublishedMenusUrl,
  buildRecipeDetailUrl,
  buildRecipeListUrl,
  buildUnitOfMeasurementUrl,
} from './urls.ts';

export class PowerestaClient {
  private readonly origin: string;
  private readonly transport: PowerestaTransport;
  private token: string | null = null;

  constructor(config: PowerestaClientConfig) {
    this.origin = (config.origin ?? POWERESTA_API_ORIGIN).replace(/\/$/, '');
    this.transport = config.transport;
    if (config.allowLiveNetwork) {
      // Intentionally unused beyond documentation: live access is gated inside transports.
    }
  }

  static createOffline(transport: PowerestaTransport = createDisabledLiveTransport()): PowerestaClient {
    return new PowerestaClient({ transport, allowLiveNetwork: false });
  }

  getAuthorizationHeader(): string | null {
    return this.token;
  }

  clearSession(): void {
    this.token = null;
  }

  async login(credentials: PowerestaLoginRequest): Promise<string> {
    const body = buildLoginRequestBody(credentials);
    const request: PowerestaHttpRequest = {
      url: buildLoginUrl(this.origin),
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      omitCredentials: true,
    };
    const response = await this.transport(request);
    if (response.status === 401) {
      throw new PowerestaClientError('PoweResta login failed.', 'UNAUTHORIZED', 401);
    }
    if (response.status < 200 || response.status >= 300) {
      throw new PowerestaClientError(
        `PoweResta login failed with HTTP ${response.status}.`,
        'LOGIN_HTTP_ERROR',
        response.status,
      );
    }
    const payload = parseJsonBody(response.bodyText, 'Login');
    const token = extractLoginToken(payload);
    this.token = buildAuthorizationHeaderValue(token);
    return this.token;
  }

  async listPublishedMenus(siteName: string): Promise<PublishedMenuDiscoveryItem[]> {
    const payload = await this.authorizedGetJson(buildPublishedMenusUrl(siteName), 'Published menu discovery');
    return parsePublishedMenuDiscovery(payload);
  }

  async getPublishedMenuMetadata(siteName: string, menuName: string): Promise<PublishedMenuMetadata> {
    const payload = await this.authorizedGetJson(
      buildPublishedMenuMetadataUrl(siteName, menuName),
      'Published menu metadata',
    );
    return parsePublishedMenuMetadata(payload);
  }

  async getPublishedMenusByDates(
    siteName: string,
    menuName: string,
    dates: readonly string[],
  ): Promise<DatedPublishedMenu[]> {
    if (dates.length === 0) {
      throw new PowerestaClientError('At least one date is required.', 'VALIDATION_FAILED');
    }
    const payload = await this.authorizedGetJson(
      buildPublishedMenuDatesUrl(siteName, menuName, dates),
      'Published menus by date',
    );
    return parseDatedPublishedMenus(payload);
  }

  async listLanguages(): Promise<PowerestaLanguage[]> {
    const payload = await this.authorizedGetJson(buildLanguagesUrl(), 'Languages');
    return parseLanguages(payload);
  }

  async getUnitOfMeasurement(id: string): Promise<PowerestaUnitOfMeasurement> {
    const payload = await this.authorizedGetJson(buildUnitOfMeasurementUrl(id), 'Unit of measurement');
    return parseUnitOfMeasurement(payload);
  }

  async listRecipes(filters: PowerestaRecipeListFilters = {}): Promise<PowerestaRecipeDetail[]> {
    const payload = await this.authorizedGetJson(buildRecipeListUrl(filters), 'Recipe list');
    return parseRecipeList(payload);
  }

  async getRecipeDetail(id: string, languageId: string): Promise<PowerestaRecipeDetail> {
    const payload = await this.authorizedGetJson(
      buildRecipeDetailUrl(id, languageId),
      'Recipe detail',
    );
    return parseRecipeDetail(payload);
  }

  private async authorizedGetJson(url: string, context: string): Promise<unknown> {
    if (!this.token) {
      throw new PowerestaClientError('Call login() before authorized requests.', 'MISSING_TOKEN');
    }
    const request: PowerestaHttpRequest = {
      url,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        authorization: this.token,
      },
      omitCredentials: true,
    };
    const response = await this.transport(request);
    assertOkStatus(response.status, context);
    return parseJsonBody(response.bodyText, context);
  }
}
