let expectedActivityRefProvider: () => string | null = () => null;

export function setExpectedActivityRefProvider(provider: () => string | null): void {
  expectedActivityRefProvider = provider;
}

export function peekExpectedActivityRef(): string | null {
  return expectedActivityRefProvider();
}
