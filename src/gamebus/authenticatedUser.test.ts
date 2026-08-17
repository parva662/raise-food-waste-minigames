import { describe, it, expect } from 'vitest';
import { parseGameBusAuthenticatedUser } from './authenticatedUser';

describe('parseGameBusAuthenticatedUser', () => {
  it('parses a valid direct /api/me user object', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'gb-user-123',
      name: 'Test Account',
      image: 'https://example.com/avatar.png',
    });
    expect(user).toEqual({
      id: 'gb-user-123',
      name: 'Test Account',
      image: 'https://example.com/avatar.png',
    });
  });

  it('preserves real user id exactly', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Second Account',
    });
    expect(user?.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('preserves real user name exactly', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'user-2',
      name: 'Boris Lindström',
    });
    expect(user?.name).toBe('Boris Lindström');
  });

  it('returns null for malformed input without throwing', () => {
    expect(parseGameBusAuthenticatedUser(null)).toBeNull();
    expect(parseGameBusAuthenticatedUser([])).toBeNull();
    expect(parseGameBusAuthenticatedUser({ id: 123, name: 'X' })).toBeNull();
    expect(parseGameBusAuthenticatedUser({ id: 'only-id' })).toBeNull();
    expect(parseGameBusAuthenticatedUser({ name: 'only-name' })).toBeNull();
    expect(parseGameBusAuthenticatedUser('not-json')).toBeNull();
  });

  it('returns null when input is missing', () => {
    expect(parseGameBusAuthenticatedUser(undefined)).toBeNull();
  });

  it('parses nested user objects defensively', () => {
    expect(
      parseGameBusAuthenticatedUser({
        user: { id: 'nested-id', name: 'Nested User' },
      }),
    ).toEqual({ id: 'nested-id', name: 'Nested User' });
  });
});
