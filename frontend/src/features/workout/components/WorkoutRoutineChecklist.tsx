import React, { useState, useEffect } from 'react'
import exercisesData from '../exercises.json'

export interface RoutineItem {
  name: string;
  category: string;
  completed: boolean;
  weight?: string | undefined;
  reps?: string | undefined;
  distanceKm?: string | undefined;
  durationMinutes?: string | undefined;
}

const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getImagePathForGroup = (group: string): string => {
  const g = group.toLowerCase()
  if (g === 'chest') return '/exercises/bench_press.png'
  if (g === 'back') return '/exercises/pull_ups.png'
  if (g === 'legs' || g === 'glutes') return '/exercises/squat.png'
  if (g === 'shoulders') return '/exercises/shoulder_press.png'
  if (g === 'arms') return '/exercises/bicep_curls.png'
  if (g === 'core') return '/exercises/planks.png'
  return '/exercises/cardio.png'
}

const DEFAULT_ROUTINES: Record<string, { name: string; category: string }[]> = {
  'Push Day': [
    { name: 'Dumbbell Press', category: 'Chest' },
    { name: 'Incline Dumbbell Press', category: 'Chest' },
    { name: 'Dumbbell Fly', category: 'Chest' },
    { name: 'Dumbbell Shoulder Press', category: 'Shoulders' },
    { name: 'Lateral Raise', category: 'Shoulders' },
    { name: 'Overhead Tricep Extension', category: 'Arms' },
    { name: 'Dips (tricep focus)', category: 'Arms' }
  ],
  'Pull Day': [
    { name: 'Dumbbell Row', category: 'Back' },
    { name: 'Chest-supported Row', category: 'Back' },
    { name: 'Pull-up', category: 'Back' },
    { name: 'Reverse Fly', category: 'Shoulders' },
    { name: 'Bicep Curl', category: 'Arms' },
    { name: 'Hammer Curl', category: 'Arms' },
    { name: 'Incline Dumbbell Curl', category: 'Arms' }
  ],
  'Legs Day': [
    { name: 'Goblet Squat', category: 'Legs' },
    { name: 'Walking Lunge', category: 'Legs' },
    { name: 'Bulgarian Split Squat', category: 'Legs' },
    { name: 'Romanian Deadlift', category: 'Legs' },
    { name: 'Calf Raise', category: 'Legs' },
    { name: 'Plank', category: 'Core' },
    { name: 'Crunch', category: 'Core' }
  ],
  'Chest & Arms Day': [
    { name: 'Dumbbell Press', category: 'Chest' },
    { name: 'Incline Dumbbell Press', category: 'Chest' },
    { name: 'Dumbbell Fly', category: 'Chest' },
    { name: 'Bicep Curl', category: 'Arms' },
    { name: 'Hammer Curl', category: 'Arms' },
    { name: 'Overhead Tricep Extension', category: 'Arms' },
    { name: 'Dips (tricep focus)', category: 'Arms' }
  ],
  'Back & Shoulders Day': [
    { name: 'Dumbbell Row', category: 'Back' },
    { name: 'Chest-supported Row', category: 'Back' },
    { name: 'Dumbbell Shoulder Press', category: 'Shoulders' },
    { name: 'Lateral Raise', category: 'Shoulders' },
    { name: 'Reverse Fly', category: 'Shoulders' },
    { name: 'Arnold Press', category: 'Shoulders' },
    { name: 'Shrug', category: 'Back' }
  ],
  'Legs & Core Day': [
    { name: 'Goblet Squat', category: 'Legs' },
    { name: 'Walking Lunge', category: 'Legs' },
    { name: 'Bulgarian Split Squat', category: 'Legs' },
    { name: 'Romanian Deadlift', category: 'Legs' },
    { name: 'Plank', category: 'Core' },
    { name: 'Crunch', category: 'Core' },
    { name: 'Leg Raise', category: 'Core' }
  ],
  'Cardio Day': [
    { name: 'Running', category: 'Cardio' },
    { name: 'Cycling', category: 'Cardio' },
    { name: 'Rowing Machine', category: 'Cardio' },
    { name: 'Jump Rope', category: 'Cardio' },
    { name: 'Plank', category: 'Core' }
  ]
}

interface ExerciseGuide {
  instructions: string[];
  imagePath: string;
}

const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {}

exercisesData.forEach(ex => {
  const normalizedName = titleCase(ex.name)
  const instructions = ex.description
    ? ex.description.split('. ').map(s => s.trim()).filter(s => s.length > 0).map(s => s.endsWith('.') ? s : s + '.')
    : []
  
  EXERCISE_GUIDES[normalizedName.toLowerCase()] = {
    instructions,
    imagePath: getImagePathForGroup(ex.group)
  }
})

export interface WorkoutRoutineChecklistProps {
  onQuickLog: (
    name: string,
    category: string,
    weight?: string | undefined,
    reps?: string | undefined,
    distanceKm?: string | undefined,
    durationMinutes?: string | undefined
  ) => void;
  onBulkLog: (
    checkedExercises: {
      name: string;
      category: string;
      weight?: string | undefined;
      reps?: string | undefined;
      distanceKm?: string | undefined;
      durationMinutes?: string | undefined;
    }[]
  ) => Promise<void>;
  isBulkLogging: boolean;
  est1RMMap: Record<string, { value: number; weight: number; reps: number; date: string }>;
  lastLogMap: Record<string, { weight?: string | undefined; reps?: string | undefined; distanceKm?: string | undefined; durationMinutes?: string | undefined; date?: string | undefined }>;
}

export function WorkoutRoutineChecklist({ onQuickLog, onBulkLog, isBulkLogging, est1RMMap, lastLogMap }: WorkoutRoutineChecklistProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<string>('Push Day')
  const [items, setItems] = useState<RoutineItem[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  // Custom item input
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('Chest')

  // Load from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem(`workout_routine_${selectedRoutine.replace(/\s+/g, '_')}`)
    if (saved) {
      try {
        setItems(JSON.parse(saved))
        setExpandedIndex(null)
        return
      } catch (e) {
        console.warn('Failed to parse saved routine', e)
      }
    }
    
    // Fallback to default
    const defaultItems = DEFAULT_ROUTINES[selectedRoutine] || []
    setItems(
      defaultItems.map(item => {
        const itemCat = item.category
        if (itemCat === 'Cardio') {
          return { ...item, completed: false, distanceKm: '5.0', durationMinutes: '30' }
        } else if (itemCat === 'Core') {
          return { ...item, completed: false, weight: '0', reps: '10' }
        } else if (itemCat === 'Chest' || itemCat === 'Legs' || itemCat === 'Back') {
          return { ...item, completed: false, weight: '60', reps: '10' }
        } else {
          return { ...item, completed: false, weight: '15', reps: '10' }
        }
      })
    )
    setExpandedIndex(null)
  }, [selectedRoutine])

  // Save items to localStorage when changed
  const saveItems = (newItems: RoutineItem[]) => {
    setItems(newItems)
    localStorage.setItem(`workout_routine_${selectedRoutine.replace(/\s+/g, '_')}`, JSON.stringify(newItems))
  }

  const handleToggleComplete = (index: number) => {
    const updated = [...items]
    const item = updated[index]
    if (item) {
      const newCompleted = !item.completed
      updated[index] = { ...item, completed: newCompleted }
      saveItems(updated)
      
      // Auto-trigger rest timer countdown
      if (newCompleted) {
        window.dispatchEvent(new CustomEvent('workout-timer-trigger'))
      }
    }
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return
    const isCardio = customCategory === 'Cardio'
    const isCore = customCategory === 'Core'
    const isMajorStrength = ['Chest', 'Legs', 'Back'].includes(customCategory)
    
    const newItem: RoutineItem = {
      name: customName.trim(),
      category: customCategory,
      completed: false,
      weight: isCardio ? undefined : (isCore ? '0' : (isMajorStrength ? '60' : '15')),
      reps: isCardio ? undefined : '10',
      distanceKm: isCardio ? '5.0' : undefined,
      durationMinutes: isCardio ? '30' : undefined
    }
    const updated = [...items, newItem]
    saveItems(updated)
    setCustomName('')
  }

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    saveItems(updated)
    if (expandedIndex === index) {
      setExpandedIndex(null)
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1)
    }
  }

  const handleResetChecklist = () => {
    const updated = items.map(item => ({ ...item, completed: false }))
    saveItems(updated)
  }

  const handleBulkLogClick = async () => {
    const checked = items.filter(item => item.completed)
    if (checked.length === 0) return
    try {
      await onBulkLog(checked)
      handleResetChecklist()
    } catch (e) {
      console.error('Bulk log failed', e)
    }
  }

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  const handleUpdateItemFields = (index: number, fields: Partial<RoutineItem>) => {
    const updated = [...items]
    const item = updated[index]
    if (item) {
      updated[index] = { ...item, ...fields }
      saveItems(updated)
    }
  }

  const checkedItems = items.filter(item => item.completed)

  return (
    <div className="workout-card shadow-sm routine-checklist-card">
      <div className="routine-header-row">
        <h2 className="card-title" style={{ margin: 0 }}>Routine Checklist</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {checkedItems.length > 0 && (
            <button
              type="button"
              className="bulk-log-btn"
              onClick={handleBulkLogClick}
              disabled={isBulkLogging}
            >
              {isBulkLogging ? 'Logging...' : `Log Completed (${checkedItems.length})`}
            </button>
          )}
          <button type="button" className="reset-checklist-btn" onClick={handleResetChecklist} title="Reset all checklist items">
            Reset Checks
          </button>
        </div>
      </div>

      <div className="routine-selector-group">
        <label className="form-label" htmlFor="routineSelect">Select Active Routine</label>
        <select
          id="routineSelect"
          className="workout-text-input"
          value={selectedRoutine}
          onChange={(e) => setSelectedRoutine(e.target.value)}
        >
          {Object.keys(DEFAULT_ROUTINES).map(rName => (
            <option key={rName} value={rName}>{rName}</option>
          ))}
          <option value="Custom Routine">Custom Routine</option>
        </select>
      </div>

      <div className="checklist-items-container">
        {items.length === 0 ? (
          <div className="checklist-empty-text">No exercises in this routine. Add some below!</div>
        ) : (
          items.map((item, idx) => {
            const guide = EXERCISE_GUIDES[item.name.toLowerCase()]
            const est1RM = est1RMMap[item.name.toLowerCase()]
            const lastLog = lastLogMap[item.name.toLowerCase().trim()]
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className={`checklist-item-row ${item.completed ? 'completed' : ''}`}>
                  <label className="checkbox-label-wrapper">
                    <input
                      type="checkbox"
                      className="routine-checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleComplete(idx)}
                    />
                    <span className="custom-checkmark"></span>
                    <span className="checklist-item-text">
                      {item.name}
                      {lastLog && (
                        <span className="checklist-item-last-log" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500, marginTop: '2px' }}>
                          Last: {item.category === 'Cardio' ? `${lastLog.distanceKm} km / ${lastLog.durationMinutes} min` : `${lastLog.weight} kg x ${lastLog.reps} reps`} ({lastLog.date})
                        </span>
                      )}
                    </span>
                  </label>

                  {/* Inline customized performance logger inputs */}
                  <div className="checklist-inline-inputs">
                    {item.category === 'Cardio' ? (
                      <>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          className="checklist-inline-input"
                          value={item.distanceKm || ''}
                          onChange={(e) => handleUpdateItemFields(idx, { distanceKm: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          title="Distance in Kilometers"
                        />
                        <span className="checklist-input-unit">km</span>
                        <input
                          type="number"
                          placeholder="0"
                          className="checklist-inline-input"
                          value={item.durationMinutes || ''}
                          onChange={(e) => handleUpdateItemFields(idx, { durationMinutes: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          title="Duration in Minutes"
                        />
                        <span className="checklist-input-unit">min</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          placeholder="0"
                          className="checklist-inline-input"
                          value={item.weight || ''}
                          onChange={(e) => handleUpdateItemFields(idx, { weight: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          title="Weight in Kilograms"
                        />
                        <span className="checklist-input-unit">kg</span>
                        <input
                          type="number"
                          placeholder="0"
                          className="checklist-inline-input"
                          value={item.reps || ''}
                          onChange={(e) => handleUpdateItemFields(idx, { reps: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          title="Repetitions"
                        />
                        <span className="checklist-input-unit">reps</span>
                      </>
                    )}
                  </div>

                  <div className="checklist-actions">
                    <button
                      type="button"
                      className={`action-icon-btn ${expandedIndex === idx ? 'edit' : ''}`}
                      onClick={() => toggleExpanded(idx)}
                      title="View form guide"
                      style={{ padding: '4px' }}
                    >
                      <svg className="action-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>

                    <span className={`workout-category-tag ${item.category.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {item.category}
                    </span>

                    <button
                      type="button"
                      className="quick-log-action-btn"
                      onClick={() => onQuickLog(item.name, item.category, item.weight, item.reps, item.distanceKm, item.durationMinutes)}
                      title={`Log ${item.name} in sets form`}
                    >
                      Log
                    </button>

                    <button
                      type="button"
                      className="remove-item-action-btn"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remove from checklist"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {expandedIndex === idx && (
                  <div className="exercise-guide-panel">
                    <div className="guide-content">
                      {guide ? (
                        <>
                          <div className="guide-instructions">
                            <strong>Correct Form Tips:</strong>
                            <ul>
                              {guide.instructions.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ul>

                            {/* Estimated 1RM PR statistics display */}
                            {est1RM && (
                              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                <strong>Est. 1-Rep Max (Personal Record):</strong>
                                <span style={{ fontSize: '1.25rem', color: 'var(--accent-color)', fontWeight: 700, display: 'block', marginTop: '4px' }}>
                                  {est1RM.value} kg
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Calculated via Epley formula from {est1RM.weight} kg x {est1RM.reps} reps on {est1RM.date}
                                </span>
                              </div>
                            )}
                          </div>

                        </>
                      ) : (
                        <div className="guide-no-info" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          No detailed form guide available for this exercise.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add custom exercise to checklist */}
      <form onSubmit={handleAddItem} className="add-checklist-item-form">
        <input
          type="text"
          placeholder="Add exercise to list..."
          className="workout-text-input"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          required
        />
        <select
          className="workout-text-input"
          style={{ width: '130px' }}
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
        >
          {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button type="submit" className="add-item-btn-submit">
          Add
        </button>
      </form>
    </div>
  )
}
