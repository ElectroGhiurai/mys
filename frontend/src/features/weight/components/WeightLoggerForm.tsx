import React from 'react'

export interface WeightLoggerFormProps {
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  weightInput: string;
  setWeightInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  logSuccess: string | null;
}

export function WeightLoggerForm({
  selectedDate,
  setSelectedDate,
  weightInput,
  setWeightInput,
  onSubmit,
  isLoading,
  logSuccess,
}: WeightLoggerFormProps) {
  return (
    <div className="weight-card shadow-sm">
      <h2 className="card-title">Log Today's Weight</h2>
      {logSuccess && (
        <div className="weight-alert weight-alert-success inner-alert">
          <div className="alert-content">{logSuccess}</div>
        </div>
      )}
      <form onSubmit={onSubmit} className="weight-log-form">
        <div className="form-group">
          <label className="form-label" htmlFor="logDateInput">Date</label>
          <input
            id="logDateInput"
            type="date"
            className="weight-text-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="logWeightInput">Weight (kg)</label>
          <input
            id="logWeightInput"
            type="number"
            step="0.1"
            placeholder="e.g. 78.5"
            className="weight-text-input"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <button id="submit-log-btn" type="submit" className="submit-log-btn" disabled={isLoading}>
          {isLoading ? 'Logging...' : 'Log Weight'}
        </button>
      </form>
    </div>
  )
}
