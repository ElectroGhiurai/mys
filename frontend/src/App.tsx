import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage, AuthProvider, ProtectedRoute } from './features/auth'
import DashboardPage from './features/dashboard/DashboardPage'
import './index.css'

/**
 * Root application shell.
 * Uses react-router-dom for standard URL-based routing.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
