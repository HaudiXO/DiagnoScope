export interface TokenData {
  accessToken: string;
  tokenType: string;
}

const TOKEN_KEY = 'auth_token';
const TOKEN_V2_KEY = 'auth_token_v2';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function saveToken(token: TokenData): void {
  if (!isBrowser()) return;

  localStorage.setItem(TOKEN_V2_KEY, JSON.stringify(token));
  // Keep legacy key for older auth provider logic.
  localStorage.setItem(TOKEN_KEY, token.accessToken);
}

export function getToken(): TokenData | null {
  if (!isBrowser()) return null;

  const v2 = localStorage.getItem(TOKEN_V2_KEY);
  if (v2) {
    try {
      const parsed = JSON.parse(v2) as Partial<TokenData>;
      if (parsed.accessToken) {
        return {
          accessToken: parsed.accessToken,
          tokenType: parsed.tokenType || 'Bearer',
        };
      }
    } catch {
      // Fall through to legacy key.
    }
  }

  const legacy = localStorage.getItem(TOKEN_KEY);
  if (!legacy) return null;

  return {
    accessToken: legacy,
    tokenType: 'Bearer',
  };
}

export function clearToken(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(TOKEN_V2_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
