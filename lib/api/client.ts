/**
 * API Client for BuildMore backend
 * 
 * Handles common fetch operations with error handling and credentials.
 */

/**
 * Credential mode for CORS requests
 * 
 * - 'omit': Never send credentials (default for demo/cross-origin)
 * - 'same-origin': Send credentials only for same-origin requests
 * - 'include': Always send credentials (use when backend is configured for credentials)
 * 
 * If you encounter CORS issues with 'include', switch to 'omit'.
 * If you need authentication cookies, use 'include' and ensure backend has proper CORS config.
 */
const CREDENTIALS_MODE: RequestCredentials = 'omit'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  ok: boolean
}

/**
 * Check if API is configured (env variable is set)
 */
export function isApiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_API_BASE_URL
}

/**
 * Get the API base URL
 * Returns null if not configured (allows graceful fallback to mock data)
 */
export function getApiBaseUrl(): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  
  if (!baseUrl) {
    return null
  }
  
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '')
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl()
  
  // If no API URL configured, return error response (will trigger fallback)
  if (!baseUrl) {
    return {
      data: null,
      error: 'API URL이 설정되지 않았습니다. Mock 데이터를 사용합니다.',
      ok: false,
    }
  }
  
  try {
    const url = `${baseUrl}${endpoint}`
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    
    const response = await fetch(url, {
      ...options,
      credentials: CREDENTIALS_MODE,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        data: null,
        error: `API 요청 실패 (${response.status}): ${errorText}`,
        ok: false,
      }
    }
    
    const data = await response.json()
    
    return {
      data: data as T,
      error: null,
      ok: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle network errors gracefully
    if (errorMessage.includes('fetch failed') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
      return {
        data: null,
        error: 'API 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.',
        ok: false,
      }
    }
    
    return {
      data: null,
      error: `API 오류: ${errorMessage}`,
      ok: false,
    }
  }
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { method: 'GET' })
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}
