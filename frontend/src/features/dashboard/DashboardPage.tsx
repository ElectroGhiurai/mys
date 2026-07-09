import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useApi } from '../../infrastructure/apiFetch'
import { trackerApi, TrackedIngredient, GoalDto } from '../tracker/tracker.api'
import { weightApi } from '../weight/weight.api'
import { workoutApi, ExerciseLog } from '../workout/workout.api'
import { getSuggestions, SuggestionItem } from '../tracker/suggestionsEngine'
import './DashboardPage.css'

// ── WIDGET TYPE DEFINITIONS ───────────────────────────────────────────────
export interface Widget {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'quick-links', title: 'Quick Action Links', description: 'Quick links to tracker, weight, and gym logs.', enabled: true },
  { id: 'calorie-summary', title: 'Daily Calories', description: 'Track calories consumed vs. your daily goal.', enabled: true },
  { id: 'macro-balance', title: 'Macronutrient Balance', description: 'Protein, carbohydrate, and fat progress today.', enabled: true },
  { id: 'weight-tracker', title: 'Weight Tracker', description: 'Monitor your weight trend and quick log today\'s weight.', enabled: true },
  { id: 'water-tracker', title: 'Water Tracker', description: 'Log and track your daily water glass intake.', enabled: true },
  { id: 'recent-workouts', title: 'Today\'s Workouts', description: 'Summarizes your strength and cardio training today.', enabled: true },
  { id: 'smart-suggestions', title: 'Smart Nutrition Tips', description: 'Deficit-based recommendations to optimize macro balance.', enabled: false },
]

// ── SVGS FOR CLEAN UI ─────────────────────────────────────────────────────
const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IconArrowUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
)
const IconArrowDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
)
const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
)
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
)
const IconMinus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
)

const IconNutrition = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c4.97 0 9-3.03 9-7 0-3.5-2.5-6.5-6.5-6.5-1.5 0-2.5.5-2.5.5s-1-.5-2.5-.5C5.5 8.5 3 11.5 3 15c0 3.97 4.03 7 9 7z"/>
    <path d="M12 8.5c0-2.5 1-4.5 3-5.5"/>
    <path d="M12 5c-1.5.5-3 .5-4.5 0"/>
  </svg>
)

const IconScale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 12l2-3" />
  </svg>
)

const IconDumbbell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M18 4v16M6 4v16M3 8v8M21 8v8M8 12h8" />
  </svg>
)

const IconGlass = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.5 3h-13l1.5 18h10z" />
    <path d="M5.9 7h12.2" />
    <path d="M6.7 13h10.6" />
  </svg>
)

// Helper to get local date format
const getLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { request } = useApi()

  // Layout states
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [showCustomizer, setShowCustomizer] = useState(false)

  // Real backend metrics
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<GoalDto | null>(null)
  const [trackedToday, setTrackedToday] = useState<TrackedIngredient[]>([])
  const [latestWeight, setLatestWeight] = useState<number | null>(null)
  const [workoutsToday, setWorkoutsToday] = useState<ExerciseLog[]>([])

  // Local storage stats (Water & weight logging UI)
  const [waterToday, setWaterToday] = useState(0)
  const [waterTarget, setWaterTarget] = useState(8)
  const [weightInput, setWeightInput] = useState('')
  const [weightSuccess, setWeightSuccess] = useState(false)

  const todayStr = getLocalDateString()

  // 1. Initialize widgets and water target from localStorage on user change
  useEffect(() => {
    if (user?.email) {
      // Load widgets
      const widgetKey = `mys_dashboard_widgets_${user.email}`
      const savedWidgets = localStorage.getItem(widgetKey)
      if (savedWidgets) {
        try {
          const parsed = JSON.parse(savedWidgets) as Widget[]
          // Merge with DEFAULT_WIDGETS to support additions/deletions seamlessly
          const merged = DEFAULT_WIDGETS.map(def => {
            const saved = parsed.find(w => w.id === def.id)
            return saved ? { ...def, enabled: saved.enabled } : def
          })

          // Maintain order from saved preferences
          const ordered = parsed
            .map(p => merged.find(m => m.id === p.id))
            .filter(Boolean) as Widget[]
          
          // Append new default widgets not in saved list
          merged.forEach(def => {
            if (!ordered.find(o => o.id === def.id)) {
              ordered.push(def)
            }
          })
          setWidgets(ordered)
        } catch (e) {
          setWidgets(DEFAULT_WIDGETS)
        }
      } else {
        setWidgets(DEFAULT_WIDGETS)
      }

      // Load water target & tracker
      const waterKey = `mys_water_${user.email}_${todayStr}`
      const targetKey = `mys_water_target_${user.email}`
      
      const savedWater = localStorage.getItem(waterKey)
      const savedTarget = localStorage.getItem(targetKey)
      
      setWaterToday(savedWater ? parseInt(savedWater, 10) : 0)
      setWaterTarget(savedTarget ? parseInt(savedTarget, 10) : 8)
    }
  }, [user, todayStr])

  // 2. Fetch backend metrics
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Parallel loading of backend information
      const [goalsData, trackedData, weightsData, exercisesData] = await Promise.all([
        trackerApi.getGoals(request).catch(() => null),
        trackerApi.getTracked(request, todayStr).catch(() => []),
        weightApi.getWeights(request).catch(() => []),
        workoutApi.getExercises(request).catch(() => []),
      ])

      if (goalsData) {
        setGoals(goalsData)
      }

      setTrackedToday(trackedData)

      if (weightsData && weightsData.length > 0) {
        // Sort by logged date descending
        const sorted = [...weightsData].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
        setLatestWeight(sorted[0]?.weightKg ?? null)
      } else {
        setLatestWeight(goalsData?.startingWeightKg ?? null)
      }

      const todayWorkouts = exercisesData.filter(ex => ex.loggedDate === todayStr)
      setWorkoutsToday(todayWorkouts)

    } catch (err: any) {
      setError('Could not load daily metrics from backend.')
    } finally {
      setLoading(false)
    }
  }, [request, todayStr])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // 3. Customize Widgets helpers
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets)
    if (user?.email) {
      localStorage.setItem(`mys_dashboard_widgets_${user.email}`, JSON.stringify(newWidgets))
    }
  }

  const toggleWidget = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    saveWidgets(updated)
  }

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= widgets.length) return

    const updated = [...widgets]
    const temp = updated[index]
    const target = updated[targetIndex]
    if (temp && target) {
      updated[index] = target
      updated[targetIndex] = temp
      saveWidgets(updated)
    }
  }

  // 4. Quick actions logic
  const handleWaterChange = (change: number) => {
    const newWater = Math.max(0, waterToday + change)
    setWaterToday(newWater)
    if (user?.email) {
      localStorage.setItem(`mys_water_${user.email}_${todayStr}`, String(newWater))
    }
  }

  const handleWaterTargetChange = (val: number) => {
    const newTarget = Math.max(1, val)
    setWaterTarget(newTarget)
    if (user?.email) {
      localStorage.setItem(`mys_water_target_${user.email}`, String(newTarget))
    }
  }

  const handleLogWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(weightInput)
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid weight.')
      return
    }

    try {
      await weightApi.logWeight(request, {
        weightKg: parsed,
        loggedDate: todayStr
      })
      setLatestWeight(parsed)
      setWeightInput('')
      setWeightSuccess(true)
      setTimeout(() => setWeightSuccess(false), 3000)
    } catch (err) {
      alert('Failed to log weight to the server.')
    }
  }

  // 5. Compute macro intake sums
  const totals = trackedToday.reduce(
    (acc, item) => {
      const factor = item.weight / 100
      acc.calories += Math.round(item.caloriesPer100g * factor)
      acc.protein += Math.round(item.proteinPer100g * factor)
      acc.carbs += Math.round(item.carbsPer100g * factor)
      acc.fat += Math.round(item.fatPer100g * factor)
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const calGoal = goals?.calorieGoal ?? 2000
  const protGoal = goals?.proteinGoal ?? 130
  const carbGoal = goals?.carbGoal ?? 220
  const fatGoal = goals?.fatGoal ?? 70

  const calPercent = Math.min(100, Math.round((totals.calories / calGoal) * 100))
  const protPercent = Math.min(100, Math.round((totals.protein / protGoal) * 100))
  const carbPercent = Math.min(100, Math.round((totals.carbs / carbGoal) * 100))
  const fatPercent = Math.min(100, Math.round((totals.fat / fatGoal) * 100))

  // 6. Generate AI recommendations
  const suggestions: SuggestionItem[] = getSuggestions(
    trackedToday.map(t => ({
      name: t.name,
      weight: t.weight,
      caloriesPer100g: t.caloriesPer100g,
      proteinPer100g: t.proteinPer100g,
      carbsPer100g: t.carbsPer100g,
      fatPer100g: t.fatPer100g,
    })),
    {
      calories: calGoal,
      protein: protGoal,
      carbs: carbGoal,
      fat: fatGoal,
    }
  )

  // ── WIDGETS RENDER ROUTER ────────────────────────────────────────────────
  const renderWidget = (id: string) => {
    switch (id) {
      case 'quick-links':
        return (
          <div key={id} className="dashboard-card quick-links-card animate-fade-in">
            <h2 className="card-title">Quick Actions</h2>
            <p className="card-description">Fast tracks to update your logs for today.</p>
            <div className="quick-actions-grid">
              <Link to="/tracker" className="quick-action-btn nutrition-btn">
                <span className="btn-icon"><IconNutrition /></span>
                <span className="btn-label">Track Nutrition</span>
              </Link>
              <Link to="/weight" className="quick-action-btn weight-btn">
                <span className="btn-icon"><IconScale /></span>
                <span className="btn-label">Log Weight</span>
              </Link>
              <Link to="/workout" className="quick-action-btn workout-btn">
                <span className="btn-icon"><IconDumbbell /></span>
                <span className="btn-label">Track Gym Set</span>
              </Link>
            </div>
          </div>
        )

      case 'calorie-summary':
        return (
          <div key={id} className="dashboard-card stats-card animate-fade-in">
            <div className="card-header-row">
              <h3 className="stats-label">Daily Calories</h3>
              <span className="stats-indicator-circle calories-circle" />
            </div>
            <div className="stats-value">
              {totals.calories.toLocaleString()} <span className="stats-unit">/ {calGoal} kcal</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar calorie-bar" style={{ width: `${calPercent}%` }} />
            </div>
            <div className="stats-footer-row">
              <span className="stats-meta">{calPercent}% of target consumed</span>
              <span className="stats-remaining">
                {totals.calories <= calGoal ? `${calGoal - totals.calories} kcal left` : 'Goal exceeded!'}
              </span>
            </div>
          </div>
        )

      case 'macro-balance':
        return (
          <div key={id} className="dashboard-card macros-card animate-fade-in">
            <h3 className="stats-label">Daily Macro Balance</h3>
            <div className="macro-rows-container">
              <div className="macro-row-detailed">
                <div className="macro-info-row">
                  <span className="macro-label protein">Protein</span>
                  <span className="macro-values">{totals.protein}g / {protGoal}g</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar protein-bar" style={{ width: `${protPercent}%` }} />
                </div>
              </div>

              <div className="macro-row-detailed">
                <div className="macro-info-row">
                  <span className="macro-label carbs">Carbs</span>
                  <span className="macro-values">{totals.carbs}g / {carbGoal}g</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar carbs-bar" style={{ width: `${carbPercent}%` }} />
                </div>
              </div>

              <div className="macro-row-detailed">
                <div className="macro-info-row">
                  <span className="macro-label fats">Fats</span>
                  <span className="macro-values">{totals.fat}g / {fatGoal}g</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar fats-bar" style={{ width: `${fatPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        )

      case 'weight-tracker':
        const targetDiff = latestWeight && goals?.targetWeightKg ? latestWeight - goals.targetWeightKg : null
        return (
          <div key={id} className="dashboard-card weight-widget-card animate-fade-in">
            <h3 className="stats-label">Weight Journey</h3>
            
            <div className="weight-display-row">
              <div className="weight-stat-block">
                <span className="weight-sublabel">Latest weight</span>
                <span className="weight-val-large">{latestWeight ? `${latestWeight} kg` : '--'}</span>
              </div>
              {targetDiff !== null && (
                <div className="weight-stat-block text-right">
                  <span className="weight-sublabel">To Target</span>
                  <span className={`weight-diff-val ${targetDiff <= 0 ? 'target-reached' : ''}`}>
                    {targetDiff > 0 ? `+${targetDiff.toFixed(1)} kg` : `${targetDiff.toFixed(1)} kg`}
                  </span>
                </div>
              )}
            </div>

            <div className="weight-goals-row">
              <div className="weight-goal-item">
                <span>Start:</span> <strong>{goals?.startingWeightKg ? `${goals.startingWeightKg} kg` : '--'}</strong>
              </div>
              <div className="weight-goal-item">
                <span>Target:</span> <strong>{goals?.targetWeightKg ? `${goals.targetWeightKg} kg` : '--'}</strong>
              </div>
            </div>

            <form onSubmit={handleLogWeightSubmit} className="weight-log-inline-form">
              <input
                type="number"
                step="0.1"
                placeholder="Log weight (kg)"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                className="weight-inline-input"
                required
              />
              <button type="submit" className="weight-inline-btn">Log</button>
            </form>
            {weightSuccess && <span className="weight-success-msg">✓ Weight recorded successfully!</span>}
          </div>
        )

      case 'water-tracker':
        const waterPct = Math.min(100, Math.round((waterToday / waterTarget) * 100))
        return (
          <div key={id} className="dashboard-card water-widget-card animate-fade-in">
            <h3 className="stats-label">Water Tracker</h3>
            
            <div className="water-summary-box">
              <div className="water-visual-state">
                <span className="water-icon-main"><IconGlass /></span>
                <div className="water-vals">
                  <span className="water-qty-large">{waterToday}</span>
                  <span className="water-qty-target">/ {waterTarget} glasses</span>
                </div>
              </div>
              <span className="water-ml-label">({waterToday * 250} ml consumed)</span>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar water-bar" style={{ width: `${waterPct}%` }} />
            </div>

            <div className="water-controls">
              <button onClick={() => handleWaterChange(-1)} className="water-btn-circle" title="Subtract glass">
                <IconMinus />
              </button>
              <button onClick={() => handleWaterChange(1)} className="water-btn-circle water-add-btn" title="Add glass">
                <IconPlus />
              </button>
              <div className="water-target-adjust">
                <span>Target:</span>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={waterTarget}
                  onChange={e => handleWaterTargetChange(parseInt(e.target.value, 10) || 8)}
                  className="water-target-input"
                />
              </div>
            </div>
          </div>
        )

      case 'recent-workouts':
        return (
          <div key={id} className="dashboard-card workouts-widget-card animate-fade-in">
            <h3 className="stats-label">Today's Workouts</h3>
            {workoutsToday.length === 0 ? (
              <div className="empty-workouts-view">
                <p className="card-description">No gym workouts logged yet today.</p>
                <Link to="/workout" className="btn-secondary-link">Log Gym Session</Link>
              </div>
            ) : (
              <div className="workouts-list-compact">
                {workoutsToday.map((ex, i) => (
                  <div key={ex.id || i} className="workout-compact-item">
                    <div className="workout-item-details">
                      <strong className="workout-ex-name">{ex.exerciseName}</strong>
                      <span className="workout-ex-cat">{ex.category}</span>
                    </div>
                    <span className="workout-set-badge">{ex.sets.length} sets</span>
                  </div>
                ))}
                <Link to="/workout" className="view-workouts-more-link">Go to Workout Page →</Link>
              </div>
            )}
          </div>
        )

      case 'smart-suggestions':
        return (
          <div key={id} className="dashboard-card suggestions-widget-card animate-fade-in">
            <h3 className="stats-label">Nutrition Recommendations</h3>
            {suggestions.length === 0 ? (
              <p className="card-description">Tracking complete. You've met or exceeded your nutritional targets!</p>
            ) : (
              <div className="suggestions-list-compact">
                {suggestions.slice(0, 3).map((item, idx) => (
                  <div key={item.id || idx} className="suggestion-item-card">
                    <div className="suggestion-item-header">
                      <strong className="sug-name">{item.name}</strong>
                      <span className="sug-reason-label">Suggestion</span>
                    </div>
                    <p className="sug-reason">{item.reason}</p>
                    <div className="sug-macros-row">
                      <span>{item.caloriesPer100g} kcal</span>
                      <span>P: {item.proteinPer100g}g</span>
                      <span>C: {item.carbsPer100g}g</span>
                      <span>F: {item.fatPer100g}g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // ── LOADING / ERROR / BLANK STATES ───────────────────────────────────────
  if (loading && widgets.length === 0) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-spinner-glow" />
        <p>Loading Dashboard metrics...</p>
      </div>
    )
  }

  const enabledWidgets = widgets.filter(w => w.enabled)

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-block">
        <div className="header-greeting">
          <h1 className="welcome-title">Welcome back, {user?.username || 'User'}!</h1>
          <p className="welcome-subtitle">Here is a quick look at your health and nutrition overview for today.</p>
        </div>
        <button
          onClick={() => setShowCustomizer(true)}
          className="btn-customize-dashboard"
          title="Customize dashboard layout"
        >
          <IconSettings /> Customize Dashboard
        </button>
      </header>

      {error && <div className="dashboard-error-banner">{error}</div>}

      <div className="dashboard-widgets-grid">
        {enabledWidgets.length === 0 ? (
          <div className="dashboard-card empty-dashboard-notice animate-fade-in">
            <h2>No Widgets Active</h2>
            <p>Your dashboard is currently empty. Click the button below to add metrics and track your performance.</p>
            <button onClick={() => setShowCustomizer(true)} className="btn-primary">
              Manage Dashboard Widgets
            </button>
          </div>
        ) : (
          enabledWidgets.map(w => renderWidget(w.id))
        )}
      </div>

      {/* ── CUSTOMIZATION PANEL MODAL ─────────────────────────────────────── */}
      {showCustomizer && (
        <div className="customizer-modal-overlay">
          <div className="customizer-modal-content animate-slide-up">
            <header className="customizer-header">
              <h2>Customize Dashboard</h2>
              <button onClick={() => setShowCustomizer(false)} className="close-modal-btn">
                <IconClose />
              </button>
            </header>
            
            <p className="customizer-intro">
              Toggle widgets to show them on your dashboard, and use the arrows to reorder them to your liking.
            </p>

            <div className="customizer-widgets-list">
              {widgets.map((widget, index) => (
                <div key={widget.id} className="customizer-widget-row">
                  <div className="widget-row-info">
                    <div className="toggle-switch-container">
                      <input
                        type="checkbox"
                        id={`toggle-${widget.id}`}
                        checked={widget.enabled}
                        onChange={() => toggleWidget(widget.id)}
                        className="toggle-checkbox"
                      />
                      <label htmlFor={`toggle-${widget.id}`} className="toggle-label-switch" />
                    </div>
                    <div className="widget-text-details">
                      <strong className="widget-row-title">{widget.title}</strong>
                      <span className="widget-row-desc">{widget.description}</span>
                    </div>
                  </div>
                  <div className="widget-row-controls">
                    <button
                      onClick={() => moveWidget(index, 'up')}
                      disabled={index === 0}
                      className="widget-move-btn"
                      title="Move Up"
                    >
                      <IconArrowUp />
                    </button>
                    <button
                      onClick={() => moveWidget(index, 'down')}
                      disabled={index === widgets.length - 1}
                      className="widget-move-btn"
                      title="Move Down"
                    >
                      <IconArrowDown />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <footer className="customizer-footer">
              <button onClick={() => setShowCustomizer(false)} className="btn-primary-modal-close">
                Done & Apply Changes
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
