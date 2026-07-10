import React, { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../infrastructure/apiFetch'
import { workoutApi, ExerciseLog, LogExerciseRequest } from './workout.api'
import { WorkoutMetricsGrid } from './components/WorkoutMetricsGrid'
import { WorkoutLoggerForm } from './components/WorkoutLoggerForm'
import { WorkoutTrendChart } from './components/WorkoutTrendChart'
import { WorkoutHistoryTable } from './components/WorkoutHistoryTable'
import { WorkoutTimer } from './components/WorkoutTimer'
import { WorkoutRoutineChecklist } from './components/WorkoutRoutineChecklist'
import { WorkoutMuscleMap } from './components/WorkoutMuscleMap'
import { weightApi, WeightLog } from '../weight/weight.api'
import { trackerApi, TrackedIngredient } from '../tracker/tracker.api'
import './WorkoutPage.css'

import exercisesData from './exercises.json'

const WORKOUT_TIMER_TRIGGER_EVENT = 'workout-timer-trigger';

const mapGroupToCategory = (group: string): string => {
  switch (group.toLowerCase()) {
    case 'chest': return 'Chest'
    case 'back': return 'Back'
    case 'legs':
    case 'glutes': return 'Legs'
    case 'shoulders': return 'Shoulders'
    case 'arms': return 'Arms'
    case 'core': return 'Core'
    case 'cardio': return 'Cardio'
    case 'fullbody': return 'Full Body'
    default: return 'Core'
  }
}

const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const PREDEFINED_EXERCISES = exercisesData.map(e => ({
  name: titleCase(e.name),
  category: mapGroupToCategory(e.group)
}))

const CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body']

const getCombinedExercises = (exercisesList: ExerciseLog[]): { name: string; category: string }[] => {
  const combined = [...PREDEFINED_EXERCISES]
  exercisesList.forEach(log => {
    const exists = combined.some(
      pe => pe.name.toLowerCase() === log.exerciseName.toLowerCase()
    )
    if (!exists) {
      combined.push({
        name: log.exerciseName,
        category: log.category
      })
    }
  })
  return combined
}

export function WorkoutPage() {
  const { request } = useApi()

  // State
  const [exercises, setExercises] = useState<ExerciseLog[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // View Tab & Bulk Logging
  const [activeTab, setActiveTab] = useState<'session' | 'quick-log' | 'muscle-map' | 'history'>('history')
  const [isBulkLogging, setIsBulkLogging] = useState(false)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [todayFoodItems, setTodayFoodItems] = useState<TrackedIngredient[]>([])

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().split('T')[0] || ''
  })
  const [exerciseName, setExerciseName] = useState('Bench Press')
  const [isCustomExercise, setIsCustomExercise] = useState(false)
  const [customExerciseName, setCustomExerciseName] = useState('')
  const [category, setCategory] = useState('Chest')
  const [sets, setSets] = useState<{ weight: string; reps: string; distanceKm: string; durationMinutes: string }[]>([
    { weight: '60', reps: '10', distanceKm: '', durationMinutes: '' }
  ])

  // Chart State
  const [chartExercise, setChartExercise] = useState<string>('')
  const [chartMetric, setChartMetric] = useState<'weight' | 'reps' | 'distance' | 'duration'>('weight')

  // Inline delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Equipment Filter State
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])

  const allEquipment = React.useMemo(() => {
    return Array.from(
      new Set(exercisesData.flatMap(ex => ex.equipment || []))
    ).sort()
  }, [])

  const lastLogMap = React.useMemo(() => {
    const map: Record<string, { weight?: string | undefined; reps?: string | undefined; distanceKm?: string | undefined; durationMinutes?: string | undefined; date?: string | undefined }> = {}
    // Since exercises is sorted by loggedDate descending, the first one encountered is the most recent
    exercises.forEach(log => {
      const key = log.exerciseName.toLowerCase().trim()
      if (!map[key]) {
        const firstSet = log.sets[0]
        if (firstSet) {
          const d = new Date(log.loggedDate)
          const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          map[key] = {
            weight: firstSet.weight !== undefined && firstSet.weight !== null ? String(firstSet.weight) : undefined,
            reps: firstSet.reps !== undefined && firstSet.reps !== null ? String(firstSet.reps) : undefined,
            distanceKm: firstSet.distanceKm !== undefined && firstSet.distanceKm !== null ? String(firstSet.distanceKm) : undefined,
            durationMinutes: firstSet.durationMinutes !== undefined && firstSet.durationMinutes !== null ? String(firstSet.durationMinutes) : undefined,
            date: formattedDate
          }
        }
      }
    })
    return map
  }, [exercises])

  const handleToggleEquipment = (eq: string) => {
    setSelectedEquipment(prev =>
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    )
  }

  const handleClearEquipment = () => {
    setSelectedEquipment([])
  }

  // Auto-reset exerciseName if it is filtered out by the selected equipment or category
  useEffect(() => {
    const combined = getCombinedExercises(exercises)
    const filteredPredefined = combined.filter(e => {
      if (e.category !== category) return false;
      if (selectedEquipment.length > 0) {
        const orig = exercisesData.find(ex => ex.name.toLowerCase() === e.name.toLowerCase());
        if (orig) {
          const reqEq = orig.equipment || [];
          return reqEq.every(eq => selectedEquipment.includes(eq.toLowerCase()));
        }
      }
      return true;
    });

    if (filteredPredefined.length > 0) {
      const exists = filteredPredefined.some(e => e.name === exerciseName);
      if (!exists && filteredPredefined[0]) {
        setExerciseName(filteredPredefined[0].name);
      }
    }
  }, [selectedEquipment, category, exercises]);

  // Fetch Exercises
  const fetchExercises = useCallback(async () => {
    setIsFetching(true)
    setError(null)
    try {
      const data = await workoutApi.getExercises(request)
      setExercises(data)

      // Default the chart to the first logged exercise
      if (data.length > 0 && data[0] && !chartExercise) {
        setChartExercise(data[0].exerciseName)
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch workouts.'
      setError(errMsg)
    } finally {
      setIsFetching(false)
    }
  }, [request, chartExercise])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  // Fetch Weight Logs
  const fetchWeightLogs = useCallback(async () => {
    try {
      const data = await weightApi.getWeights(request)
      setWeightLogs(data)
    } catch (err) {
      console.warn('Failed to fetch weight logs for trophies:', err)
    }
  }, [request])

  // Fetch Today's Food Logs
  const fetchTodayFoodItems = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0]!
      const data = await trackerApi.getTracked(request, todayStr)
      setTodayFoodItems(data)
    } catch (err) {
      console.warn("Failed to fetch today's food items for trophies:", err)
    }
  }, [request])

  // Fetch weight and food logs when the muscle map page is opened
  useEffect(() => {
    if (activeTab === 'muscle-map') {
      fetchWeightLogs()
      fetchTodayFoodItems()
    }
  }, [activeTab, fetchWeightLogs, fetchTodayFoodItems])

  // Auto-sync chartExercise state with loggedExerciseNames list (handles first logs, deletions, etc.)
  useEffect(() => {
    const names = Array.from(new Set(exercises.map(e => e.exerciseName)))
    if (names.length > 0) {
      if (!chartExercise || !names.includes(chartExercise)) {
        setChartExercise(names[0]!)
      }
    } else {
      setChartExercise('')
    }
  }, [exercises, chartExercise])

  // Auto-switch chart metric selection when switching exercises between strength and cardio
  useEffect(() => {
    if (!chartExercise) return
    const matchingLog = exercises.find(
      e => e.exerciseName.toLowerCase() === chartExercise.toLowerCase()
    )
    if (matchingLog) {
      const isCardio = matchingLog.category === 'Cardio'
      if (isCardio && (chartMetric === 'weight' || chartMetric === 'reps')) {
        setChartMetric('distance')
      } else if (!isCardio && (chartMetric === 'distance' || chartMetric === 'duration')) {
        setChartMetric('weight')
      }
    }
  }, [chartExercise, exercises, chartMetric])

  // Auto-populate Category when predefined exercise name changes
  const handlePredefinedChange = (name: string) => {
    setExerciseName(name)
    const found = PREDEFINED_EXERCISES.find(e => e.name === name)
    if (found) {
      setCategory(found.category)
    }
  }

  // Handle category change and auto-select first predefined exercise in new category
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat)
    if (!isCustomExercise) {
      const combined = getCombinedExercises(exercises)
      const firstInCat = combined.find(e => e.category === newCat)
      if (firstInCat) {
        setExerciseName(firstInCat.name)
      }
    }
  }

  // Handle quick log from checklist
  const handleQuickLog = (
    name: string,
    cat: string,
    itemWeight?: string,
    itemReps?: string,
    itemDist?: string,
    itemDur?: string
  ) => {
    setCategory(cat)
    setIsCustomExercise(false)
    setExerciseName(name)
    
    if (cat === 'Cardio') {
      setSets([{
        weight: '',
        reps: '',
        distanceKm: itemDist || '5.0',
        durationMinutes: itemDur || '30'
      }])
    } else {
      setSets([{
        weight: itemWeight || '60',
        reps: itemReps || '10',
        distanceKm: '',
        durationMinutes: ''
      }])
    }
    setActiveTab('quick-log')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBulkLog = async (
    checkedExercises: {
      name: string;
      category: string;
      weight?: string | undefined;
      reps?: string | undefined;
      distanceKm?: string | undefined;
      durationMinutes?: string | undefined;
    }[]
  ) => {
    setError(null)
    setSuccessMessage(null)
    setIsBulkLogging(true)
    try {
      await Promise.all(
        checkedExercises.map(ex => {
          let defaultSets: { setNumber: number; weight: number | null; reps: number | null; distanceKm: number | null; durationMinutes: number | null }[] = []
          if (ex.category === 'Cardio') {
            defaultSets = [
              {
                setNumber: 1,
                weight: null,
                reps: null,
                distanceKm: ex.distanceKm ? parseFloat(ex.distanceKm) : 5.0,
                durationMinutes: ex.durationMinutes ? parseInt(ex.durationMinutes, 10) : 30
              }
            ]
          } else {
            defaultSets = [
              {
                setNumber: 1,
                weight: ex.weight ? parseFloat(ex.weight) : (ex.category === 'Core' ? 0 : 60),
                reps: ex.reps ? parseInt(ex.reps, 10) : 10,
                distanceKm: null,
                durationMinutes: null
              }
            ]
          }

          const payload: LogExerciseRequest = {
            exerciseName: ex.name,
            category: ex.category,
            loggedDate: selectedDate,
            sets: defaultSets
          }
          return workoutApi.logExercise(request, payload)
        })
      )
      setSuccessMessage(`Logged ${checkedExercises.length} exercises successfully!`)
      fetchExercises()
      window.dispatchEvent(new CustomEvent(WORKOUT_TIMER_TRIGGER_EVENT))
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to bulk-log exercises.'
      setError(errMsg)
      throw err
    } finally {
      setIsBulkLogging(false)
    }
  }

  // Export all logged exercises to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Exercise Name', 'Category', 'Set Number', 'Weight (kg)', 'Reps', 'Distance (km)', 'Duration (min)']
    const rows: (string | number)[][] = []
    
    exercises.forEach(log => {
      log.sets.forEach(set => {
        rows.push([
          log.loggedDate,
          log.exerciseName,
          log.category,
          set.setNumber,
          set.weight !== null && set.weight !== undefined ? set.weight : '',
          set.reps !== null && set.reps !== undefined ? set.reps : '',
          set.distanceKm !== null && set.distanceKm !== undefined ? set.distanceKm : '',
          set.durationMinutes !== null && set.durationMinutes !== undefined ? set.durationMinutes : ''
        ])
      })
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `workout_history_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Import exercises from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (!text) return
      
      setError(null)
      setSuccessMessage(null)
      
      try {
        const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
        if (lines.length <= 1) {
          setError('CSV is empty or invalid.')
          return
        }
        
        const parseCSVLine = (line: string) => {
          const result = []
          let current = ''
          let inQuotes = false
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result.map(s => s.replace(/^"|"$/g, ''))
        }
        
        const headers = parseCSVLine(lines[0]!)
        const headerIndices = {
          date: headers.findIndex(h => h.toLowerCase().includes('date')),
          name: headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('exercise')),
          category: headers.findIndex(h => h.toLowerCase().includes('category')),
          setNum: headers.findIndex(h => h.toLowerCase().includes('set')),
          weight: headers.findIndex(h => h.toLowerCase().includes('weight')),
          reps: headers.findIndex(h => h.toLowerCase().includes('reps')),
          distance: headers.findIndex(h => h.toLowerCase().includes('distance')),
          duration: headers.findIndex(h => h.toLowerCase().includes('duration'))
        }
        
        if (headerIndices.date === -1 || headerIndices.name === -1 || headerIndices.category === -1) {
          setError('Required columns (Date, Exercise Name, Category) are missing.')
          return
        }
        
        const groups: Record<string, {
          exerciseName: string;
          category: string;
          loggedDate: string;
          sets: { setNumber: number; weight: number | null; reps: number | null; distanceKm: number | null; durationMinutes: number | null }[]
        }> = {}
        
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]!)
          if (row.length < 3) continue
          
          const loggedDate = row[headerIndices.date] || ''
          const exerciseName = row[headerIndices.name] || ''
          const category = row[headerIndices.category] || ''
          
          if (!loggedDate || !exerciseName || !category) continue
          
          const key = `${loggedDate}|||${exerciseName}|||${category}`
          if (!groups[key]) {
            groups[key] = { exerciseName, category, loggedDate, sets: [] }
          }
          
          const setNumVal = row[headerIndices.setNum]
          const setNumber = setNumVal ? parseInt(setNumVal, 10) : (groups[key].sets.length + 1)
          
          const wVal = row[headerIndices.weight]
          const rVal = row[headerIndices.reps]
          const distVal = row[headerIndices.distance]
          const durVal = row[headerIndices.duration]
          
          groups[key].sets.push({
            setNumber,
            weight: wVal && wVal !== '' ? parseFloat(wVal) : null,
            reps: rVal && rVal !== '' ? parseInt(rVal, 10) : null,
            distanceKm: distVal && distVal !== '' ? parseFloat(distVal) : null,
            durationMinutes: durVal && durVal !== '' ? parseInt(durVal, 10) : null
          })
        }
        
        const importPayloads = Object.values(groups)
        if (importPayloads.length === 0) {
          setError('No valid exercise logs found in CSV.')
          return
        }
        
        setIsFetching(true)
        await Promise.all(
          importPayloads.map(payload => {
            payload.sets.sort((a, b) => a.setNumber - b.setNumber)
            return workoutApi.logExercise(request, payload)
          })
        )
        
        setSuccessMessage(`Imported ${importPayloads.length} exercise logs successfully!`)
        fetchExercises()
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Failed to parse or import CSV.'
        setError(errMsg)
      } finally {
        setIsFetching(false)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Add Set row in form
  const handleAddSet = () => {
    setSets([...sets, { weight: '', reps: '', distanceKm: '', durationMinutes: '' }])
  }

  // Remove Set row in form
  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index))
    }
  }

  // Update specific set input
  const handleSetChange = (index: number, field: 'weight' | 'reps' | 'distanceKm' | 'durationMinutes', value: string) => {
    const updated = [...sets]
    const item = updated[index]
    if (item) {
      updated[index] = { ...item, [field]: value }
      setSets(updated)
    }
  }

  // Submit Logger Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const finalName = isCustomExercise ? customExerciseName.trim() : exerciseName
    if (!finalName) {
      setError('Please provide a valid exercise name.')
      return
    }

    // Format sets
    const logSets = sets.map((s, idx) => ({
      setNumber: idx + 1,
      weight: s.weight ? parseFloat(s.weight) : null,
      reps: s.reps ? parseInt(s.reps, 10) : null,
      distanceKm: s.distanceKm ? parseFloat(s.distanceKm) : null,
      durationMinutes: s.durationMinutes ? parseInt(s.durationMinutes, 10) : null
    }))

    try {
      setIsLogging(true)
      const payload: LogExerciseRequest = {
        exerciseName: finalName,
        category,
        loggedDate: selectedDate,
        sets: logSets
      }
      if (editingId) {
        payload.id = editingId
      }
      await workoutApi.logExercise(request, payload)

      setSuccessMessage(editingId ? 'Workout updated successfully!' : 'Workout logged successfully!')
      resetForm()
      fetchExercises()
      window.dispatchEvent(new CustomEvent(WORKOUT_TIMER_TRIGGER_EVENT))
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save workout.'
      setError(errMsg)
    } finally {
      setIsLogging(false)
    }
  }

  // Enter Edit mode
  const handleEditClick = (log: ExerciseLog) => {
    setEditingId(log.id)
    setSelectedDate(log.loggedDate)
    setCategory(log.category)

    const combined = getCombinedExercises(exercises)
    const isPredefined = combined.some(e => e.name === log.exerciseName)
    if (isPredefined) {
      setExerciseName(log.exerciseName)
      setIsCustomExercise(false)
    } else {
      setIsCustomExercise(true)
      setCustomExerciseName(log.exerciseName)
    }

    setSets(
      log.sets.map(s => ({
        weight: s.weight !== null && s.weight !== undefined ? String(s.weight) : '',
        reps: s.reps !== null && s.reps !== undefined ? String(s.reps) : '',
        distanceKm: s.distanceKm !== null && s.distanceKm !== undefined ? String(s.distanceKm) : '',
        durationMinutes: s.durationMinutes !== null && s.durationMinutes !== undefined ? String(s.durationMinutes) : ''
      }))
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete Workout
  const handleDelete = async (id: string) => {
    setError(null)
    try {
      setIsDeleting(true)
      await workoutApi.deleteExercise(request, id)
      setExercises(exercises.filter(e => e.id !== id))
      setDeletingId(null)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete workout.'
      setError(errMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setIsCustomExercise(false)
    setExerciseName('Bench Press')
    setCustomExerciseName('')
    setCategory('Chest')
    setSets([{ weight: '60', reps: '10', distanceKm: '', durationMinutes: '' }])
  }

  // Calculate Metrics
  const combinedExercises = getCombinedExercises(exercises)
  const totalWorkouts = exercises.length
  const uniqueExercises = new Set(exercises.map(e => e.exerciseName.toLowerCase())).size
  
  // Find max weight lifted ever across all exercises
  let maxWeightLifted = 0
  exercises.forEach(e => {
    e.sets.forEach(s => {
      if (s.weight && s.weight > maxWeightLifted) {
        maxWeightLifted = s.weight
      }
    })
  })

  // Filter and sort history list explicitly by date descending
  const filteredExercises = exercises
    .filter(e => {
      const matchesSearch = e.exerciseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || e.category === activeCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))

  // Prepare chart data
  const chartLogs = exercises
    .filter(e => e.exerciseName.toLowerCase() === chartExercise.toLowerCase())
    .sort((a, b) => new Date(a.loggedDate).getTime() - new Date(b.loggedDate).getTime())

  // Get values based on selected metric
  const chartPoints = chartLogs.map(log => {
    let value = 0
    if (chartMetric === 'weight') {
      value = Math.max(...log.sets.map(s => s.weight ?? 0), 0)
    } else if (chartMetric === 'reps') {
      value = Math.max(...log.sets.map(s => s.reps ?? 0), 0)
    } else if (chartMetric === 'distance') {
      value = Math.max(...log.sets.map(s => s.distanceKm ?? 0), 0)
    } else if (chartMetric === 'duration') {
      value = Math.max(...log.sets.map(s => s.durationMinutes ?? 0), 0)
    }
    return { date: log.loggedDate, value }
  }).filter(pt => pt.value > 0) // exclude logs with 0 values

  // Get distinct list of logged exercise names for chart dropdown
  const loggedExerciseNames = Array.from(new Set(exercises.map(e => e.exerciseName)))

  // Calculate Estimated 1-Rep Maxes per exercise
  const est1RMMap: Record<string, { value: number; weight: number; reps: number; date: string }> = {}
  exercises.forEach(log => {
    const nameKey = log.exerciseName.toLowerCase()
    log.sets.forEach(set => {
      if (set.weight && set.reps && set.reps <= 12 && log.category !== 'Cardio') {
        const est1RM = set.weight * (1 + set.reps / 30)
        if (!est1RMMap[nameKey] || est1RM > est1RMMap[nameKey].value) {
          est1RMMap[nameKey] = {
            value: Math.round(est1RM * 10) / 10,
            weight: set.weight,
            reps: set.reps,
            date: log.loggedDate
          }
        }
      }
    })
  })

  return (
    <div className="workout-tracker-container">
      <div className="workout-header-row">
        <div>
          <h1 className="workout-page-title">Workout Tracker</h1>
          <p className="workout-page-subtitle">Track your gym sessions, reps, weight, and cardio progress</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="workout-tabs-nav">
        <button
          type="button"
          className={`workout-tab-nav-btn ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          <svg className="action-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Active Session
        </button>
        <button
          type="button"
          className={`workout-tab-nav-btn ${activeTab === 'quick-log' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick-log')}
        >
          <svg className="action-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Log Single Exercise
        </button>
        <button
          type="button"
          className={`workout-tab-nav-btn ${activeTab === 'muscle-map' ? 'active' : ''}`}
          onClick={() => setActiveTab('muscle-map')}
        >
          <svg className="action-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
            <path d="M18 11a6 6 0 0 1-6 6H9" />
          </svg>
          Muscle Map
        </button>
        <button
          type="button"
          className={`workout-tab-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg className="action-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          History & Charts
        </button>
      </div>

      {/* Error & Success Alerts */}
      {error && (
        <div className="workout-alert workout-alert-error">
          <div>{error}</div>
        </div>
      )}
      {successMessage && (
        <div className="workout-alert workout-alert-success">
          <div>{successMessage}</div>
        </div>
      )}

      {activeTab === 'session' && (
        <div className="workout-grid-2col">
          {/* Routine Checklist (Left) */}
          <WorkoutRoutineChecklist
            onQuickLog={handleQuickLog}
            onBulkLog={handleBulkLog}
            isBulkLogging={isBulkLogging}
            est1RMMap={est1RMMap}
            lastLogMap={lastLogMap}
          />

          {/* Timer (Right) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <WorkoutTimer />
          </div>
        </div>
      )}

      {activeTab === 'muscle-map' && (
        <WorkoutMuscleMap
          exercises={exercises}
          weightLogs={weightLogs}
          todayFoodItems={todayFoodItems}
        />
      )}

      {activeTab === 'quick-log' && (
        <div className="workout-single-log-container">
          <WorkoutLoggerForm
            editingId={editingId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            category={category}
            setCategory={handleCategoryChange}
            exerciseName={exerciseName}
            setExerciseName={setExerciseName}
            isCustomExercise={isCustomExercise}
            setIsCustomExercise={setIsCustomExercise}
            customExerciseName={customExerciseName}
            setCustomExerciseName={setCustomExerciseName}
            sets={sets}
            onSetChange={handleSetChange}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onSubmit={handleSubmit}
            isLogging={isLogging}
            onCancelEdit={resetForm}
            categories={CATEGORIES}
            predefinedExercises={combinedExercises.filter(e => {
              if (e.category !== category) return false;
              if (selectedEquipment.length > 0) {
                const orig = exercisesData.find(ex => ex.name.toLowerCase() === e.name.toLowerCase());
                if (orig) {
                  const reqEq = orig.equipment || [];
                  return reqEq.every(eq => selectedEquipment.includes(eq.toLowerCase()));
                }
              }
              return true;
            })}
            onPredefinedChange={handlePredefinedChange}
            selectedEquipment={selectedEquipment}
            onToggleEquipment={handleToggleEquipment}
            onClearEquipment={handleClearEquipment}
            allEquipment={allEquipment}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <>
          {/* Metrics Row */}
          <WorkoutMetricsGrid
            totalWorkouts={totalWorkouts}
            uniqueExercises={uniqueExercises}
            maxWeightLifted={maxWeightLifted}
          />

          <div className="workout-grid-2col">
            {/* Progress Charts Column */}
            <WorkoutTrendChart
              chartExercise={chartExercise}
              setChartExercise={setChartExercise}
              chartMetric={chartMetric}
              setChartMetric={setChartMetric}
              loggedExerciseNames={loggedExerciseNames}
              chartPoints={chartPoints}
            />

            {/* History Log Section */}
            <WorkoutHistoryTable
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              categories={CATEGORIES}
              isFetching={isFetching}
              filteredExercises={filteredExercises}
              deletingId={deletingId}
              setDeletingId={setDeletingId}
              handleDelete={handleDelete}
              handleEditClick={(log) => {
                handleEditClick(log)
                setActiveTab('quick-log')
              }}
              isDeleting={isDeleting}
              onExportCSV={handleExportCSV}
              onImportCSV={handleImportCSV}
            />
          </div>
        </>
      )}
    </div>
  )
}
