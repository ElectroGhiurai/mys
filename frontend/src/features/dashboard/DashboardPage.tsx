import './DashboardPage.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/**
 * Beautiful, welcoming Dashboard Page displaying overview cards and navigating to the tracker.
 */
export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="welcome-title">Welcome back, {user?.username || 'User'}!</h1>
        <p className="welcome-subtitle">Here is a quick look at your health and nutrition overview.</p>
      </header>

      <div className="dashboard-grid">
        {/* Quick Start Card */}
        <div className="dashboard-card action-card">
          <div className="card-accent" />
          <h2 className="card-title">Daily Nutrition Tracker</h2>
          <p className="card-description">
            Log your ingredients, check your macro distribution, and get smart recommendations based on what you eat.
          </p>
          <Link to="/tracker" className="btn-primary">
            Track Today's Food
          </Link>
        </div>

        {/* Mock Stats Cards */}
        <div className="dashboard-card stats-card">
          <h3 className="stats-label">Daily Calorie Target</h3>
          <div className="stats-value">2,000 <span className="stats-unit">kcal</span></div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: '0%' }} />
          </div>
          <span className="stats-meta">0% consumed today</span>
        </div>

        <div className="dashboard-card macros-card">
          <h3 className="card-title">Daily Macro Balance</h3>
          <div className="macro-row">
            <div className="macro-col">
              <span className="macro-name protein">Protein</span>
              <span className="macro-qty">0 / 130g</span>
            </div>
            <div className="macro-col">
              <span className="macro-name carbs">Carbs</span>
              <span className="macro-qty">0 / 220g</span>
            </div>
            <div className="macro-col">
              <span className="macro-name fats">Fats</span>
              <span className="macro-qty">0 / 70g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
