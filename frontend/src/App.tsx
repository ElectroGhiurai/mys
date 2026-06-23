import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage, AuthProvider, ProtectedRoute } from './features/auth'
import { AppLayout } from './features/layout/AppLayout'
import DashboardPage from './features/dashboard/DashboardPage'
import { TrackerPage } from './features/tracker/TrackerPage'
import './index.css'

/**
 * Root application shell.
 * Uses react-router-dom for standard URL-based routing.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Redirect root to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
