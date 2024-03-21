function isBrowser() {
  return Boolean(
    typeof window !== 'undefined' && '__ENV' in window && window['__ENV'] !== undefined,
  );
}

export function getAllEnv(): Record<string, string | undefined> {
  if (isBrowser()) {
    return (window as any)['__ENV'] ?? {};
  }

  return process.env;
}
