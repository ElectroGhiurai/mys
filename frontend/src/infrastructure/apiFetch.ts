import { useCallback } from 'react'
import { useAuth } from '../features/auth/AuthContext'

export interface ApiResponse<T> {
  data: T;
}

/**
 * Custom hook to execute API requests with automated JWT token injection,
 * response normalization, and automatic session logout on 401 Unauthorized.
 *
 * Utilizes useCallback to ensure the request function reference remains stable
 * between renders, avoiding infinite triggering of useEffect dependency chains.
 */
export function useApi() {
  const { token, logoutUser } = useAuth()
  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

  const request = useCallback(async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers)
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (res.status === 401) {
      logoutUser()
      throw new Error('Unauthorized')
    }

    if (res.status === 204) {
      return null as unknown as T
    }

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      const errMsg = body?.error?.message ?? body?.message ?? 'API request failed'
      throw new Error(errMsg)
    }

    return (body?.data !== undefined ? body.data : body) as T
  }, [token, logoutUser, API_BASE])

  return { request }
}
