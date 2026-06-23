export interface WeightProgressBarProps {
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
  progressPercentage: number;
  progressDirection: 'loss' | 'gain' | 'none';
}

export function WeightProgressBar({
  startingWeight,
  currentWeight,
  targetWeight,
  progressPercentage,
  progressDirection,
}: WeightProgressBarProps) {
  const label = progressDirection === 'loss' 
    ? 'Target Loss Progress' 
    : progressDirection === 'gain' 
      ? 'Target Gain Progress' 
      : 'Target Progress';

  return (
    <div className="weight-progress-bar-card shadow-sm">
      <div className="progress-bar-header">
        <span className="progress-percentage-label">{label}</span>
        <span className="progress-percentage-value">{progressPercentage.toFixed(0)}%</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="progress-footer">
        <span>Start: {startingWeight} kg</span>
        <span>Current: {currentWeight} kg</span>
        <span>Target: {targetWeight} kg</span>
      </div>
    </div>
  )
}
