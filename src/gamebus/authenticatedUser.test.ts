import { describe, it, expect } from 'vitest';
import { parseGameBusAuthenticatedUser } from './authenticatedUser';

const realMePayload = {
  id: 'gb-user-123',
  clientId: 'client-1',
  firstName: 'Test',
  lastName: 'Account',
  email: 'test@example.com',
  phone: '+358000000',
  password: 'secret',
  roles: ['chef'],
  picture: { filename: 'avatars/test-account.png' },
};

describe('parseGameBusAuthenticatedUser', () => {
  it('parses real { id, firstName, lastName } payload correctly', () => {
    const user = parseGameBusAuthenticatedUser(realMePayload);
    expect(user).toEqual({
      id: 'gb-user-123',
      name: 'Test Account',
      image: 'avatars/test-account.png',
    });
  });

  it('builds name as "First Last" from firstName and lastName', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'user-1',
      firstName: 'Aino',
      lastName: 'Virtanen',
    });
    expect(user?.name).toBe('Aino Virtanen');
  });

  it('supports first-name-only identity', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'user-2',
      firstName: 'Solo',
    });
    expect(user).toEqual({ id: 'user-2', name: 'Solo' });
  });

  it('supports last-name-only identity', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'user-3',
      lastName: 'Niemi',
    });
    expect(user).toEqual({ id: 'user-3', name: 'Niemi' });
  });

  it('rejects payload when id is missing', () => {
    expect(
      parseGameBusAuthenticatedUser({
        firstName: 'Test',
        lastName: 'Account',
      }),
    ).toBeNull();
  });

  it('rejects payload when usable name is missing', () => {
    expect(
      parseGameBusAuthenticatedUser({
        id: 'user-4',
        email: 'hidden@example.com',
      }),
    ).toBeNull();
    expect(parseGameBusAuthenticatedUser({ id: 'user-4' })).toBeNull();
  });

  it('keeps legacy { id, name } support', () => {
    expect(
      parseGameBusAuthenticatedUser({
        id: 'legacy-user',
        name: 'Legacy Name',
        image: 'https://example.com/avatar.png',
      }),
    ).toEqual({
      id: 'legacy-user',
      name: 'Legacy Name',
      image: 'https://example.com/avatar.png',
    });
  });

  it('maps picture.filename to image when valid', () => {
    const user = parseGameBusAuthenticatedUser({
      id: 'user-5',
      firstName: 'Camila',
      lastName: 'Niemi',
      picture: { filename: 'profile/camila.png' },
    });
    expect(user?.image).toBe('profile/camila.png');
  });

  it('omits image when picture.filename is empty or invalid', () => {
    expect(
      parseGameBusAuthenticatedUser({
        id: 'user-6',
        firstName: 'No',
        lastName: 'Image',
        picture: { filename: '   ' },
      }),
    ).toEqual({ id: 'user-6', name: 'No Image' });
  });

  it('does not expose email, password, or roles in parsed model', () => {
    const user = parseGameBusAuthenticatedUser(realMePayload);
    expect(user).not.toBeNull();
    expect(user).toEqual({
      id: 'gb-user-123',
      name: 'Test Account',
      image: 'avatars/test-account.png',
    });
    expect(Object.keys(user!)).toEqual(['id', 'name', 'image']);
  });

  it('returns null for malformed input without throwing', () => {
    expect(parseGameBusAuthenticatedUser(null)).toBeNull();
    expect(parseGameBusAuthenticatedUser([])).toBeNull();
    expect(parseGameBusAuthenticatedUser({ id: 123, firstName: 'X' })).toBeNull();
    expect(parseGameBusAuthenticatedUser('not-json')).toBeNull();
  });

  it('parses nested user objects defensively', () => {
    expect(
      parseGameBusAuthenticatedUser({
        user: { id: 'nested-id', firstName: 'Nested', lastName: 'User' },
      }),
    ).toEqual({ id: 'nested-id', name: 'Nested User' });
  });
});
