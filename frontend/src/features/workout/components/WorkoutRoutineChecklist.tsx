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
}

export function WorkoutRoutineChecklist({ onQuickLog, onBulkLog, isBulkLogging, est1RMMap }: WorkoutRoutineChecklistProps) {
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
      updated[index] = { ...item, completed: !item.completed }
      saveItems(updated)
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

  interface ActiveMuscles {
    chest: boolean;
    upperChest: boolean;
    lowerChest: boolean;
    lats: boolean;
    rhomboids: boolean;
    midBack: boolean;
    lowerBack: boolean;
    traps: boolean;
    upperTraps: boolean;
    frontDeltoids: boolean;
    lateralDeltoids: boolean;
    rearDeltoids: boolean;
    shoulders: boolean;
    biceps: boolean;
    triceps: boolean;
    forearms: boolean;
    arms: boolean;
    quads: boolean;
    glutes: boolean;
    hamstrings: boolean;
    calves: boolean;
    legs: boolean;
    abs: boolean;
    obliques: boolean;
    core: boolean;
  }

  const getTargetedMuscles = (): ActiveMuscles => {
    const muscles: ActiveMuscles = {
      chest: false, upperChest: false, lowerChest: false,
      lats: false, rhomboids: false, midBack: false, lowerBack: false, traps: false, upperTraps: false,
      frontDeltoids: false, lateralDeltoids: false, rearDeltoids: false, shoulders: false,
      biceps: false, triceps: false, forearms: false, arms: false,
      quads: false, glutes: false, hamstrings: false, calves: false, legs: false,
      abs: false, obliques: false, core: false
    }

    items.forEach(item => {
      const nameLower = item.name.toLowerCase().trim()
      const match = exercisesData.find(ex => ex.name.toLowerCase().trim() === nameLower)
      
      let targets: string[] = []
      if (match) {
        targets = [...(match.primaryMuscles || []), ...(match.secondaryMuscles || [])]
      } else {
        const subMatch = exercisesData.find(ex => ex.name.toLowerCase().includes(nameLower) || nameLower.includes(ex.name.toLowerCase()))
        if (subMatch) {
          targets = [...(subMatch.primaryMuscles || []), ...(subMatch.secondaryMuscles || [])]
        } else {
          const cat = item.category.toLowerCase()
          if (cat === 'chest') targets = ['chest']
          else if (cat === 'back') targets = ['back']
          else if (cat === 'legs') targets = ['legs']
          else if (cat === 'shoulders') targets = ['shoulders']
          else if (cat === 'arms') targets = ['arms']
          else if (cat === 'core') targets = ['core']
        }
      }

      targets.forEach(t => {
        const targetLower = t.toLowerCase().trim()
        
        if (targetLower === 'chest') muscles.chest = true
        if (targetLower === 'upper chest') muscles.upperChest = true
        if (targetLower === 'lower chest') muscles.lowerChest = true
        
        if (targetLower === 'lats') muscles.lats = true
        if (targetLower === 'rhomboids') muscles.rhomboids = true
        if (targetLower === 'mid-back' || targetLower === 'mid back') muscles.midBack = true
        if (targetLower === 'lower back') muscles.lowerBack = true
        if (targetLower === 'traps') muscles.traps = true
        if (targetLower === 'upper traps') muscles.upperTraps = true
        if (targetLower === 'back') muscles.lats = muscles.midBack = muscles.lowerBack = true
        
        if (targetLower === 'front deltoids') muscles.frontDeltoids = true
        if (targetLower === 'lateral deltoids' || targetLower === 'side deltoids') muscles.lateralDeltoids = true
        if (targetLower === 'rear deltoids') muscles.rearDeltoids = true
        if (targetLower === 'shoulders') muscles.shoulders = true
        
        if (targetLower === 'biceps') muscles.biceps = true
        if (targetLower === 'triceps') muscles.triceps = true
        if (targetLower === 'forearms' || targetLower === 'forearm flexors') muscles.forearms = true
        if (targetLower === 'arms') muscles.arms = true
        
        if (targetLower === 'quads') muscles.quads = true
        if (targetLower === 'glutes') muscles.glutes = true
        if (targetLower === 'hamstrings') muscles.hamstrings = true
        if (targetLower === 'calves') muscles.calves = true
        if (targetLower === 'legs') muscles.legs = true
        
        if (targetLower === 'rectus abdominis' || targetLower === 'abs' || targetLower === 'lower abs') muscles.abs = true
        if (targetLower === 'obliques') muscles.obliques = true
        if (targetLower === 'core' || targetLower === 'transverse abdominis' || targetLower === 'deep core') muscles.core = true
        
        if (targetLower === 'full body' || targetLower === 'fullbody') {
          muscles.core = muscles.legs = muscles.arms = muscles.shoulders = muscles.chest = muscles.lats = true
        }
      })
    })

    return muscles
  }

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

  const checkedItems = items.filter(item => item.completed)
  const activeMuscles = getTargetedMuscles()
  const specificTargets = getSpecificTargets()

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

      {/* Routine Selector — full width */}
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

      {/* Visual Muscle Map — full-width dedicated panel */}
      <div className="muscle-map-panel">
        <span className="muscle-map-label">Muscles Targeted</span>
        <div className="muscle-map-figures">

          {/* Front figure */}
          <div className="muscle-figure-group">
            <span className="muscle-figure-caption">Front</span>
            <svg width="90" height="160" viewBox="0 0 60 110" className="muscle-figure-svg">
              <title>Front muscles targeted</title>
              <defs>
                <filter id="glow-front" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="head-grad-f" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#555" />
                  <stop offset="100%" stopColor="#333" />
                </radialGradient>
              </defs>
              {/* Background Silhouette Group */}
              <g opacity="0.08" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5">
                {/* Head */}
                <circle cx="30" cy="10" r="6" />
                {/* Neck */}
                <path d="M27 16 Q30 18 33 16 L33 21 Q30 22 27 21 Z" />
                {/* Left/Right Deltoids */}
                <path d="M12 24 C8 24, 7 28, 7 32 C7 35, 10 36, 12 36 C14 36, 16 33, 16 26 Z" />
                <path d="M48 24 C52 24, 53 28, 53 32 C53 35, 50 36, 48 36 C46 36, 44 33, 44 26 Z" />
                {/* Clavicle */}
                <path d="M20 22 Q30 21 40 22 L38 27 Q30 26 22 27 Z" />
                {/* Chest Left/Right */}
                <path d="M17 26 Q23 25 29 26 Q30 32 29 37 Q23 37 17 35 Q15 31 17 26 Z" />
                <path d="M43 26 Q37 25 31 26 Q30 32 31 37 Q37 37 43 35 Q45 31 43 26 Z" />
                {/* Abs */}
                <rect x="23" y="38" width="6" height="5" rx="1.5" />
                <rect x="31" y="38" width="6" height="5" rx="1.5" />
                <rect x="23" y="44" width="6" height="5" rx="1.5" />
                <rect x="31" y="44" width="6" height="5" rx="1.5" />
                <rect x="23" y="50" width="6" height="5" rx="1.5" />
                <rect x="31" y="50" width="6" height="5" rx="1.5" />
                {/* Obliques */}
                <path d="M17 37 Q21 40 21 55 Q16 48 17 37 Z" />
                <path d="M43 37 Q39 40 39 55 Q44 48 43 37 Z" />
                {/* Biceps Left/Right */}
                <path d="M10 26 C7.5 28, 7 35, 7 37 C10 37, 12 36, 13 32 Z" />
                <path d="M50 26 C52.5 28, 53 35, 53 37 C50 37, 48 36, 47 32 Z" />
                {/* Forearms Left/Right */}
                <path d="M7 38 C5 44, 5 48, 6 51 C8 51, 10 50, 11 44 Q12 41 12 38 Z" />
                <path d="M53 38 C55 44, 55 48, 54 51 C52 51, 50 50, 49 44 Q48 41 48 38 Z" />
                {/* Quads Left/Right */}
                <path d="M17 56 C15 62, 15 76, 16 80 C19 80, 23 79, 24 73 C25 68, 25 60, 24 56 Z" />
                <path d="M43 56 C45 62, 45 76, 44 80 C41 80, 37 79, 36 73 C35 68, 35 60, 36 56 Z" />
                {/* Calves Left/Right */}
                <path d="M16 82 C14 88, 15 98, 16 102 C18 102, 20 101, 21 95 C22 90, 22 85, 21 82 Z" />
                <path d="M44 82 C46 88, 45 98, 44 102 C42 102, 40 101, 39 95 C38 90, 38 85, 39 82 Z" />
              </g>

              {/* Head */}
              <circle cx="30" cy="10" r="6" fill="url(#head-grad-f)" stroke="#1e2335" strokeWidth="0.8">
                <title>Head</title>
              </circle>
              {/* Neck */}
              <path d="M27 16 Q30 18 33 16 L33 21 Q30 22 27 21 Z" fill="#25293d" stroke="#1e2335" strokeWidth="0.8">
                <title>Neck</title>
              </path>
              {/* Left Shoulder (Front/Lateral Deltoid) */}
              <path d="M12 24 C8 24, 7 28, 7 32 C7 35, 10 36, 12 36 C14 36, 16 33, 16 26 Z"
                fill={activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids ? 'var(--shoulders-color)' : '#25293d'}
                filter={activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Shoulder (Deltoid)</title>
              </path>
              {/* Right Shoulder (Front/Lateral Deltoid) */}
              <path d="M48 24 C52 24, 53 28, 53 32 C53 35, 50 36, 48 36 C46 36, 44 33, 44 26 Z"
                fill={activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids ? 'var(--shoulders-color)' : '#25293d'}
                filter={activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Shoulder (Deltoid)</title>
              </path>
              {/* Clavicle */}
              <path d="M20 22 Q30 21 40 22 L38 27 Q30 26 22 27 Z"
                fill="#25293d"
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Clavicle</title>
              </path>
              {/* Chest left */}
              <path d="M17 26 Q23 25 29 26 Q30 32 29 37 Q23 37 17 35 Q15 31 17 26 Z"
                fill={activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest ? 'var(--chest-color)' : '#25293d'}
                filter={activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Chest (Pectorals)</title>
              </path>
              {/* Chest right */}
              <path d="M43 26 Q37 25 31 26 Q30 32 31 37 Q37 37 43 35 Q45 31 43 26 Z"
                fill={activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest ? 'var(--chest-color)' : '#25293d'}
                filter={activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Chest (Pectorals)</title>
              </path>
              {/* Core / abs */}
              <rect x="23" y="38" width="6" height="5" rx="1.5"
                fill={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Abs (Core)</title>
              </rect>
              <rect x="31" y="38" width="6" height="5" rx="1.5"
                fill={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Abs (Core)</title>
              </rect>
              <rect x="23" y="44" width="6" height="5" rx="1.5"
                fill={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Abs (Core)</title>
              </rect>
              <rect x="31" y="44" width="6" height="5" rx="1.5"
                fill={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Abs (Core)</title>
              </rect>
              <rect x="23" y="50" width="6" height="5" rx="1.5"
                fill={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Abs (Core)</title>
              </rect>
              <rect x="31" y="50" width="6" height="5" rx="1.5"
                fill={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.abs || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Abs (Core)</title>
              </rect>
              {/* Obliques */}
              <path d="M17 37 Q21 40 21 55 Q16 48 17 37 Z"
                fill={activeMuscles.core || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Obliques (Core)</title>
              </path>
              <path d="M43 37 Q39 40 39 55 Q44 48 43 37 Z"
                fill={activeMuscles.core || activeMuscles.obliques ? 'var(--core-color)' : '#25293d'}
                filter={activeMuscles.core || activeMuscles.obliques ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.core || activeMuscles.obliques ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Obliques (Core)</title>
              </path>
              {/* Left Upper Arm (Biceps) */}
              <path d="M10 26 C7.5 28, 7 35, 7 37 C10 37, 12 36, 13 32 Z"
                fill={activeMuscles.biceps || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.biceps || activeMuscles.arms ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.biceps || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Biceps</title>
              </path>
              {/* Left Forearm */}
              <path d="M7 38 C5 44, 5 48, 6 51 C8 51, 10 50, 11 44 Q12 41 12 38 Z"
                fill={activeMuscles.forearms || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.forearms || activeMuscles.arms ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.forearms || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Forearm</title>
              </path>
              {/* Right Upper Arm (Biceps) */}
              <path d="M50 26 C52.5 28, 53 35, 53 37 C50 37, 48 36, 47 32 Z"
                fill={activeMuscles.biceps || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.biceps || activeMuscles.arms ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.biceps || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Biceps</title>
              </path>
              {/* Right Forearm */}
              <path d="M52.5 38 C55 44, 55 48, 54 51 C52 51, 50 50, 49 44 Q48 41 48 38 Z"
                fill={activeMuscles.forearms || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.forearms || activeMuscles.arms ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.forearms || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Forearm</title>
              </path>
              {/* Quads left */}
              <path d="M17 56 C15 62, 15 76, 16 80 C19 80, 23 79, 24 73 C25 68, 25 60, 24 56 Z"
                fill={activeMuscles.legs || activeMuscles.quads ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.quads ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.quads ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Thigh (Quadriceps)</title>
              </path>
              {/* Quads right */}
              <path d="M43 56 C45 62, 45 76, 44 80 C41 80, 37 79, 36 73 C35 68, 35 60, 36 56 Z"
                fill={activeMuscles.legs || activeMuscles.quads ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.quads ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.quads ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Thigh (Quadriceps)</title>
              </path>
              {/* Calves left */}
              <path d="M16 82 C14 88, 15 98, 16 102 C18 102, 20 101, 21 95 C22 90, 22 85, 21 82 Z"
                fill={activeMuscles.legs || activeMuscles.calves ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.calves ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.calves ? 1 : 0.5}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Calf (Gastrocnemius)</title>
              </path>
              {/* Calves right */}
              <path d="M44 82 C46 88, 45 98, 44 102 C42 102, 40 101, 39 95 C38 90, 38 85, 39 82 Z"
                fill={activeMuscles.legs || activeMuscles.calves ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.calves ? 'url(#glow-front)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.calves ? 1 : 0.5}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Calf (Gastrocnemius)</title>
              </path>
            </svg>
          </div>

          {/* Muscle legend chips */}
          <div className="muscle-legend">
            {([
              { active: activeMuscles.chest || activeMuscles.upperChest || activeMuscles.lowerChest, label: 'Chest' },
              { active: activeMuscles.shoulders || activeMuscles.frontDeltoids || activeMuscles.lateralDeltoids || activeMuscles.rearDeltoids, label: 'Shoulders' },
              { active: activeMuscles.arms || activeMuscles.biceps || activeMuscles.triceps || activeMuscles.forearms, label: 'Arms' },
              { active: activeMuscles.core || activeMuscles.abs || activeMuscles.obliques, label: 'Core' },
              { active: activeMuscles.lats || activeMuscles.rhomboids || activeMuscles.midBack || activeMuscles.lowerBack || activeMuscles.traps || activeMuscles.upperTraps, label: 'Back' },
              { active: activeMuscles.legs || activeMuscles.quads || activeMuscles.glutes || activeMuscles.hamstrings || activeMuscles.calves, label: 'Legs' },
            ] as { active: boolean; label: string }[]).map(m => (
              <span
                key={m.label}
                className={`muscle-chip ${m.active ? 'active' : ''} ${m.label.toLowerCase()}`}
              >
                <span className="muscle-chip-dot" />
                {m.label}
              </span>
            ))}
          </div>

          {/* Back figure */}
          <div className="muscle-figure-group">
            <span className="muscle-figure-caption">Back</span>
            <svg width="90" height="160" viewBox="0 0 60 110" className="muscle-figure-svg">
              <title>Back muscles targeted</title>
              <defs>
                <filter id="glow-back" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="head-grad-b" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#555" />
                  <stop offset="100%" stopColor="#333" />
                </radialGradient>
              </defs>
              {/* Background Silhouette Group */}
              <g opacity="0.08" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5">
                {/* Head */}
                <circle cx="30" cy="10" r="6" />
                {/* Neck */}
                <path d="M27 16 Q30 18 33 16 L33 21 Q30 22 27 21 Z" />
                {/* Left/Right Rear Deltoids */}
                <path d="M12 24 C8 24, 7 28, 7 32 C7 35, 10 36, 12 36 C14 36, 16 33, 16 26 Z" />
                <path d="M48 24 C52 24, 53 28, 53 32 C53 35, 50 36, 48 36 C46 36, 44 33, 44 26 Z" />
                {/* Upper Traps */}
                <path d="M20 22 C23 20, 27 18, 30 18 C33 18, 37 20, 40 22 C37 25, 33 26, 30 26 C27 26, 23 25, 20 22 Z" />
                {/* Rhomboids / Mid Back */}
                <path d="M21 28 C26 27, 34 27, 39 28 C39 36, 38 42, 39 44 C34 45, 26 45, 21 44 C22 42, 21 36, 21 28 Z" />
                {/* Lats Left/Right */}
                <path d="M16 28 C12 36, 12 45, 15 50 C18 51, 21 48, 21 44 C21 38, 21 33, 20 28 Z" />
                <path d="M44 28 C48 36, 48 45, 45 50 C42 51, 39 48, 39 44 C39 38, 39 33, 40 28 Z" />
                {/* Lower Back */}
                <path d="M22 46 C25 45, 35 45, 38 46 C37 52, 37 54, 38 56 C35 57, 25 57, 22 56 C23 54, 23 52, 22 46 Z" />
                {/* Triceps Left/Right */}
                <path d="M10 26 C7.5 28, 7 35, 7 37 C10 37, 12 36, 13 32 Z" />
                <path d="M50 26 C52.5 28, 53 35, 53 37 C50 37, 48 36, 47 32 Z" />
                {/* Forearms Left/Right */}
                <path d="M7 38 C5 44, 5 48, 6 51 C8 51, 10 50, 11 44 Q12 41 12 38 Z" />
                <path d="M53 38 C55 44, 55 48, 54 51 C52 51, 50 50, 49 44 Q48 41 48 38 Z" />
                {/* Glutes */}
                <path d="M20 58 C16 62, 17 72, 20 75 C24 77, 36 77, 40 75 C43 72, 44 62, 40 58 Z" />
                {/* Hamstrings Left/Right */}
                <path d="M19 77 C17 83, 17 91, 18 94 C20 94, 23 93, 24 88 C25 84, 25 80, 24 77 Z" />
                <path d="M41 77 C43 83, 43 91, 42 94 C40 94, 37 93, 36 88 C35 84, 35 80, 36 77 Z" />
                {/* Calves Left/Right */}
                <path d="M18 96 C16 100, 17 106, 18 108 C19 108, 22 107, 23 102 C24 99, 24 97, 23 96 Z" />
                <path d="M42 96 C44 100, 43 106, 42 108 C41 108, 38 107, 37 102 C36 99, 36 97, 37 96 Z" />
              </g>

              {/* Head */}
              <circle cx="30" cy="10" r="6" fill="url(#head-grad-b)" stroke="#1e2335" strokeWidth="0.8">
                <title>Head</title>
              </circle>
              {/* Neck */}
              <path d="M27 16 Q30 18 33 16 L33 21 Q30 22 27 21 Z" fill="#25293d" stroke="#1e2335" strokeWidth="0.8">
                <title>Neck</title>
              </path>
              {/* Left Rear Deltoid */}
              <path d="M12 24 C8 24, 7 28, 7 32 C7 35, 10 36, 12 36 C14 36, 16 33, 16 26 Z"
                fill={activeMuscles.rearDeltoids || activeMuscles.shoulders ? 'var(--shoulders-color)' : '#25293d'}
                filter={activeMuscles.rearDeltoids || activeMuscles.shoulders ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.rearDeltoids || activeMuscles.shoulders ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Rear Deltoid</title>
              </path>
              {/* Right Rear Deltoid */}
              <path d="M48 24 C52 24, 53 28, 53 32 C53 35, 50 36, 48 36 C46 36, 44 33, 44 26 Z"
                fill={activeMuscles.rearDeltoids || activeMuscles.shoulders ? 'var(--shoulders-color)' : '#25293d'}
                filter={activeMuscles.rearDeltoids || activeMuscles.shoulders ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.rearDeltoids || activeMuscles.shoulders ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Rear Deltoid</title>
              </path>
              {/* Upper Traps */}
              <path d="M20 22 C23 20, 27 18, 30 18 C33 18, 37 20, 40 22 C37 25, 33 26, 30 26 C27 26, 23 25, 20 22 Z"
                fill={activeMuscles.traps || activeMuscles.upperTraps ? 'var(--back-color)' : '#25293d'}
                filter={activeMuscles.traps || activeMuscles.upperTraps ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.traps || activeMuscles.upperTraps ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Upper Traps</title>
              </path>
              {/* Lats */}
              <path d="M16 28 C12 36, 12 45, 15 50 C18 51, 21 48, 21 44 C21 38, 21 33, 20 28 Z"
                fill={activeMuscles.lats || activeMuscles.midBack ? 'var(--back-color)' : '#25293d'}
                filter={activeMuscles.lats || activeMuscles.midBack ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.lats || activeMuscles.midBack ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Lat (Latissimus Dorsi)</title>
              </path>
              <path d="M44 28 C48 36, 48 45, 45 50 C42 51, 39 48, 39 44 C39 38, 39 33, 40 28 Z"
                fill={activeMuscles.lats || activeMuscles.midBack ? 'var(--back-color)' : '#25293d'}
                filter={activeMuscles.lats || activeMuscles.midBack ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.lats || activeMuscles.midBack ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Lat (Latissimus Dorsi)</title>
              </path>
              {/* Rhomboids / mid back */}
              <path d="M21 28 C26 27, 34 27, 39 28 C39 36, 38 42, 39 44 C34 45, 26 45, 21 44 C22 42, 21 36, 21 28 Z"
                fill={activeMuscles.rhomboids || activeMuscles.midBack || activeMuscles.traps ? 'var(--back-color)' : '#25293d'}
                filter={activeMuscles.rhomboids || activeMuscles.midBack || activeMuscles.traps ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.rhomboids || activeMuscles.midBack || activeMuscles.traps ? 0.9 : 0.5}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Mid Back (Rhomboids & Traps)</title>
              </path>
              {/* Lower back */}
              <path d="M22 46 C25 45, 35 45, 38 46 C37 52, 37 54, 38 56 C35 57, 25 57, 22 56 C23 54, 23 52, 22 46 Z"
                fill={activeMuscles.lowerBack || activeMuscles.lats ? 'var(--back-color)' : '#25293d'}
                filter={activeMuscles.lowerBack || activeMuscles.lats ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.lowerBack || activeMuscles.lats ? 0.8 : 0.45}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Lower Back (Erectors)</title>
              </path>
              {/* Left Upper Arm (Triceps) */}
              <path d="M10 26 C7.5 28, 7 35, 7 37 C10 37, 12 36, 13 32 Z"
                fill={activeMuscles.triceps || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.triceps || activeMuscles.arms ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.triceps || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Triceps</title>
              </path>
              {/* Left Forearm */}
              <path d="M7 38 C5 44, 5 48, 6 51 C8 51, 10 50, 11 44 Q12 41 12 38 Z"
                fill={activeMuscles.forearms || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.forearms || activeMuscles.arms ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.forearms || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Forearm</title>
              </path>
              {/* Right Upper Arm (Triceps) */}
              <path d="M50 26 C52.5 28, 53 35, 53 37 C50 37, 48 36, 47 32 Z"
                fill={activeMuscles.triceps || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.triceps || activeMuscles.arms ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.triceps || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Triceps</title>
              </path>
              {/* Right Forearm */}
              <path d="M52.5 38 C55 44, 55 48, 54 51 C52 51, 50 50, 49 44 Q48 41 48 38 Z"
                fill={activeMuscles.forearms || activeMuscles.arms ? 'var(--arms-color)' : '#25293d'}
                filter={activeMuscles.forearms || activeMuscles.arms ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.forearms || activeMuscles.arms ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Forearm</title>
              </path>
              {/* Glutes */}
              <path d="M20 58 C16 62, 17 72, 20 75 C24 77, 36 77, 40 75 C43 72, 44 62, 40 58 Z"
                fill={activeMuscles.legs || activeMuscles.glutes ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.glutes ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.glutes ? 1 : 0.6}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Glutes (Gluteus Maximus)</title>
              </path>
              {/* Hamstrings left */}
              <path d="M19 77 C17 83, 17 91, 18 94 C20 94, 23 93, 24 88 C25 84, 25 80, 24 77 Z"
                fill={activeMuscles.legs || activeMuscles.hamstrings ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.hamstrings ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.hamstrings ? 0.9 : 0.55}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Thigh Back (Hamstrings)</title>
              </path>
              {/* Hamstrings right */}
              <path d="M41 77 C43 83, 43 91, 42 94 C40 94, 37 93, 36 88 C35 84, 35 80, 36 77 Z"
                fill={activeMuscles.legs || activeMuscles.hamstrings ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.hamstrings ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.hamstrings ? 0.9 : 0.55}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Thigh Back (Hamstrings)</title>
              </path>
              {/* Calves left */}
              <path d="M18 96 C16 100, 17 106, 18 108 C19 108, 22 107, 23 102 C24 99, 24 97, 23 96 Z"
                fill={activeMuscles.legs || activeMuscles.calves ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.calves ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.calves ? 0.8 : 0.45}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Left Calf (Gastrocnemius)</title>
              </path>
              {/* Calves right */}
              <path d="M42 96 C44 100, 43 106, 42 108 C41 108, 38 107, 37 102 C36 99, 36 97, 37 96 Z"
                fill={activeMuscles.legs || activeMuscles.calves ? 'var(--legs-color)' : '#25293d'}
                filter={activeMuscles.legs || activeMuscles.calves ? 'url(#glow-back)' : undefined}
                opacity={activeMuscles.legs || activeMuscles.calves ? 0.8 : 0.45}
                stroke="#1e2335"
                strokeWidth="0.8"
              >
                <title>Right Calf (Gastrocnemius)</title>
              </path>
            </svg>
          </div>

        </div>

        {specificTargets.length > 0 && (
          <div className="specific-muscles-list" style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
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

      <div className="checklist-items-container">
        {items.length === 0 ? (
          <div className="checklist-empty-text">No exercises in this routine. Add some below!</div>
        ) : (
          items.map((item, idx) => {
            const guide = EXERCISE_GUIDES[item.name.toLowerCase()]
            const est1RM = est1RMMap[item.name.toLowerCase()]
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
                    <span className="checklist-item-text">{item.name}</span>
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
