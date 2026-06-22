import React from 'react'

interface GoalsTabProps {
  goalsForm: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  setGoalsForm: React.Dispatch<React.SetStateAction<{
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }>>;
  goalsError: string | null;
  goalsSuccess: string | null;
  handleUpdateGoals: (e: React.FormEvent) => void;
}

export function GoalsTab({
  goalsForm,
  setGoalsForm,
  goalsError,
  goalsSuccess,
  handleUpdateGoals,
}: GoalsTabProps) {
  const pCal = (parseFloat(goalsForm.protein) || 0) * 4
  const cCal = (parseFloat(goalsForm.carbs) || 0) * 4
  const fCal = (parseFloat(goalsForm.fat) || 0) * 9
  const totalCal = pCal + cCal + fCal

  const pPct = totalCal > 0 ? Math.round((pCal / totalCal) * 100) : 0
  const cPct = totalCal > 0 ? Math.round((cCal / totalCal) * 100) : 0
  const fPct = totalCal > 0 ? 100 - pPct - cPct : 0

  return (
    <div className="tab-goals-panel animate-slide-in">
      <form className="goals-form" onSubmit={handleUpdateGoals}>
        <h3 className="form-sub-title">Set Daily Nutrition Goals</h3>
        
        {goalsError && <div className="form-alert error">{goalsError}</div>}
        {goalsSuccess && <div className="form-alert success">{goalsSuccess}</div>}

        <div className="input-group">
          <label htmlFor="goal-calories">Daily Calorie Target (kcal)</label>
          <input
            id="goal-calories"
            type="number"
            step="any"
            className="field-input"
            placeholder="e.g. 2000"
            value={goalsForm.calories}
            onChange={e => setGoalsForm(prev => ({ ...prev, calories: e.target.value }))}
          />
        </div>

        <div className="macro-inputs-grid">
          <div className="input-group">
            <label htmlFor="goal-protein">Protein Target (g)</label>
            <input
              id="goal-protein"
              type="number"
              step="any"
              className="field-input"
              placeholder="e.g. 130"
              value={goalsForm.protein}
              onChange={e => setGoalsForm(prev => ({ ...prev, protein: e.target.value }))}
            />
          </div>
          <div className="input-group">
            <label htmlFor="goal-carbs">Carbs Target (g)</label>
            <input
              id="goal-carbs"
              type="number"
              step="any"
              className="field-input"
              placeholder="e.g. 220"
              value={goalsForm.carbs}
              onChange={e => setGoalsForm(prev => ({ ...prev, carbs: e.target.value }))}
            />
          </div>
          <div className="input-group">
            <label htmlFor="goal-fat">Fat Target (g)</label>
            <input
              id="goal-fat"
              type="number"
              step="any"
              className="field-input"
              placeholder="e.g. 70"
              value={goalsForm.fat}
              onChange={e => setGoalsForm(prev => ({ ...prev, fat: e.target.value }))}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit-goals">
          Update Daily Goals
        </button>
      </form>

      <div className="goals-summary-box">
        <h3 className="form-sub-title">Goal Distribution</h3>
        <div className="macro-distribution-bar">
          {totalCal === 0 ? (
            <p className="no-items-text">Enter goals to see distribution.</p>
          ) : (
            <>
              <div className="dist-bar">
                <div className="dist-segment protein" style={{ width: `${pPct}%` }} title={`Protein: ${pPct}%`} />
                <div className="dist-segment carbs" style={{ width: `${cPct}%` }} title={`Carbs: ${cPct}%`} />
                <div className="dist-segment fat" style={{ width: `${fPct}%` }} title={`Fat: ${fPct}%`} />
              </div>
              <div className="dist-legend">
                <span className="legend-item protein">Protein: {pPct}% (~{Math.round(pCal)} kcal)</span>
                <span className="legend-item carbs">Carbs: {cPct}% (~{Math.round(cCal)} kcal)</span>
                <span className="legend-item fat">Fat: {fPct}% (~{Math.round(fCal)} kcal)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
