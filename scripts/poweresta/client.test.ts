import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildAuthorizationHeaderValue,
  buildLoginRequestBody,
  extractLoginToken,
} from './auth.ts';
import { PowerestaClient } from './client.ts';
import {
  isPowerestaLiveNetworkEnabled,
  readPowerestaCredentialsFromEnv,
  redactSecretsForDiagnostics,
} from './config.ts';
import { PowerestaClientError } from './errors.ts';
import { createDisabledLiveTransport, createFetchTransport } from './http.ts';
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
import type { PowerestaHttpRequest, PowerestaHttpResponse, PowerestaTransport } from './types.ts';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

function jsonFixture(name: string): unknown {
  return JSON.parse(loadFixture(name)) as unknown;
}

function createRecordingTransport(
  handler: (request: PowerestaHttpRequest) => PowerestaHttpResponse | Promise<PowerestaHttpResponse>,
): { transport: PowerestaTransport; requests: PowerestaHttpRequest[] } {
  const requests: PowerestaHttpRequest[] = [];
  return {
    requests,
    transport: async (request) => {
      requests.push(request);
      return handler(request);
    },
  };
}

describe('PoweResta URL builders', () => {
  it('builds documented login and public menu URLs with encoding', () => {
    expect(buildLoginUrl()).toBe('https://publicapi.fi.poweresta.com/login/');
    expect(buildPublishedMenusUrl('Site A')).toBe(
      'https://publicapi.fi.poweresta.com/public/publicmenu/menus/Site%20A/',
    );
    expect(buildPublishedMenuMetadataUrl('Site A', 'Lunch & More')).toContain(
      'menu=Lunch+%26+More',
    );
    expect(buildPublishedMenuDatesUrl('Site', 'Menu', ['2026-11-03', '2026-11-04'])).toContain(
      'dates=2026-11-03%2C2026-11-04',
    );
    expect(buildRecipeDetailUrl('rec-1', 'lang-1')).toContain('_languageId=lang-1');
    expect(buildRecipeListUrl({ siteId: 'site-1', code: 'ABC' })).toContain('siteId=site-1');
    expect(buildLanguagesUrl()).toBe('https://publicapi.fi.poweresta.com/public/language/');
    expect(buildUnitOfMeasurementUrl('u1')).toContain('/unitofmeasurement/u1');
  });
});

describe('PoweResta authentication helpers', () => {
  it('builds login body and extracts token from documentation-derived success fixture', () => {
    const body = buildLoginRequestBody({
      tenant: ' example-tenant ',
      publicApiUserName: ' api-user ',
      password: 'secret',
    });
    expect(body).toEqual({
      tenant: 'example-tenant',
      publicApiUserName: 'api-user',
      password: 'secret',
    });
    expect(extractLoginToken(jsonFixture('login-success.json'))).toBe(
      'documentation.derived.jwt.example.token',
    );
  });

  it('rejects Bearer-prefixed authorization values', () => {
    expect(() => buildAuthorizationHeaderValue('Bearer abc')).toThrow(PowerestaClientError);
  });
});

describe('PoweResta offline client', () => {
  it('logs in and sends raw JWT authorization without cookies or Bearer prefix', async () => {
    const { transport, requests } = createRecordingTransport(async (request) => {
      if (request.method === 'POST') {
        return { status: 200, headers: {}, bodyText: loadFixture('login-success.json') };
      }
      return { status: 200, headers: {}, bodyText: loadFixture('published-menus-discovery.json') };
    });

    const client = PowerestaClient.createOffline(transport);
    const token = await client.login({
      tenant: 'tenant',
      publicApiUserName: 'user',
      password: 'password',
    });
    expect(token).toBe('documentation.derived.jwt.example.token');

    await client.listPublishedMenus('ExampleSite');
    expect(requests[0]?.url).toBe('https://publicapi.fi.poweresta.com/login/');
    expect(requests[0]?.omitCredentials).toBe(true);
    expect(requests[1]?.headers.authorization).toBe('documentation.derived.jwt.example.token');
    expect(requests[1]?.headers.authorization.toLowerCase().startsWith('bearer ')).toBe(false);
    expect(requests[1]?.omitCredentials).toBe(true);
  });

  it('maps HTTP 401 login failure from documentation-derived fixture', async () => {
    const { transport } = createRecordingTransport(async () => ({
      status: 401,
      headers: {},
      bodyText: loadFixture('login-failure.json'),
    }));
    const client = PowerestaClient.createOffline(transport);
    await expect(
      client.login({ tenant: 't', publicApiUserName: 'u', password: 'p' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
  });

  it('parses documentation-derived menu, recipe, language and unit fixtures', async () => {
    const { transport } = createRecordingTransport(async (request) => {
      if (request.url.includes('/login/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('login-success.json') };
      }
      if (request.url.includes('/publicmenu/menus/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('published-menus-discovery.json') };
      }
      if (request.url.includes('/publicmenu/menu/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('published-menu-metadata.json') };
      }
      if (request.url.includes('/publicmenu/dates/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('dated-menu.json') };
      }
      if (request.url.includes('/language/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('languages.json') };
      }
      if (request.url.includes('/unitofmeasurement/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('unit-of-measurement.json') };
      }
      if (request.url.includes('/recipe/') && request.url.includes('_languageId=')) {
        return { status: 200, headers: {}, bodyText: loadFixture('recipe-detail.json') };
      }
      if (request.url.includes('/recipe/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('recipe-detail.json') };
      }
      return { status: 500, headers: {}, bodyText: '{}' };
    });

    const client = PowerestaClient.createOffline(transport);
    await client.login({ tenant: 't', publicApiUserName: 'u', password: 'p' });

    const discovery = await client.listPublishedMenus('Site');
    expect(discovery[0]?.publishUrl).toBe('example-published-menu');

    const metadata = await client.getPublishedMenuMetadata('Site', 'Menu');
    expect(metadata.menuId).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');

    const dated = await client.getPublishedMenusByDates('Site', 'Menu', ['2026-11-03']);
    expect(dated[0]?.date).toBe('2026-11-03');
    expect(dated[0]?.mealOptions?.[0]?.rows?.[0]?.names?.[0]?.name).toBe('Example dish A');
    for (const row of dated[0]?.mealOptions?.[0]?.rows ?? []) {
      expect(Object.prototype.hasOwnProperty.call(row, 'recipeId')).toBe(false);
    }

    const languages = await client.listLanguages();
    expect(languages.map((entry) => entry.code)).toEqual(['en', 'fi']);

    const unit = await client.getUnitOfMeasurement('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    expect(unit.code).toBe('g');

    const recipes = await client.listRecipes({ siteId: 'site' });
    expect(recipes[0]?.code).toBe('DOC-RECIPE-001');

    const detail = await client.getRecipeDetail('rec', 'lang');
    expect(detail.rows?.[0]?.lossPreparation).toBe('0');
    expect(detail.rows?.[0]?.quantity).toBe('1000');
  });

  it('rejects malformed JSON and unsupported response wrappers', async () => {
    const { transport } = createRecordingTransport(async (request) => {
      if (request.url.includes('/login/')) {
        return { status: 200, headers: {}, bodyText: loadFixture('login-success.json') };
      }
      return { status: 200, headers: {}, bodyText: loadFixture('malformed.json') };
    });
    const client = PowerestaClient.createOffline(transport);
    await client.login({ tenant: 't', publicApiUserName: 'u', password: 'p' });
    await expect(client.listLanguages()).rejects.toMatchObject({ code: 'MALFORMED_JSON' });
  });

  it('keeps live network disabled by default', async () => {
    expect(isPowerestaLiveNetworkEnabled({})).toBe(false);
    const client = PowerestaClient.createOffline(createDisabledLiveTransport());
    await expect(
      client.login({ tenant: 't', publicApiUserName: 'u', password: 'p' }),
    ).rejects.toMatchObject({ code: 'LIVE_NETWORK_DISABLED' });

    const fetchTransport = createFetchTransport({ POWERESTA_LIVE_NETWORK: undefined });
    await expect(
      fetchTransport({
        url: 'https://example.invalid',
        method: 'GET',
        headers: {},
        omitCredentials: true,
      }),
    ).rejects.toMatchObject({ code: 'LIVE_NETWORK_DISABLED' });
  });

  it('reads credentials from env without exposing secrets in diagnostics helpers', () => {
    expect(
      readPowerestaCredentialsFromEnv({
        POWERESTA_TENANT: 'tenant',
        POWERESTA_PUBLIC_API_USERNAME: 'user',
        POWERESTA_PASSWORD: 'password',
      }),
    ).toEqual({
      tenant: 'tenant',
      publicApiUserName: 'user',
      password: 'password',
      siteName: undefined,
      menuName: undefined,
    });
    expect(readPowerestaCredentialsFromEnv({})).toBeNull();
    expect(
      redactSecretsForDiagnostics({
        password: 'secret',
        authorization: 'documentation.derived.jwt.example.token.value',
        nested: { token: 'abc' },
      }),
    ).toEqual({
      password: '[REDACTED]',
      authorization: '[REDACTED]',
      nested: { token: '[REDACTED]' },
    });
  });
});
