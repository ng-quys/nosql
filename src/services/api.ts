/**
 * Base API client service connected to FreshLeaf Express + MongoDB Atlas Backend (/api)
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const API_BASE_URL = '/api';

export class ApiService {
  /**
   * Normalizes endpoint to relative /api path for browser requests in AI Studio preview.
   * Strips any localhost/127.0.0.1 origin and ensures no /api/api duplication.
   */
  public static normalizeUrl(endpoint: string): string {
    let clean = endpoint.trim();
    // Strip accidental origin prefixes if present
    clean = clean.replace(/^https?:\/\/[^/]+/i, '');
    if (!clean.startsWith('/')) {
      clean = `/${clean}`;
    }
    // Prevent duplicate /api/api
    if (clean === '/api' || clean.startsWith('/api/') || clean.startsWith('/api?')) {
      return clean;
    }
    return `${API_BASE_URL}${clean}`;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('freshleaf_jwt_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token && token.trim() && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = this.normalizeUrl(endpoint);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errMessage = `HTTP error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.message) errMessage = errData.message;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  static get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  static delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
