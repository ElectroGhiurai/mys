import React from 'react'

export interface WeightGoalsFormProps {
  startingWeightInput: string;
  setStartingWeightInput: (val: string) => void;
  targetWeightInput: string;
  setTargetWeightInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function WeightGoalsForm({
  startingWeightInput,
  setStartingWeightInput,
  targetWeightInput,
  setTargetWeightInput,
  onSubmit,
  onCancel,
  isLoading,
}: WeightGoalsFormProps) {
  return (
    <div className="goals-setup-panel">
      <h2 className="panel-title">Configure Target Weights</h2>
      <form onSubmit={onSubmit} className="goals-setup-form">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="startingWeightInput">Starting Weight (kg)</label>
            <input
              id="startingWeightInput"
              type="number"
              step="0.1"
              className="weight-text-input"
              placeholder="e.g. 85.0"
              value={startingWeightInput}
              onChange={(e) => setStartingWeightInput(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="targetWeightInput">Target Weight (kg)</label>
            <input
              id="targetWeightInput"
              type="number"
              step="0.1"
              className="weight-text-input"
              placeholder="e.g. 75.0"
              value={targetWeightInput}
              onChange={(e) => setTargetWeightInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button id="save-goals-btn" type="submit" className="save-goals-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Goals'}
          </button>
          <button 
            id="cancel-goals-btn"
            type="button" 
            className="cancel-goals-btn" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
