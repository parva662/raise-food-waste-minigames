import { PowerestaClientError } from './errors.ts';
import type { PowerestaCredentialsFromEnv } from './types.ts';

/** Live HTTP to PoweResta stays off unless this env flag is exactly `"1"`. */
export function isPowerestaLiveNetworkEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.POWERESTA_LIVE_NETWORK === '1';
}

/**
 * Read credentials from environment variables only.
 * Never logs secret values. Returns null when incomplete.
 */
export function readPowerestaCredentialsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): PowerestaCredentialsFromEnv | null {
  const tenant = env.POWERESTA_TENANT?.trim();
  const publicApiUserName = env.POWERESTA_PUBLIC_API_USERNAME?.trim();
  const password = env.POWERESTA_PASSWORD?.trim();
  if (!tenant || !publicApiUserName || !password) {
    return null;
  }
  return {
    tenant,
    publicApiUserName,
    password,
    siteName: env.POWERESTA_SITE_NAME?.trim() || undefined,
    menuName: env.POWERESTA_MENU_NAME?.trim() || undefined,
  };
}

export function requirePowerestaCredentialsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): PowerestaCredentialsFromEnv {
  const credentials = readPowerestaCredentialsFromEnv(env);
  if (!credentials) {
    throw new PowerestaClientError(
      'Missing POWERESTA_TENANT, POWERESTA_PUBLIC_API_USERNAME, or POWERESTA_PASSWORD.',
      'MISSING_CREDENTIALS',
    );
  }
  return credentials;
}

/** Redact secrets from arbitrary objects before any diagnostic output. */
export function redactSecretsForDiagnostics(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > 24 && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(value)) {
      return '[REDACTED_JWT]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactSecretsForDiagnostics);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (/password|token|authorization|secret|credential/i.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactSecretsForDiagnostics(nested);
      }
    }
    return out;
  }
  return value;
}
