import { createContext, useContext, useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { refresh } from './auth.api'
import './AuthPage.css'

export interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginUser: (userData: User, accessToken: string, keepLoggedIn?: boolean) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Manages global authentication state securely in memory (no localStorage for tokens to prevent XSS).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      // 1. Optimistic login check from localStorage
      const savedToken = localStorage.getItem('mys_session_token')
      const savedUserStr = localStorage.getItem('mys_session_user')
      const keep = localStorage.getItem('mys_keep_logged_in') === 'true'

      if (savedToken && savedUserStr && keep) {
        try {
          const parsedUser = JSON.parse(savedUserStr)
          setUser(parsedUser)
          setToken(savedToken)
          setIsCheckingAuth(false)
          
          // Silently refresh in the background to verify/extend the session
          try {
            const data = await refresh()
            setUser(data.user)
            setToken(data.accessToken)
            localStorage.setItem('mys_session_token', data.accessToken)
            localStorage.setItem('mys_session_user', JSON.stringify(data.user))
          } catch (refreshErr) {
            // If background verification fails with a persistent authentication issue,
            // the subsequent API requests will return 401 and trigger a clean logout.
          }
          return
        } catch (e) {
          localStorage.removeItem('mys_session_token')
          localStorage.removeItem('mys_session_user')
          localStorage.removeItem('mys_keep_logged_in')
        }
      }

      // 2. Cookie-only fallback
      try {
        const data = await refresh()
        setUser(data.user)
        setToken(data.accessToken)
      } catch (err) {
        // Token is invalid/expired or no cookie exists, stay logged out
        setUser(null)
        setToken(null)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()

    // Silent background refresh every 10 minutes while tab is open
    const intervalId = setInterval(async () => {
      try {
        const data = await refresh()
        setUser(data.user)
        setToken(data.accessToken)
        
        const keep = localStorage.getItem('mys_keep_logged_in') === 'true'
        if (keep) {
          localStorage.setItem('mys_session_token', data.accessToken)
          localStorage.setItem('mys_session_user', JSON.stringify(data.user))
        }
      } catch (err) {
        // If background refresh fails (e.g. transient network issue),
        // we don't force a logout. The api hook will handle any persistent 401s.
      }
    }, 10 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  const loginUser = (userData: User, accessToken: string, keepLoggedIn?: boolean) => {
    setUser(userData)
    setToken(accessToken)

    const shouldKeep = keepLoggedIn !== undefined
      ? keepLoggedIn
      : localStorage.getItem('mys_keep_logged_in') === 'true'

    if (shouldKeep) {
      localStorage.setItem('mys_session_token', accessToken)
      localStorage.setItem('mys_session_user', JSON.stringify(userData))
      localStorage.setItem('mys_keep_logged_in', 'true')
    } else {
      localStorage.removeItem('mys_session_token')
      localStorage.removeItem('mys_session_user')
      localStorage.removeItem('mys_keep_logged_in')
    }
  }

  const logoutUser = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mys_session_token')
    localStorage.removeItem('mys_session_user')
    localStorage.removeItem('mys_keep_logged_in')
  }

  if (isCheckingAuth) {
    return (
      <div className="auth-loading-screen">
        <span className="auth-btn__spinner" aria-hidden="true" />
        Loading...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * A wrapper for routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 */
export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children ? children : <Outlet />
}
