import { DailySummaryDto, TrackedIngredient } from '../tracker.api'

interface CalorieHistoryChartProps {
  selectedDate: string;
  onDateSelect: (dateStr: string) => void;
  calorieGoal: number;
  rangeIngredients: TrackedIngredient[];
}

export function CalorieHistoryChart({
  selectedDate,
  onDateSelect,
  calorieGoal,
  rangeIngredients,
}: CalorieHistoryChartProps) {
  // Compute 7 days centered around selectedDate in-memory (from selectedDate - 3 to selectedDate + 3)
  const data: DailySummaryDto[] = []
  const [year, month, day] = selectedDate.split('-').map(Number)
  
  if (year && month && day) {
    for (let i = -3; i <= 3; i++) {
      const d = new Date(Date.UTC(year, month - 1, day + i))
      const dateStr = d.toISOString().split('T')[0] ?? ''
      
      const dayIngredients = rangeIngredients.filter(item => item.trackedDate === dateStr)
      const calories = dayIngredients.reduce((sum, item) => sum + item.caloriesPer100g * (item.weight / 100), 0)
      const protein = dayIngredients.reduce((sum, item) => sum + item.proteinPer100g * (item.weight / 100), 0)
      const carbs = dayIngredients.reduce((sum, item) => sum + item.carbsPer100g * (item.weight / 100), 0)
      const fat = dayIngredients.reduce((sum, item) => sum + item.fatPer100g * (item.weight / 100), 0)
      
      data.push({
        date: dateStr,
        calories,
        protein,
        carbs,
        fat,
      })
    }
  }

  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    if (!year || !month || !day) return
    const date = new Date(Date.UTC(year, month - 1, day - 1))
    onDateSelect(date.toISOString().split('T')[0] ?? '')
  }

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    if (!year || !month || !day) return
    const date = new Date(Date.UTC(year, month - 1, day + 1))
    onDateSelect(date.toISOString().split('T')[0] ?? '')
  }

  const formatRangeLabel = () => {
    if (data.length === 0) return ''
    try {
      const getFormatted = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        if (!year || !month || !day) return ''
        const date = new Date(Date.UTC(year, month - 1, day))
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
        return date.toLocaleDateString('en-US', options)
      }
      return `${getFormatted(data[0]!.date)} - ${getFormatted(data[data.length - 1]!.date)}`
    } catch {
      return ''
    }
  }

  // Chart layout dimensions
  const width = 600
  const height = 280
  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 40
  const paddingBottom = 40

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Find max value to scale heights
  const maxCalories = Math.max(
    ...data.map(d => d.calories),
    calorieGoal || 2000,
    1000
  )

  // Format date helper: "Mon 22" (timezone-safe)
  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number)
      if (!year || !month || !day) return dateStr
      const date = new Date(Date.UTC(year, month - 1, day))
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', timeZone: 'UTC' }
      return date.toLocaleDateString('en-US', options)
    } catch {
      return dateStr
    }
  }

  // Check if date is the currently selected date
  const isSelectedDate = (dateStr: string) => {
    return dateStr === selectedDate
  }

  return (
    <div className="panel-card history-chart-card">
      <div className="chart-header">
        <h2 className="panel-title" style={{ margin: 0 }}>Calorie History</h2>
        <div className="chart-nav-controls">
          <button className="chart-nav-btn" onClick={handlePrevDay} title="Previous Day">&larr; Prev</button>
          <span className="chart-range-label">{formatRangeLabel()}</span>
          <button className="chart-nav-btn" onClick={handleNextDay} title="Next Day">Next &rarr;</button>
        </div>
      </div>
      
      <div className="chart-wrapper">
        {data.length === 0 ? (
          <div className="chart-empty">Loading history...</div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="history-svg">
            <defs>
              <linearGradient id="activeBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-color, #ff7b00)" />
                <stop offset="100%" stopColor="#ff4500" />
              </linearGradient>
              <linearGradient id="defaultBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4facfe" />
                <stop offset="100%" stopColor="#00f2fe" />
              </linearGradient>
              <linearGradient id="overGoalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f857a6" />
                <stop offset="100%" stopColor="#ff5858" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.5, 1].map((ratio, idx) => {
              const y = paddingTop + chartHeight * (1 - ratio)
              const val = Math.round(maxCalories * ratio)
              return (
                <g key={idx} className="chart-grid-line">
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#333" strokeDasharray="4 4" />
                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#999">
                    {val}
                  </text>
                </g>
              )
            })}

            {/* Goal Line */}
            {(() => {
              const y = paddingTop + chartHeight * (1 - calorieGoal / maxCalories)
              return (
                <g className="chart-goal-line">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#ff5252"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <text x={width - paddingRight - 8} y={y - 6} textAnchor="end" fontSize="11" fill="#ff5252" fontWeight="bold">
                    Target: {Math.round(calorieGoal)} kcal
                  </text>
                </g>
              )
            })()}

            {/* Bars */}
            {data.map((item, index) => {
              const barWidth = 46
              const barSpacing = data.length > 1
                ? (chartWidth - barWidth * data.length) / (data.length - 1)
                : 0
              const x = paddingLeft + index * (barWidth + barSpacing)

              const valRatio = item.calories / maxCalories
              const barHeight = Math.max(chartHeight * valRatio, 4)
              const y = paddingTop + chartHeight - barHeight

              const active = isSelectedDate(item.date)
              const overGoal = item.calories > calorieGoal

              let fill = 'url(#defaultBarGrad)'
              if (active) {
                fill = 'url(#activeBarGrad)'
              } else if (overGoal) {
                fill = 'url(#overGoalGrad)'
              }

              return (
                <g
                  key={item.date}
                  className={`chart-bar-group ${active ? 'active' : ''}`}
                  onClick={() => onDateSelect(item.date)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={x - 4}
                    y={paddingTop}
                    width={barWidth + 8}
                    height={chartHeight}
                    fill="transparent"
                  />

                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill={fill}
                    className="chart-bar"
                  />

                  {/* Value label on top of bar */}
                  {item.calories > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="12"
                      fill={active ? '#fff' : '#ccc'}
                      fontWeight={active ? 'bold' : 'normal'}
                    >
                      {Math.round(item.calories)}
                    </text>
                  )}

                  {/* X Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={height - paddingBottom + 22}
                    textAnchor="middle"
                    fontSize="12"
                    fill={active ? 'var(--accent-color, #ff7b00)' : '#888'}
                    fontWeight={active ? 'bold' : 'normal'}
                  >
                    {formatDateLabel(item.date)}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}
