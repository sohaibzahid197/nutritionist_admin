import type { AuthProvider } from 'react-admin';
import { request, tokens } from './api';

const PROFILE_KEY = 'roots.admin.profile';

type User = { id: string; email: string; name?: string | null; role: 'USER' | 'ADMIN' };

const storedProfile = (): User | null => {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const result = await request<{
      user: User;
      tokens: { access: { token: string }; refresh: { token: string } };
    }>('/auth/login', {
      method: 'POST',
      anonymous: true,
      body: { email: String(username).trim().toLowerCase(), password },
    });

    // The API enforces this on every admin route regardless; refusing here just gives a
    // clearer message than a wall of 403s after a "successful" login.
    if (result.user.role !== 'ADMIN') {
      throw new Error('That account does not have admin access.');
    }

    tokens.set(result.tokens.access.token, result.tokens.refresh.token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(result.user));
  },

  logout: async () => {
    const refreshToken = tokens.refresh();
    tokens.clear();
    localStorage.removeItem(PROFILE_KEY);
    if (!refreshToken) return;
    try {
      await request('/auth/logout', { method: 'POST', anonymous: true, body: { refreshToken } });
    } catch {
      // Local sign-out already happened; a failed server call must not trap the user.
    }
  },

  checkAuth: async () => {
    if (!tokens.access() && !tokens.refresh()) throw new Error('Not signed in');
  },

  checkError: async (error) => {
    const status = (error as { status?: number })?.status;
    if (status === 401) {
      tokens.clear();
      localStorage.removeItem(PROFILE_KEY);
      throw new Error('Session expired');
    }
    // A 403 means this admin lacks one right, not that the session is invalid — staying
    // signed in and showing the error is more useful than bouncing to the login page.
  },

  getIdentity: async () => {
    const profile = storedProfile();
    if (!profile) throw new Error('Not signed in');
    return { id: profile.id, fullName: profile.name || profile.email };
  },

  getPermissions: async () => storedProfile()?.role ?? null,
};
