export function createIsolatedStorage() {
  const storage = new Map<string, string>();

  const localStorageMock: Storage = {
    get length() {
      return storage.size;
    },
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };

  return { storage, localStorageMock };
}

export function installLocalStorageMock(): Map<string, string> {
  const { storage, localStorageMock } = createIsolatedStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });
  return storage;
}

export function clearLocalStorageMock(storage: Map<string, string>) {
  storage.clear();
}
