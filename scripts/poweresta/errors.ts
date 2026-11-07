export type PowerestaErrorCode =
  | 'INVALID_LOGIN_PAYLOAD'
  | 'LOGIN_HTTP_ERROR'
  | 'MISSING_TOKEN'
  | 'MALFORMED_JSON'
  | 'UNAUTHORIZED'
  | 'HTTP_ERROR'
  | 'LIVE_NETWORK_DISABLED'
  | 'MISSING_CREDENTIALS'
  | 'VALIDATION_FAILED';

export class PowerestaClientError extends Error {
  readonly code: PowerestaErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, code: PowerestaErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = 'PowerestaClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
