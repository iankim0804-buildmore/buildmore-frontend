/**
 * API Client for BuildMore backend
 * 
 * Handles common fetch operations with error handling and credentials.
 */

// Credential mode - easily switch between 'include', 'same-origin', or 'omit'
const CREDENTIALS_MODE: RequestCredentials = 'include'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  ok: boolean
}

export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  
  if (!baseUrl) {
    throw new Error(
      '[BuildMore API] NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다. ' +
      '.env.local 파일에 NEXT_PUBLIC_API_BASE_URL을 설정해주세요.'
    )
  }
  
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '')
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const baseUrl = getApiBaseUrl()
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
    if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
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
