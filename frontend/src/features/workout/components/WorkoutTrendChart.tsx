import { useId } from 'react'

export interface ChartPoint {
  date: string;
  value: number;
}

export interface WorkoutTrendChartProps {
  chartExercise: string;
  setChartExercise: (name: string) => void;
  chartMetric: 'weight' | 'reps' | 'distance' | 'duration';
  setChartMetric: (metric: 'weight' | 'reps' | 'distance' | 'duration') => void;
  loggedExerciseNames: string[];
  chartPoints: ChartPoint[];
}

export function WorkoutTrendChart({
  chartExercise,
  setChartExercise,
  chartMetric,
  setChartMetric,
  loggedExerciseNames,
  chartPoints,
}: WorkoutTrendChartProps) {
  const gradientId = useId()

  const renderChartSvg = () => {
    if (chartPoints.length === 0) {
      return (
        <div className="chart-placeholder">
          <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          <p>No metric data found for "{chartExercise}" yet. Add sets with values to render chart.</p>
        </div>
      )
    }

    const width = 600
    const height = 240
    const padding = { left: 45, right: 20, top: 15, bottom: 35 }

    const values = chartPoints.map(p => p.value)
    let minVal = Math.min(...values)
    let maxVal = Math.max(...values)

    // Add padding to range
    const valRange = maxVal - minVal || 1
    minVal = Math.max(0, minVal - valRange * 0.1)
    maxVal = maxVal + valRange * 0.1

    const points = chartPoints.map((pt, idx) => {
      const x = padding.left + (idx / Math.max(1, chartPoints.length - 1)) * (width - padding.left - padding.right)
      const y = height - padding.bottom - ((pt.value - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom)
      return { x, y, val: pt.value, date: pt.date }
    })

    let linePathD = ''
    let areaPathD = ''

    if (points.length === 1) {
      const p = points[0]
      if (p) {
        linePathD = `M ${padding.left} ${p.y} H ${width - padding.right}`
        areaPathD = `M ${padding.left} ${p.y} H ${width - padding.right} V ${height - padding.bottom} H ${padding.left} Z`
      }
    } else if (points.length > 1) {
      const p0 = points[0]
      const plast = points[points.length - 1]
      if (p0 && plast) {
        linePathD = `M ${p0.x} ${p0.y}`
        for (let i = 1; i < points.length; i++) {
          const pi = points[i]
          if (pi) {
            linePathD += ` L ${pi.x} ${pi.y}`
          }
        }
        areaPathD = `${linePathD} L ${plast.x} ${height - padding.bottom} L ${p0.x} ${height - padding.bottom} Z`
      }
    }

    const yTicksCount = 4
    const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
      const val = minVal + (i / (yTicksCount - 1)) * (maxVal - minVal)
      const y = height - padding.bottom - (i / (yTicksCount - 1)) * (height - padding.top - padding.bottom)
      return { val: val.toFixed(1), y }
    })

    const xTicksIndices = points.length <= 4 
      ? points.map((_, i) => i) 
      : [0, Math.floor(points.length * 0.33), Math.floor(points.length * 0.66), points.length - 1]

    return (
      <div className="chart-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.00"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i} className="chart-grid-line-group">
              <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} />
              <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fontSize="9" fontWeight="500">
                {tick.val}
              </text>
            </g>
          ))}

          {/* Paths */}
          {areaPathD && <path d={areaPathD} fill={`url(#${gradientId})`} />}
          {linePathD && <path d={linePathD} fill="none" stroke="var(--accent-color)" strokeWidth="2.5" />}

          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent-color)" stroke="var(--surface-color)" strokeWidth="1.5" />
          ))}

          {/* X Axis Labels */}
          {xTicksIndices.map(idx => {
            const p = points[idx]
            if (!p) return null
            const labelDate = new Date(p.date)
            const dateStr = `${labelDate.getMonth() + 1}/${labelDate.getDate()}`
            return (
              <text key={idx} x={p.x} y={height - padding.bottom + 18} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="500">
                {dateStr}
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className="workout-card shadow-sm">
      <h2 className="card-title">Exercise Progress</h2>
      
      <div className="chart-controls">
        <div className="form-group">
          <label className="form-label" htmlFor="chartExerciseSelect">Exercise</label>
          <select
            id="chartExerciseSelect"
            className="workout-text-input"
            value={chartExercise}
            onChange={(e) => setChartExercise(e.target.value)}
            disabled={loggedExerciseNames.length === 0}
          >
            {loggedExerciseNames.length === 0 ? (
              <option value="">No exercises logged yet</option>
            ) : (
              loggedExerciseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))
            )}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="chartMetricSelect">Metric</label>
          <select
            id="chartMetricSelect"
            className="workout-text-input"
            value={chartMetric}
            onChange={(e) => setChartMetric(e.target.value as any)}
          >
            <option value="weight">Max Weight</option>
            <option value="reps">Max Reps</option>
            <option value="distance">Max Distance (Cardio)</option>
            <option value="duration">Max Duration (Cardio)</option>
          </select>
        </div>
      </div>

      {renderChartSvg()}
    </div>
  )
}
