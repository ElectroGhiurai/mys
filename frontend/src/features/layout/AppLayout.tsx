import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './AppLayout.css'

/**
 * Responsive application shell containing a collapsible left sidebar drawer
 * and a top navigation header for mobile viewports.
 */
export function AppLayout() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)
  const closeMobile = () => setIsMobileOpen(false)

  // Inline SVG icons for premium look without external dependencies
  const dashboardIcon = (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )

  const trackerIcon = (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )

  const weightIcon = (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9M12 12l4.5 4.5" />
    </svg>
  )

  const workoutIcon = (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" />
      <path d="M6 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
      <rect x="8" y="11" width="8" height="2" rx="1" />
      <rect x="6" y="6" width="2" height="12" rx="1" />
      <rect x="16" y="6" width="2" height="12" rx="1" />
    </svg>
  )

  const logoutIcon = (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )

  const collapseIcon = (
    <svg className={`collapse-arrow ${isCollapsed ? 'collapsed' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )

  const hamburgerIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )

  const closeIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  return (
    <div className="app-shell">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={toggleMobile} aria-label="Toggle Navigation Menu">
          {hamburgerIcon}
        </button>
        <span className="brand-logo">MYS</span>
        <div className="mobile-avatar">{user?.username?.[0]?.toUpperCase() ?? 'U'}</div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && <div className="drawer-overlay" onClick={closeMobile} />}

      {/* Sidebar (Drawer on mobile, collapsible on desktop) */}
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-box">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="var(--accent-color)" />
              </svg>
            </div>
            <span className="brand-name">MYS Nutrition</span>
          </div>
          <button className="collapse-btn" onClick={toggleCollapse} aria-label="Collapse sidebar">
            {collapseIcon}
          </button>
          <button className="mobile-close-btn" onClick={closeMobile} aria-label="Close sidebar">
            {closeIcon}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            {dashboardIcon}
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/tracker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            {trackerIcon}
            <span className="nav-label">Calorie Tracker</span>
          </NavLink>
          <NavLink to="/weight" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            {weightIcon}
            <span className="nav-label">Weight Tracker</span>
          </NavLink>
          <NavLink to="/workout" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            {workoutIcon}
            <span className="nav-label">Workout Tracker</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() ?? 'U'}</div>
            <div className="user-meta">
              <span className="user-name">{user?.username ?? 'User'}</span>
              <span className="user-email">{user?.email ?? ''}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} aria-label="Sign out">
            {logoutIcon}
            <span className="logout-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`app-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="main-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
