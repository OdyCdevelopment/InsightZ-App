import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine the dev server machine's IP (e.g. 192.168.2.17)
const getHostIp = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  // User's active machine Wi-Fi IP
  return '192.168.2.17';
};

const getDefaultApiUrl = () => {
  const hostIp = getHostIp();
  if (Platform.OS === 'android') {
    // Both physical Android device on Wi-Fi and Android emulator can reach the host via its LAN IP
    return `http://${hostIp}:5001/api/v1`;
  }
  return 'http://localhost:5001/api/v1';
};

class ApiClient {
  private baseUrl: string = getDefaultApiUrl();
  private token: string | null = null;
  private isConnected: boolean | null = null;

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public getIsConnected(): boolean | null {
    return this.isConnected;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const rootUrl = this.baseUrl.replace(/\/api\/v1\/?$/, '');
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${rootUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      const isOk = res.ok;
      this.isConnected = isOk;
      return isOk;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      this.isConnected = true;
      return json;
    } catch (error: any) {
      clearTimeout(timer);
      this.isConnected = false;

      // If aborted or connection refused, try fallback candidate IPs once
      if (error.name === 'AbortError' || error.message?.includes('Network request failed')) {
        const candidates = [
          'http://192.168.2.17:5001/api/v1',
          'http://10.0.2.2:5001/api/v1',
          'http://localhost:5001/api/v1',
        ].filter((u) => u !== this.baseUrl);

        for (const candidate of candidates) {
          try {
            const fallbackUrl = `${candidate}${cleanPath}${url.search}`;
            const fbRes = await fetch(fallbackUrl, { method: 'GET', headers });
            if (fbRes.ok) {
              const fbJson = await fbRes.json();
              this.baseUrl = candidate; // auto-switch to working candidate
              this.isConnected = true;
              return fbJson;
            }
          } catch {
            // continue checking next candidate
          }
        }
      }

      throw error;
    }
  }

  public async post<T>(path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      this.isConnected = true;
      return json;
    } catch (error) {
      clearTimeout(timer);
      this.isConnected = false;
      throw error;
    }
  }

  public async put<T>(path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      this.isConnected = true;
      return json;
    } catch (error) {
      clearTimeout(timer);
      this.isConnected = false;
      throw error;
    }
  }

  public async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
