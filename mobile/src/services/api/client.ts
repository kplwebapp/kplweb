import { API_BASE_URL } from '@/constants/config'

export type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
}

export class ApiClientError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string | null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
  })

  let payload: ApiEnvelope<T> & { message?: string } = {
    success: false,
    data: null as T,
    message: 'Request failed',
  }
  try {
    payload = await response.json()
  } catch {
    /* non-JSON */
  }

  if (!response.ok || payload.success === false) {
    throw new ApiClientError(payload.message || `HTTP ${response.status}`, response.status)
  }

  return payload
}
