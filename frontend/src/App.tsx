import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage, AuthProvider, ProtectedRoute } from './features/auth'
import { AppLayout } from './features/layout/AppLayout'
import DashboardPage from './features/dashboard/DashboardPage'
import { TrackerPage } from './features/tracker/TrackerPage'
import { WeightPage } from './features/weight/WeightPage'
import './index.css'

/**
 * Root application shell.
 * Uses react-router-dom's HashRouter to support refreshes on static hosting (e.g. GitHub Pages).
 */
function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Redirect root to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/weight" element={<WeightPage />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
