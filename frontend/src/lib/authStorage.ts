// Local JWT storage for the app's own email/password auth (see backend
// routers/auth.py: /api/v1/auth/register, /local-login, /me). Separate from
// the MGX platform's own client SDK auth, which requires being hosted on the
// MGX platform to work and isn't usable for a standalone deployment.

const TOKEN_KEY = 'shalomGuide.authToken';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Spread into an axios `headers` object for an authenticated request. */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
