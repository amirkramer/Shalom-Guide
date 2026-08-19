import axios from 'axios';
import { getAPIBaseURL } from './config';
import { getToken, setToken, clearToken, authHeader } from './authStorage';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  last_login?: string;
}

const client = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

class LocalAuthApi {
  private base() {
    return getAPIBaseURL();
  }

  async register(email: string, password: string, name?: string): Promise<AuthUser> {
    try {
      const response = await client.post(`${this.base()}/api/v1/auth/register`, { email, password, name });
      setToken(response.data.token);
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to register');
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const response = await client.post(`${this.base()}/api/v1/auth/local-login`, { email, password });
      setToken(response.data.token);
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to log in');
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!getToken()) return null;
    try {
      const response = await client.get(`${this.base()}/api/v1/auth/me`, { headers: authHeader() });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        clearToken();
        return null;
      }
      throw new Error(error.response?.data?.detail || 'Failed to get user info');
    }
  }

  async logout(): Promise<void> {
    clearToken();
  }
}

export const authApi = new LocalAuthApi();
export { authHeader };
