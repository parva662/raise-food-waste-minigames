import { PowerestaClientError } from './errors.ts';
import type { PowerestaLoginRequest, PowerestaLoginSuccess } from './types.ts';

export function buildLoginRequestBody(credentials: PowerestaLoginRequest): PowerestaLoginRequest {
  if (!credentials.tenant.trim() || !credentials.publicApiUserName.trim() || !credentials.password) {
    throw new PowerestaClientError(
      'Login requires non-empty tenant, publicApiUserName, and password.',
      'INVALID_LOGIN_PAYLOAD',
    );
  }
  return {
    tenant: credentials.tenant.trim(),
    publicApiUserName: credentials.publicApiUserName.trim(),
    password: credentials.password,
  };
}

export function buildAuthorizationHeaderValue(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new PowerestaClientError('Authorization token is empty.', 'MISSING_TOKEN');
  }
  // Documented protocol: raw JWT only — never prefix with "Bearer ".
  if (/^bearer\s+/i.test(trimmed)) {
    throw new PowerestaClientError(
      'Do not include a Bearer prefix in the PoweResta authorization header.',
      'VALIDATION_FAILED',
    );
  }
  return trimmed;
}

export function extractLoginToken(payload: unknown): string {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new PowerestaClientError('Login response is not a JSON object.', 'MALFORMED_JSON');
  }
  const token = (payload as PowerestaLoginSuccess).token;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new PowerestaClientError('Login response missing token.', 'MISSING_TOKEN');
  }
  return token.trim();
}
