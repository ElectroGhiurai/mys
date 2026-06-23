import { GoalTargets } from '../suggestionsEngine'

interface MacroRingsGridProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: GoalTargets;
  isLoading: boolean;
}

export function MacroRingsGrid({ totals, goals, isLoading }: MacroRingsGridProps) {
  const calPercent = Math.min(Math.round((totals.calories / goals.calories) * 100), 100)
  const proPercent = Math.min(Math.round((totals.protein / goals.protein) * 100), 100)
  const carbPercent = Math.min(Math.round((totals.carbs / goals.carbs) * 100), 100)
  const fatPercent = Math.min(Math.round((totals.fat / goals.fat) * 100), 100)

  const getStrokeDashOffset = (percent: number, radius: number) => {
    const circumference = 2 * Math.PI * radius
    return circumference - (percent / 100) * circumference
  }

  return (
    <div className={`totals-dashboard-grid${isLoading ? ' log-fading' : ''}`}>
      {/* Calories Circular progress */}
      <div className="total-ring-card primary-card">
        <div className="circular-progress-wrapper">
          <svg width="140" height="140" viewBox="0 0 140 140" className="progress-ring-svg">
            <circle cx="70" cy="70" r="60" className="ring-background" />
            <circle
              cx="70"
              cy="70"
              r="60"
              className="ring-progress calories"
              style={{ strokeDashoffset: getStrokeDashOffset(calPercent, 60) }}
            />
          </svg>
          <div className="progress-inner-value">
            <span className="current-value">{Math.round(totals.calories)}</span>
            <span className="target-limit">/ {Math.round(goals.calories)} kcal</span>
          </div>
        </div>
        <span className="ring-card-label">Calories Intake</span>
      </div>

      {/* Protein progress */}
      <div className="total-ring-card">
        <div className="circular-progress-wrapper">
          <svg width="100" height="100" viewBox="0 0 100 100" className="progress-ring-svg">
            <circle cx="50" cy="50" r="42" className="ring-background" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="ring-progress protein"
              style={{ strokeDashoffset: getStrokeDashOffset(proPercent, 42) }}
            />
          </svg>
          <div className="progress-inner-value small">
            <span className="current-value">{Math.round(totals.protein)}g</span>
          </div>
        </div>
        <span className="ring-card-label">Protein ({proPercent}%)</span>
      </div>

      {/* Carbs progress */}
      <div className="total-ring-card">
        <div className="circular-progress-wrapper">
          <svg width="100" height="100" viewBox="0 0 100 100" className="progress-ring-svg">
            <circle cx="50" cy="50" r="42" className="ring-background" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="ring-progress carbs"
              style={{ strokeDashoffset: getStrokeDashOffset(carbPercent, 42) }}
            />
          </svg>
          <div className="progress-inner-value small">
            <span className="current-value">{Math.round(totals.carbs)}g</span>
          </div>
        </div>
        <span className="ring-card-label">Carbs ({carbPercent}%)</span>
      </div>

      {/* Fat progress */}
      <div className="total-ring-card">
        <div className="circular-progress-wrapper">
          <svg width="100" height="100" viewBox="0 0 100 100" className="progress-ring-svg">
            <circle cx="50" cy="50" r="42" className="ring-background" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="ring-progress fat"
              style={{ strokeDashoffset: getStrokeDashOffset(fatPercent, 42) }}
            />
          </svg>
          <div className="progress-inner-value small">
            <span className="current-value">{Math.round(totals.fat)}g</span>
          </div>
        </div>
        <span className="ring-card-label">Fat ({fatPercent}%)</span>
      </div>
    </div>
  )
}
