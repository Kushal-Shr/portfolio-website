export const BOOTED_KEY = 'psh:booted';
export const SESSION_KEY = 'psh:session';

export function readStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private windows, quotas); the shell works without it.
  }
}
