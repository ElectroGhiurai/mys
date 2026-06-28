import React from 'react'

export interface SetInput {
  weight: string;
  reps: string;
  distanceKm: string;
  durationMinutes: string;
}

export interface WorkoutLoggerFormProps {
  editingId: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  exerciseName: string;
  setExerciseName: (name: string) => void;
  isCustomExercise: boolean;
  setIsCustomExercise: (val: boolean) => void;
  customExerciseName: string;
  setCustomExerciseName: (name: string) => void;
  sets: SetInput[];
  onSetChange: (index: number, field: 'weight' | 'reps' | 'distanceKm' | 'durationMinutes', value: string) => void;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLogging: boolean;
  onCancelEdit: () => void;
  categories: string[];
  predefinedExercises: { name: string; category: string }[];
  onPredefinedChange: (name: string) => void;
  selectedEquipment: string[];
  onToggleEquipment: (eq: string) => void;
  onClearEquipment: () => void;
  allEquipment: string[];
}

export function WorkoutLoggerForm({
  editingId,
  selectedDate,
  setSelectedDate,
  category,
  setCategory,
  exerciseName,
  isCustomExercise,
  setIsCustomExercise,
  customExerciseName,
  setCustomExerciseName,
  sets,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onSubmit,
  isLogging,
  onCancelEdit,
  categories,
  predefinedExercises,
  onPredefinedChange,
  selectedEquipment,
  onToggleEquipment,
  onClearEquipment,
  allEquipment,
}: WorkoutLoggerFormProps) {
  return (
    <div className="workout-card shadow-sm">
      <h2 className="card-title">
        {editingId ? 'Edit Workout Session' : 'Log Exercise Session'}
      </h2>
      <form onSubmit={onSubmit} className="workout-log-form">
        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label" htmlFor="workoutDateInput">Date</label>
            <input
              id="workoutDateInput"
              type="date"
              className="workout-text-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="workoutCategorySelect">Category</label>
            <select
              id="workoutCategorySelect"
              className="workout-text-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {!isCustomExercise && allEquipment.length > 0 && (
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Filter by Equipment</label>
            <div className="equipment-pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {allEquipment.map(eq => {
                const isSelected = selectedEquipment.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    className={`equipment-filter-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => onToggleEquipment(eq)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(91, 114, 244, 0.1)' : 'var(--surface-color-2)',
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-color)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    {eq.charAt(0).toUpperCase() + eq.slice(1)}
                  </button>
                );
              })}
              {selectedEquipment.length > 0 && (
                <button
                  type="button"
                  onClick={onClearEquipment}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: '1px dashed var(--error-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--error-color)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    outline: 'none'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="exerciseNameInput">Exercise Name</label>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.8rem', cursor: 'pointer' }}
              onClick={() => setIsCustomExercise(!isCustomExercise)}
            >
              {isCustomExercise ? 'Choose Predefined' : 'Write Custom'}
            </button>
          </div>

          {isCustomExercise ? (
            <input
              id="exerciseNameInput"
              type="text"
              placeholder="e.g. Incline DB Flys"
              className="workout-text-input"
              value={customExerciseName}
              onChange={(e) => setCustomExerciseName(e.target.value)}
              required
            />
          ) : (
            <select
              id="exerciseNameInput"
              className="workout-text-input"
              value={exerciseName}
              onChange={(e) => onPredefinedChange(e.target.value)}
            >
              {predefinedExercises.map(pe => (
                <option key={pe.name} value={pe.name}>{pe.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Dynamic Sets List */}
        <div className="sets-manager-container">
          <h3 className="form-label" style={{ marginBottom: '12px' }}>Sets details</h3>
          
          <div className="sets-header-row">
            <span className="sets-header-label">Set</span>
            <span className="sets-header-label">
              {category === 'Cardio' ? 'Distance (km)' : 'Weight (kg)'}
            </span>
            <span className="sets-header-label">
              {category === 'Cardio' ? 'Duration (mins)' : 'Reps'}
            </span>
            <span className="sets-header-label"></span>
          </div>

          {sets.map((set, idx) => (
            <div key={idx} className="set-row">
              <div className="set-number-badge">{idx + 1}</div>
              
              {category === 'Cardio' ? (
                <>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.2"
                    aria-label={`Set ${idx + 1} distance in kilometers`}
                    className="workout-text-input"
                    value={set.distanceKm}
                    onChange={(e) => onSetChange(idx, 'distanceKm', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    aria-label={`Set ${idx + 1} duration in minutes`}
                    className="workout-text-input"
                    value={set.durationMinutes}
                    onChange={(e) => onSetChange(idx, 'durationMinutes', e.target.value)}
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 80"
                    aria-label={`Set ${idx + 1} weight in kilograms`}
                    className="workout-text-input"
                    value={set.weight}
                    onChange={(e) => onSetChange(idx, 'weight', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    aria-label={`Set ${idx + 1} repetitions`}
                    className="workout-text-input"
                    value={set.reps}
                    onChange={(e) => onSetChange(idx, 'reps', e.target.value)}
                    required
                  />
                </>
              )}

              <button
                type="button"
                className="remove-set-btn"
                onClick={() => onRemoveSet(idx)}
                disabled={sets.length === 1}
                aria-label={`Remove Set ${idx + 1}`}
              >
                <svg className="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          ))}

          <div className="add-set-btn-wrapper">
            <button type="button" className="add-set-btn" onClick={onAddSet}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Set
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            className="submit-log-btn"
            style={{ flexGrow: 1 }}
            disabled={isLogging}
          >
            {isLogging ? 'Saving...' : editingId ? 'Update Workout' : 'Log Workout'}
          </button>
          {editingId && (
            <button
              type="button"
              className="cancel-edit-btn"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
