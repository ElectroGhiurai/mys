export interface WeightMetricsGridProps {
  startingWeight: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  weightDifference: number;
  progressDirection: 'loss' | 'gain' | 'none';
}

export function WeightMetricsGrid({
  startingWeight,
  currentWeight,
  targetWeight,
  weightDifference,
  progressDirection,
}: WeightMetricsGridProps) {
  return (
    <div className="weight-metrics-grid">
      <div className="metric-card shadow-sm">
        <span className="metric-label">Starting Weight</span>
        <span className="metric-value">
          {startingWeight !== null ? `${startingWeight} kg` : '--'}
        </span>
      </div>

      <div className="metric-card shadow-sm highlight-card">
        <span className="metric-label">Current Weight</span>
        <span className="metric-value">
          {currentWeight !== null ? `${currentWeight} kg` : '--'}
        </span>
      </div>

      <div className="metric-card shadow-sm">
        <span className="metric-label">Target Weight</span>
        <span className="metric-value">
          {targetWeight !== null ? `${targetWeight} kg` : '--'}
        </span>
      </div>

      <div className="metric-card shadow-sm">
        <span className="metric-label">
          {progressDirection === 'gain' ? 'Total Gained' : 'Total Lost'}
        </span>
        <span className={`metric-value ${weightDifference < 0 ? 'loss-text' : weightDifference > 0 ? 'gain-text' : ''}`}>
          {startingWeight !== null && currentWeight !== null 
            ? `${Math.abs(weightDifference).toFixed(1)} kg` 
            : '--'}
        </span>
      </div>
    </div>
  )
}
