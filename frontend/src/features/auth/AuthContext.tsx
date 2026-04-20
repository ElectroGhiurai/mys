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
  loginUser: (userData: User, accessToken: string) => void;
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
  }, [])

  const loginUser = (userData: User, accessToken: string) => {
    setUser(userData)
    setToken(accessToken)
  }

  const logoutUser = () => {
    setUser(null)
    setToken(null)
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
