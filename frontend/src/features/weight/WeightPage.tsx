import { useState, useEffect } from 'react'
import { useApi } from '../../infrastructure/apiFetch'
import { trackerApi, GoalDto } from '../tracker/tracker.api'
import { weightApi, WeightLog } from './weight.api'
import { WeightMetricsGrid } from './components/WeightMetricsGrid'
import { WeightProgressBar } from './components/WeightProgressBar'
import { WeightGoalsForm } from './components/WeightGoalsForm'
import { WeightLoggerForm } from './components/WeightLoggerForm'
import { WeightTrendChart } from './components/WeightTrendChart'
import { WeightHistoryTable } from './components/WeightHistoryTable'
import './WeightPage.css'

export function WeightPage() {
  const { request } = useApi()

  // State
  const [weights, setWeights] = useState<WeightLog[]>([])
  const [goals, setGoals] = useState<GoalDto | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [weightInput, setWeightInput] = useState<string>('')
  const [logSuccess, setLogSuccess] = useState<string | null>(null)

  // Goal settings form states
  const [startingWeightInput, setStartingWeightInput] = useState<string>('')
  const [targetWeightInput, setTargetWeightInput] = useState<string>('')
  const [goalsSuccess, setGoalsSuccess] = useState<string | null>(null)
  const [isEditingGoals, setIsEditingGoals] = useState(false)

  // Fetch initial data
  const fetchData = async () => {
    setIsFetching(true)
    setError(null)
    try {
      const [weightsData, goalsData] = await Promise.all([
        weightApi.getWeights(request),
        trackerApi.getGoals(request)
      ])
      setWeights(weightsData)
      setGoals(goalsData)
      setStartingWeightInput(goalsData.startingWeightKg ? String(goalsData.startingWeightKg) : '')
      setTargetWeightInput(goalsData.targetWeightKg ? String(goalsData.targetWeightKg) : '')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to load weight tracker data.'
      setError(errMsg)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle logging weight
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    setLogSuccess(null)
    setError(null)

    const weightKg = parseFloat(weightInput)
    if (isNaN(weightKg) || weightKg < 20) {
      setError('Please enter a valid weight of at least 20 kg.')
      return
    }

    try {
      setIsLogging(true)
      await weightApi.logWeight(request, { weightKg, loggedDate: selectedDate })
      setWeightInput('')
      setLogSuccess('Weight logged successfully!')
      // Refresh data
      const weightsData = await weightApi.getWeights(request)
      setWeights(weightsData)
      setTimeout(() => setLogSuccess(null), 3000)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to log weight.'
      setError(errMsg)
    } finally {
      setIsLogging(false)
    }
  }

  // Handle updating starting and target weights
  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault()
    setGoalsSuccess(null)
    setError(null)

    if (!goals) return

    const startingWeightKg = startingWeightInput ? parseFloat(startingWeightInput) : null
    const targetWeightKg = targetWeightInput ? parseFloat(targetWeightInput) : null

    if (startingWeightKg !== null && (isNaN(startingWeightKg) || startingWeightKg < 20)) {
      setError('Starting weight must be at least 20 kg.')
      return
    }
    if (targetWeightKg !== null && (isNaN(targetWeightKg) || targetWeightKg < 20)) {
      setError('Target weight must be at least 20 kg.')
      return
    }

    try {
      setIsSavingGoals(true)
      const updatedGoals = await trackerApi.updateGoals(request, {
        calorieGoal: goals.calorieGoal,
        proteinGoal: goals.proteinGoal,
        carbGoal: goals.carbGoal,
        fatGoal: goals.fatGoal,
        startingWeightKg,
        targetWeightKg
      })
      setGoals(updatedGoals)
      setGoalsSuccess('Goals updated successfully!')
      setIsEditingGoals(false)
      setTimeout(() => setGoalsSuccess(null), 3000)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update weight goals.'
      setError(errMsg)
    } finally {
      setIsSavingGoals(false)
    }
  }

  // Handle deleting a weight log
  const handleDeleteWeight = async (id: string) => {
    setError(null)
    try {
      setIsDeleting(true)
      await weightApi.deleteWeight(request, id)
      // Refresh list
      const weightsData = await weightApi.getWeights(request)
      setWeights(weightsData)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete weight log.'
      setError(errMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper calculations
  const startingWeight = goals?.startingWeightKg ?? null
  const targetWeight = goals?.targetWeightKg ?? null
  
  const sortedWeights = [...weights].sort((a, b) => 
    new Date(a.loggedDate).getTime() - new Date(b.loggedDate).getTime()
  )
  const currentWeight = sortedWeights.length > 0 
    ? sortedWeights[sortedWeights.length - 1]?.weightKg ?? startingWeight 
    : startingWeight

  // Progress metrics calculation
  let weightDifference = 0
  let progressPercentage = 0
  let progressDirection: 'loss' | 'gain' | 'none' = 'none'

  if (startingWeight !== null && currentWeight !== null) {
    weightDifference = currentWeight - startingWeight
    if (targetWeight !== null) {
      const targetDiff = targetWeight - startingWeight
      if (targetDiff < 0) {
        progressDirection = 'loss'
        const lost = startingWeight - currentWeight
        const needed = startingWeight - targetWeight
        progressPercentage = Math.min(100, Math.max(0, (lost / needed) * 100))
      } else if (targetDiff > 0) {
        progressDirection = 'gain'
        const gained = currentWeight - startingWeight
        const needed = targetWeight - startingWeight
        progressPercentage = Math.min(100, Math.max(0, (gained / needed) * 100))
      }
    }
  }

  return (
    <div className="tracker-page weight-tracker-container">
      {/* Header section */}
      <div className="weight-header-row">
        <div>
          <h1 className="weight-page-title">Weight Tracker</h1>
          <p className="weight-page-subtitle">Log your daily weight, monitor trends, and stay on track with your goals.</p>
        </div>

        <button 
          id="goal-setup-toggle-btn"
          className="goal-setup-toggle-btn"
          onClick={() => setIsEditingGoals(!isEditingGoals)}
          disabled={isFetching}
        >
          {isEditingGoals ? 'Close Goals Setup' : 'Configure Weight Goals'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="weight-alert weight-alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">{error}</div>
        </div>
      )}

      {isEditingGoals && (
        <WeightGoalsForm
          startingWeightInput={startingWeightInput}
          setStartingWeightInput={setStartingWeightInput}
          targetWeightInput={targetWeightInput}
          setTargetWeightInput={setTargetWeightInput}
          onSubmit={handleUpdateGoals}
          onCancel={() => setIsEditingGoals(false)}
          isLoading={isSavingGoals}
        />
      )}

      {goalsSuccess && (
        <div className="weight-alert weight-alert-success">
          <div className="alert-icon">✨</div>
          <div className="alert-content">{goalsSuccess}</div>
        </div>
      )}

      {/* Metrics Row */}
      <WeightMetricsGrid
        startingWeight={startingWeight}
        currentWeight={currentWeight}
        targetWeight={targetWeight}
        weightDifference={weightDifference}
        progressDirection={progressDirection}
      />

      {/* Progress bar container if starting and target weight exist */}
      {startingWeight !== null && targetWeight !== null && currentWeight !== null && (
        <WeightProgressBar
          startingWeight={startingWeight}
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          progressPercentage={progressPercentage}
          progressDirection={progressDirection}
        />
      )}

      {/* Logger and Chart Dashboard Panel */}
      <div className="dashboard-columns">
        {/* Logger column */}
        <div className="dashboard-sidebar-column">
          <WeightLoggerForm
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            weightInput={weightInput}
            setWeightInput={setWeightInput}
            onSubmit={handleLogWeight}
            isLoading={isLogging}
            logSuccess={logSuccess}
          />
        </div>

        {/* Chart Column */}
        <div className="dashboard-main-column">
          <div className="weight-card shadow-sm chart-card">
            <h2 className="card-title">Weight Trend</h2>
            <WeightTrendChart
              weights={weights}
              startingWeight={startingWeight}
              targetWeight={targetWeight}
            />
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <WeightHistoryTable
        weights={weights}
        onDelete={handleDeleteWeight}
        isLoading={isDeleting}
      />
    </div>
  )
}
