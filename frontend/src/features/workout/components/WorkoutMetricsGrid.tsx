export interface WorkoutMetricsGridProps {
  totalWorkouts: number;
  uniqueExercises: number;
  maxWeightLifted: number;
}

export function WorkoutMetricsGrid({
  totalWorkouts,
  uniqueExercises,
  maxWeightLifted,
}: WorkoutMetricsGridProps) {
  return (
    <div className="workout-grid-3col">
      <div className="workout-metric-card">
        <div className="workout-metric-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="metric-svg-icon">
            <path d="M6 12h12M6 8h2v8H6V8zm10 0h2v8h-2V8zM3 10h1v4H3v-4zm17 0h1v4h-1v-4z" />
          </svg>
        </div>
        <div className="workout-metric-content">
          <span className="workout-metric-value">{totalWorkouts}</span>
          <span className="workout-metric-label">Total Workouts</span>
        </div>
      </div>
      <div className="workout-metric-card">
        <div className="workout-metric-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="metric-svg-icon">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className="workout-metric-content">
          <span className="workout-metric-value">{uniqueExercises}</span>
          <span className="workout-metric-label">Exercises Tracked</span>
        </div>
      </div>
      <div className="workout-metric-card">
        <div className="workout-metric-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="metric-svg-icon">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </div>
        <div className="workout-metric-content">
          <span className="workout-metric-value">{maxWeightLifted > 0 ? `${maxWeightLifted} kg` : 'N/A'}</span>
          <span className="workout-metric-label">Max Weight Lifted</span>
        </div>
      </div>
    </div>
  )
}
