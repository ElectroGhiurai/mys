import { useId } from 'react'
import { WeightLog } from '../weight.api'

export interface WeightTrendChartProps {
  weights: WeightLog[];
  startingWeight: number | null;
  targetWeight: number | null;
}

export function WeightTrendChart({
  weights,
  startingWeight,
  targetWeight,
}: WeightTrendChartProps) {
  const gradientId = useId()
  if (weights.length === 0) {
    return (
      <div className="chart-placeholder">
        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
        <p>No weight logs yet. Start logging your weight above to build your progress chart!</p>
      </div>
    )
  }

  const width = 600
  const height = 260
  const padding = { left: 45, right: 20, top: 20, bottom: 35 }

  // Sort weights chronologically
  const sorted = [...weights].sort((a, b) => new Date(a.loggedDate).getTime() - new Date(b.loggedDate).getTime())

  // Min and max values for scaling
  const loggedWeights = sorted.map(w => w.weightKg)
  let minW = Math.min(...loggedWeights)
  let maxW = Math.max(...loggedWeights)

  // Add starting and target weights to chart range if they exist for context
  if (startingWeight !== null) {
    minW = Math.min(minW, startingWeight)
    maxW = Math.max(maxW, startingWeight)
  }
  if (targetWeight !== null) {
    minW = Math.min(minW, targetWeight)
    maxW = Math.max(maxW, targetWeight)
  }

  // Pad weight range by 1.5kg on each end
  minW = Math.max(0, minW - 1.5)
  maxW = maxW + 1.5
  const weightRange = maxW - minW || 1

  // Build points coordinates
  const points = sorted.map((w, idx) => {
    const x = padding.left + (idx / Math.max(1, sorted.length - 1)) * (width - padding.left - padding.right)
    const y = height - padding.bottom - ((w.weightKg - minW) / weightRange) * (height - padding.top - padding.bottom)
    return { x, y, weight: w.weightKg, date: w.loggedDate }
  })

  // Line paths
  let linePathD = ''
  let areaPathD = ''

  if (points.length === 1) {
    // Draw a horizontal line if only 1 point
    const p = points[0]
    if (p) {
      linePathD = `M ${padding.left} ${p.y} H ${width - padding.right}`
      areaPathD = `M ${padding.left} ${p.y} H ${width - padding.right} V ${height - padding.bottom} H ${padding.left} Z`
    }
  } else if (points.length > 1) {
    // Build standard smooth path
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

  const yTicksCount = 5
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    const val = minW + (i / (yTicksCount - 1)) * weightRange
    const y = height - padding.bottom - (i / (yTicksCount - 1)) * (height - padding.top - padding.bottom)
    return { val: val.toFixed(1), y }
  })

  // Format dates for X Axis labels (take max 5 labels to prevent clutter)
  const xTicksIndices = points.length <= 5 
    ? points.map((_, i) => i) 
    : [0, Math.floor(points.length * 0.25), Math.floor(points.length * 0.5), Math.floor(points.length * 0.75), points.length - 1]

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
            <line 
              x1={padding.left} 
              y1={tick.y} 
              x2={width - padding.right} 
              y2={tick.y} 
              stroke="var(--border-color)" 
              strokeDasharray="4,4" 
            />
            <text 
              x={padding.left - 8} 
              y={tick.y + 4} 
              textAnchor="end" 
              fill="var(--text-muted)" 
              fontSize="10" 
              fontWeight="500"
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* Target Weight horizontal reference line if set */}
        {targetWeight !== null && targetWeight >= minW && targetWeight <= maxW && (
          <g className="target-ref-line-group">
            <line
              x1={padding.left}
              y1={height - padding.bottom - ((targetWeight - minW) / weightRange) * (height - padding.top - padding.bottom)}
              x2={width - padding.right}
              y2={height - padding.bottom - ((targetWeight - minW) / weightRange) * (height - padding.top - padding.bottom)}
              stroke="var(--success-color)"
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />
            <text
              x={width - padding.right - 4}
              y={height - padding.bottom - ((targetWeight - minW) / weightRange) * (height - padding.top - padding.bottom) - 4}
              textAnchor="end"
              fill="var(--success-color)"
              fontSize="9"
              fontWeight="600"
            >
              Target: {targetWeight} kg
            </text>
          </g>
        )}

        {/* Filled Area */}
        {areaPathD && (
          <path d={areaPathD} fill={`url(#${gradientId})`} />
        )}

        {/* Line Path */}
        {linePathD && (
          <path 
            d={linePathD} 
            fill="none" 
            stroke="var(--accent-color)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Dots and Hover Targets */}
        {points.map((p, i) => {
          const dateObj = new Date(p.date)
          const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return (
            <g key={i} className="chart-dot-group">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4" 
                fill="var(--accent-color)" 
                stroke="var(--surface-color)" 
                strokeWidth="2" 
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="12" 
                fill="transparent" 
                style={{ cursor: 'pointer' }}
              >
                <title>{`${p.weight} kg on ${formattedDate}`}</title>
              </circle>
            </g>
          )
        })}

        {/* X Axis Labels */}
        {xTicksIndices.map((idx) => {
          const p = points[idx]
          if (!p) return null
          const dateObj = new Date(p.date)
          const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return (
            <text 
              key={idx}
              x={p.x} 
              y={height - padding.bottom + 18} 
              textAnchor="middle" 
              fill="var(--text-muted)" 
              fontSize="10"
              fontWeight="500"
            >
              {formattedDate}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
