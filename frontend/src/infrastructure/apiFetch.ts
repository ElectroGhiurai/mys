import { useCallback } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { refresh } from '../features/auth/auth.api'

export interface ApiResponse<T> {
  data: T;
}

// Module-level variable to store the in-flight refresh promise, avoiding duplicate calls
let activeRefreshPromise: Promise<{ accessToken: string; user: any }> | null = null

/**
 * Custom hook to execute API requests with automated JWT token injection,
 * response normalization, and automatic session logout on 401 Unauthorized.
 *
 * Utilizes useCallback to ensure the request function reference remains stable
 * between renders, avoiding infinite triggering of useEffect dependency chains.
 */
export function useApi() {
  const { token, loginUser, logoutUser } = useAuth()
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
      try {
        if (!activeRefreshPromise) {
          activeRefreshPromise = refresh()
        }
        
        const refreshData = await activeRefreshPromise
        
        // Reset the promise after successful refresh
        activeRefreshPromise = null

        // Update auth state in context
        loginUser(refreshData.user, refreshData.accessToken)

        // Retry the request with the new token
        const retryHeaders = new Headers(options.headers)
        retryHeaders.set('Authorization', `Bearer ${refreshData.accessToken}`)
        if (options.body && !(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json')
        }

        const retryRes = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers: retryHeaders,
        })

        if (retryRes.status === 401) {
          logoutUser()
          throw new Error('Unauthorized')
        }

        if (retryRes.status === 204) {
          return null as unknown as T
        }

        const retryBody = await retryRes.json().catch(() => ({}))

        if (!retryRes.ok) {
          const errMsg = retryBody?.error?.message ?? retryBody?.message ?? 'API request failed'
          throw new Error(errMsg)
        }

        return (retryBody?.data !== undefined ? retryBody.data : retryBody) as T
      } catch (refreshErr) {
        activeRefreshPromise = null
        logoutUser()
        throw new Error('Unauthorized')
      }
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
  }, [token, loginUser, logoutUser, API_BASE])

  return { request }
}

