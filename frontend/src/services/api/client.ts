const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Fired on any 401 so the admin panel can send the user back to its login page. */
export const UNAUTHORIZED_EVENT = 'kpl:unauthorized';

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(baseUrl = API_BASE_URL, getToken = () => localStorage.getItem('accessToken')) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const isFormData = options.body instanceof FormData;
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  upload<T>(endpoint: string, file: File, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.request<T>(endpoint, { method: 'POST', body: formData });
  }
}

export const apiClient = new ApiClient();
