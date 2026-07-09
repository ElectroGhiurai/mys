import { useState, useEffect } from 'react'
import exercisesData from '../exercises.json'

export interface RoutineItem {
  name: string;
  category: string;
  completed: boolean;
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

const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function WorkoutMuscleMap() {
  const [selectedRoutine, setSelectedRoutine] = useState<string>('Push Day')
  const [items, setItems] = useState<RoutineItem[]>([])
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)

  // Load items from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem(`workout_routine_${selectedRoutine.replace(/\s+/g, '_')}`)
    if (saved) {
      try {
        setItems(JSON.parse(saved))
        return
      } catch (e) {
        console.warn('Failed to parse saved routine', e)
      }
    }
    
    // Fallback to default
    const defaultItems = DEFAULT_ROUTINES[selectedRoutine] || []
    setItems(defaultItems.map(item => ({ ...item, completed: false })))
  }, [selectedRoutine])

  const getSpecificTargets = (): string[] => {
    const list = new Set<string>()
    items.forEach(item => {
      const nameLower = item.name.toLowerCase().trim()
      const match = exercisesData.find(ex => ex.name.toLowerCase().trim() === nameLower)
      if (match) {
        if (match.primaryMuscles) match.primaryMuscles.forEach(t => list.add(t))
        if (match.secondaryMuscles) match.secondaryMuscles.forEach(t => list.add(t))
      } else {
        const subMatch = exercisesData.find(ex => ex.name.toLowerCase().includes(nameLower) || nameLower.includes(ex.name.toLowerCase()))
        if (subMatch) {
          if (subMatch.primaryMuscles) subMatch.primaryMuscles.forEach(t => list.add(t))
          if (subMatch.secondaryMuscles) subMatch.secondaryMuscles.forEach(t => list.add(t))
        }
      }
    })
    return Array.from(list).map(t => t.charAt(0).toUpperCase() + t.slice(1))
  }

  const getExercisesForMuscle = (muscle: string): string[] => {
    const m = muscle.toLowerCase()
    return items
      .filter(item => {
        const cat = item.category.toLowerCase()
        if (m === 'chest') return cat === 'chest'
        if (m === 'traps' || m === 'upperback' || m === 'lats') return cat === 'back'
        if (m === 'shoulders') return cat === 'shoulders'
        if (m === 'biceps' || m === 'triceps' || m === 'forearms') return cat === 'arms'
        if (m === 'abs' || m === 'obliques') return cat === 'core'
        if (m === 'quads' || m === 'hamstrings' || m === 'glutes' || m === 'calves') return cat === 'legs'
        return false
      })
      .map(item => item.name)
  }

  const getCategoryStats = () => {
    const stats: Record<string, { count: number; exercises: string[]; color: string }> = {
      'Chest': { count: 0, exercises: [], color: '#ff4757' },
      'Back': { count: 0, exercises: [], color: '#3498db' },
      'Legs': { count: 0, exercises: [], color: '#1abc9c' },
      'Shoulders': { count: 0, exercises: [], color: '#f1c40f' },
      'Arms': { count: 0, exercises: [], color: '#9b5de5' },
      'Core': { count: 0, exercises: [], color: '#2ed573' },
      'Cardio': { count: 0, exercises: [], color: '#e67e22' }
    }

    items.forEach(item => {
      const cat = item.category
      if (stats[cat]) {
        stats[cat].count++
        stats[cat].exercises.push(item.name)
      }
    })

    return Object.entries(stats)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        percentage: items.length > 0 ? Math.round((data.count / items.length) * 100) : 0,
        ...data
      }))
  }

  const specificTargets = getSpecificTargets()
  const categoryStats = getCategoryStats()

  const getMuscleFill = (muscleName: string) => {
    if (selectedMuscle === muscleName) {
      const targeted = getExercisesForMuscle(muscleName).length > 0
      return targeted ? '#3498db' : 'rgba(255, 255, 255, 0.35)'
    }
    if (hoveredMuscle === muscleName) {
      return 'rgba(255, 255, 255, 0.18)'
    }
    return 'rgba(255, 255, 255, 0.08)'
  }

  const exercisesForSelected = selectedMuscle ? getExercisesForMuscle(selectedMuscle) : []
  const isSelectedTargeted = exercisesForSelected.length > 0

  return (
    <div className="workout-card shadow-sm animate-slide-up" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ margin: '0 0 4px 0' }}>Interactive Muscle Map</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tap muscles on the diagram to inspect targeted exercises</span>
      </div>

      <div className="routine-selector-group" style={{ marginBottom: '24px' }}>
        <label className="form-label" htmlFor="muscleMapRoutineSelect">Select Routine to Inspect</label>
        <select
          id="muscleMapRoutineSelect"
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

      <div className="muscle-map-flex-container">
        
        {/* Large Centered Visualizer Section with relative layout */}
        <div className="muscle-visualizer-section" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '24px',
          minHeight: '340px',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Floating Toggle Controls Overlay */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '2px',
            gap: '2px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <button
              type="button"
              onClick={() => setViewSide('front')}
              style={{
                background: viewSide === 'front' ? 'var(--accent-color)' : 'none',
                color: viewSide === 'front' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setViewSide('back')}
              style={{
                background: viewSide === 'back' ? 'var(--accent-color)' : 'none',
                color: viewSide === 'back' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Back
            </button>
          </div>

          {viewSide === 'front' ? (
            <svg width="100%" height="280" viewBox="0 0 100 155" style={{ maxWidth: '240px', display: 'block' }}>
              <g transform="translate(50, 5)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5">
                {/* Head */}
                <g
                  onClick={() => setSelectedMuscle('neck')}
                  onMouseEnter={() => setHoveredMuscle('neck')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <ellipse cx="0" cy="10" rx="5" ry="7" fill={getMuscleFill('neck')} />
                  <path d="M -2.5 17 Q -2.5 24, 0 24 Q 2.5 24, 2.5 17 Z" fill={getMuscleFill('neck')} />
                </g>

                {/* Traps */}
                <g
                  onClick={() => setSelectedMuscle('traps')}
                  onMouseEnter={() => setHoveredMuscle('traps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -2.5 18 C -6 18, -12 21, -15 25 L -8 30 L -2.5 24 Z" fill={getMuscleFill('traps')} />
                  <path d="M 2.5 18 C 6 18, 12 21, 15 25 L 8 30 L 2.5 24 Z" fill={getMuscleFill('traps')} />
                </g>

                {/* Shoulders */}
                <g
                  onClick={() => setSelectedMuscle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -15 24 C -20 25, -23 29, -24 35 C -24 40, -22 41, -19 39 C -17 38, -16 31, -15 24 Z" fill={getMuscleFill('shoulders')} />
                  <path d="M 15 24 C 20 25, 23 29, 24 35 C 24 40, 22 41, 19 39 C 17 38, 16 31, 15 24 Z" fill={getMuscleFill('shoulders')} />
                </g>

                {/* Chest */}
                <g
                  onClick={() => setSelectedMuscle('chest')}
                  onMouseEnter={() => setHoveredMuscle('chest')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -15 25 C -10 25, -5 25, -0.8 26.5 C -0.8 33, -2 38, -7 38 C -11 38, -14 34, -15 25 Z" fill={getMuscleFill('chest')} />
                  <path d="M 15 25 C 10 25, 5 25, 0.8 26.5 C 0.8 33, 2 38, 7 38 C 11 38, 14 34, 15 25 Z" fill={getMuscleFill('chest')} />
                </g>

                {/* Abs */}
                <g
                  onClick={() => setSelectedMuscle('abs')}
                  onMouseEnter={() => setHoveredMuscle('abs')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -6 39 H 6 V 62 H -6 Z" fill={getMuscleFill('abs')} />
                  <line x1="0" y1="39" x2="0" y2="62" stroke="#ffffff" strokeWidth="0.4" />
                  <line x1="-6" y1="45" x2="6" y2="45" stroke="#ffffff" strokeWidth="0.4" />
                  <line x1="-6" y1="51" x2="6" y2="51" stroke="#ffffff" strokeWidth="0.4" />
                  <line x1="-6" y1="57" x2="6" y2="57" stroke="#ffffff" strokeWidth="0.4" />
                </g>

                {/* Obliques */}
                <g
                  onClick={() => setSelectedMuscle('obliques')}
                  onMouseEnter={() => setHoveredMuscle('obliques')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -15 39 C -15 39, -12 39, -12 50 C -12 58, -13 62, -15 62 C -16.5 54, -16.5 46, -15 39 Z" fill={getMuscleFill('obliques')} />
                  <path d="M 15 39 C 15 39, 12 39, 12 50 C 12 58, 13 62, 15 62 C 16.5 54, 16.5 46, 15 39 Z" fill={getMuscleFill('obliques')} />
                </g>

                {/* Biceps */}
                <g
                  onClick={() => setSelectedMuscle('biceps')}
                  onMouseEnter={() => setHoveredMuscle('biceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -23 35 C -25 38, -25 45, -23 48 C -21 48, -20 44, -20 35 Z" fill={getMuscleFill('biceps')} />
                  <path d="M 23 35 C 25 38, 25 45, 23 48 C 21 48, 20 44, 20 35 Z" fill={getMuscleFill('biceps')} />
                </g>

                {/* Forearms */}
                <g
                  onClick={() => setSelectedMuscle('forearms')}
                  onMouseEnter={() => setHoveredMuscle('forearms')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -23 49 C -24.5 54, -23.5 62, -22 66 C -20 66, -19 59, -20 49 Z" fill={getMuscleFill('forearms')} />
                  <path d="M 23 49 C 24.5 54, 23.5 62, 22 66 C 20 66, 19 59, 20 49 Z" fill={getMuscleFill('forearms')} />
                </g>

                {/* Quads */}
                <g
                  onClick={() => setSelectedMuscle('quads')}
                  onMouseEnter={() => setHoveredMuscle('quads')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -12 63 C -15 75, -14 96, -9 104 C -6 104, -6 95, -6 63 Z" fill={getMuscleFill('quads')} />
                  <path d="M 12 63 C 15 75, 13 96, 9 104 C 6 104, 6 95, 6 63 Z" fill={getMuscleFill('quads')} />
                </g>

                {/* Support paths */}
                <g fill="rgba(255, 255, 255, 0.04)">
                  <path d="M -21 66 C -22 70, -21 75, -20 75 C -19 75, -19 70, -20 66 Z" />
                  <path d="M 21 66 C 22 70, 21 75, 20 75 C 19 75, 19 70, 20 66 Z" />
                  <ellipse cx="-7.5" cy="107" rx="2" ry="2" />
                  <ellipse cx="7.5" cy="107" rx="2" ry="2" />
                  <path d="M -9 136 C -11 140, -12 144, -9 144 C -7 144, -7 140, -8 136 Z" />
                  <path d="M 9 136 C 10 140, 11 144, 9 144 C 7 144, 7 140, 8 136 Z" />
                </g>

                {/* Calves */}
                <g
                  onClick={() => setSelectedMuscle('calves')}
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -9 109 C -12 116, -12 126, -9 135 C -7 135, -6 126, -6.5 109 Z" fill={getMuscleFill('calves')} />
                  <path d="M 9 109 C 12 116, 12 126, 9 135 C 7 135, 6 126, 6.5 109 Z" fill={getMuscleFill('calves')} />
                </g>
              </g>
            </svg>
          ) : (
            <svg width="100%" height="280" viewBox="0 0 100 155" style={{ maxWidth: '240px', display: 'block' }}>
              <g transform="translate(50, 5)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5">
                {/* Head */}
                <g
                  onClick={() => setSelectedMuscle('neck')}
                  onMouseEnter={() => setHoveredMuscle('neck')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <ellipse cx="0" cy="10" rx="5" ry="7" fill={getMuscleFill('neck')} />
                  <path d="M -2.5 17 Q -2.5 24, 0 24 Q 2.5 24, 2.5 17 Z" fill={getMuscleFill('neck')} />
                </g>

                {/* Traps */}
                <g
                  onClick={() => setSelectedMuscle('traps')}
                  onMouseEnter={() => setHoveredMuscle('traps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -2.5 18 C -6 18, -12 21, -15 25 L -8 30 L -2.5 24 Z" fill={getMuscleFill('traps')} />
                  <path d="M 2.5 18 C 6 18, 12 21, 15 25 L 8 30 L 2.5 24 Z" fill={getMuscleFill('traps')} />
                </g>

                {/* Shoulders */}
                <g
                  onClick={() => setSelectedMuscle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle('shoulders')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -15 24 C -20 25, -23 29, -24 35 C -24 40, -22 41, -19 39 C -17 38, -16 31, -15 24 Z" fill={getMuscleFill('shoulders')} />
                  <path d="M 15 24 C 20 25, 23 29, 24 35 C 24 40, 22 41, 19 39 C 17 38, 16 31, 15 24 Z" fill={getMuscleFill('shoulders')} />
                </g>

                {/* Upper Back (Lats) */}
                <g
                  onClick={() => setSelectedMuscle('upperback')}
                  onMouseEnter={() => setHoveredMuscle('upperback')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -15 25 C -10 25, -5 25, -0.8 26.5 C -0.8 33, -2 40, -6 45 C -11 45, -14 36, -15 25 Z" fill={getMuscleFill('upperback')} />
                  <path d="M 15 25 C 10 25, 5 25, 0.8 26.5 C 0.8 33, 2 40, 6 45 C 10 45, 14 36, 15 25 Z" fill={getMuscleFill('upperback')} />
                </g>

                {/* Lower Back */}
                <g
                  onClick={() => setSelectedMuscle('lowerback')}
                  onMouseEnter={() => setHoveredMuscle('lowerback')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -6 45 H 6 V 62 H -6 Z" fill={getMuscleFill('lowerback')} />
                </g>

                {/* Obliques */}
                <g
                  onClick={() => setSelectedMuscle('back')}
                  onMouseEnter={() => setHoveredMuscle('back')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -15 39 C -15 39, -12 39, -12 50 C -12 58, -13 62, -15 62 C -16.5 54, -16.5 46, -15 39 Z" fill={getMuscleFill('back')} />
                  <path d="M 15 39 C 15 39, 12 39, 12 50 C 12 58, 13 62, 15 62 C 16.5 54, 16.5 46, 15 39 Z" fill={getMuscleFill('back')} />
                </g>

                {/* Triceps */}
                <g
                  onClick={() => setSelectedMuscle('triceps')}
                  onMouseEnter={() => setHoveredMuscle('triceps')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -20 35 C -20 44, -21 48, -23 48 C -25 45, -25 38, -23 35 Z" fill={getMuscleFill('triceps')} />
                  <path d="M 20 35 C 20 44, 21 48, 23 48 C 25 45, 25 38, 23 35 Z" fill={getMuscleFill('triceps')} />
                </g>

                {/* Forearms */}
                <g
                  onClick={() => setSelectedMuscle('forearms')}
                  onMouseEnter={() => setHoveredMuscle('forearms')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -23 49 C -24.5 54, -23.5 62, -22 66 C -20 66, -19 59, -20 49 Z" fill={getMuscleFill('forearms')} />
                  <path d="M 23 49 C 24.5 54, 23.5 62, 22 66 C 20 66, 19 59, 20 49 Z" fill={getMuscleFill('forearms')} />
                </g>

                {/* Glutes */}
                <g
                  onClick={() => setSelectedMuscle('glutes')}
                  onMouseEnter={() => setHoveredMuscle('glutes')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -12 63 C -15 63, -15 74, -8 77 C -6 74, -6 66, -11 63 Z" fill={getMuscleFill('glutes')} />
                  <path d="M 12 63 C 15 63, 15 74, 8 77 C 6 74, 6 66, 11 63 Z" fill={getMuscleFill('glutes')} />
                </g>

                {/* Hamstrings */}
                <g
                  onClick={() => setSelectedMuscle('hamstrings')}
                  onMouseEnter={() => setHoveredMuscle('hamstrings')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -12 63 C -15 75, -14 96, -9 104 C -6 104, -6 95, -6 63 Z" fill={getMuscleFill('hamstrings')} />
                  <path d="M 12 63 C 15 75, 13 96, 9 104 C 6 104, 6 95, 6 63 Z" fill={getMuscleFill('hamstrings')} />
                </g>

                {/* Support paths */}
                <g fill="rgba(255, 255, 255, 0.04)">
                  <path d="M -21 66 C -22 70, -21 75, -20 75 C -19 75, -19 70, -20 66 Z" />
                  <path d="M 21 66 C 22 70, 21 75, 20 75 C 19 75, 19 70, 20 66 Z" />
                  <ellipse cx="-7.5" cy="107" rx="2" ry="2" />
                  <ellipse cx="7.5" cy="107" rx="2" ry="2" />
                  <path d="M -9 136 C -11 140, -12 144, -9 144 C -7 144, -7 140, -8 136 Z" />
                  <path d="M 9 136 C 10 140, 11 144, 9 144 C 7 144, 7 140, 8 136 Z" />
                </g>

                {/* Calves */}
                <g
                  onClick={() => setSelectedMuscle('calves')}
                  onMouseEnter={() => setHoveredMuscle('calves')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M -9 109 C -12 116, -12 126, -9 135 C -7 135, -6 126, -6.5 109 Z" fill={getMuscleFill('calves')} />
                  <path d="M 9 109 C 12 116, 12 126, 9 135 C 7 135, 6 126, 6.5 109 Z" fill={getMuscleFill('calves')} />
                </g>
              </g>
            </svg>
          )}

          {/* Interactive Tooltip Card */}
          {selectedMuscle ? (
            <div className="muscle-tooltip-card animate-slide-up" style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(8px)',
              width: '100%',
              maxWidth: '320px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
            }}>
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--heading-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isSelectedTargeted ? '#3498db' : '#888' }} />
                {titleCase(selectedMuscle)}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-color)', lineHeight: '1.4' }}>
                {isSelectedTargeted ? (
                  <>Targeted by: <strong>{exercisesForSelected.join(', ')}</strong></>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not targeted by any exercises in this routine.</span>
                )}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              💡 Click on any muscle to view targeted exercises.
            </div>
          )}
        </div>
        
        {/* Right Column: Statistics Grid & Detailed Tags */}
        <div className="muscle-stats-section" style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="muscle-distribution-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {categoryStats.map(stat => (
              <div key={stat.name} className="muscle-stat-card" style={{
                backgroundColor: 'var(--surface-color-2)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Subtle glowing side border */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: stat.color,
                  boxShadow: `0 0 10px ${stat.color}`
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--heading-color)', fontSize: '0.95rem' }}>{stat.name}</span>
                  <span style={{ fontSize: '0.8rem', color: stat.color, fontWeight: 700 }}>{stat.percentage}%</span>
                </div>
                
                {/* Progress bar */}
                <div style={{
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${stat.percentage}%`,
                    backgroundColor: stat.color,
                    borderRadius: '3px',
                    boxShadow: `0 0 6px ${stat.color}`
                  }} />
                </div>
                
                {/* Exercises checklist subtext */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Target Exercises
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {stat.exercises.map((ex, exIdx) => (
                      <span key={exIdx} style={{ fontSize: '0.8rem', color: 'var(--text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ex}>
                        • {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {specificTargets.length > 0 && (
            <div className="specific-muscles-list" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Detailed Muscle Targets
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {specificTargets.map(t => (
                  <span key={t} className="specific-muscle-tag" style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface-color-2)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
