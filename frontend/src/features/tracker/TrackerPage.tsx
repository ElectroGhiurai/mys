import { useState, useEffect, useRef } from 'react'
import { useApi } from '../../infrastructure/apiFetch'
import { trackerApi, FoodItem, TrackedIngredient } from './tracker.api'
import { getSuggestions, GoalTargets, TARGETS } from './suggestionsEngine'
import { DateNavBar } from './components/DateNavBar'
import { MacroRingsGrid } from './components/MacroRingsGrid'
import { TrackerLogTab } from './components/TrackerLogTab'
import { CustomFoodsTab } from './components/CustomFoodsTab'
import { GoalsTab } from './components/GoalsTab'
import { CalorieHistoryChart } from './components/CalorieHistoryChart'
import './TrackerPage.css'

const getRangeDates = (centerDateStr: string) => {
  const [year, month, day] = centerDateStr.split('-').map(Number)
  if (!year || !month || !day) return { start: centerDateStr, end: centerDateStr }
  
  const start = new Date(Date.UTC(year, month - 1, day - 5))
  const end = new Date(Date.UTC(year, month - 1, day + 5))
  
  return {
    start: start.toISOString().split('T')[0] ?? '',
    end: end.toISOString().split('T')[0] ?? ''
  }
}

/**
 * High-fidelity, premium Calorie and Macronutrient Tracker Page.
 * Connects directly to Spring Boot backend API with user-specific logs and custom foods.
 */
export function TrackerPage() {
  const { request } = useApi()

  // State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [rangeIngredients, setRangeIngredients] = useState<TrackedIngredient[]>([])
  const [fetchedRange, setFetchedRange] = useState<{ start: string; end: string } | null>(null)
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([])
  const [goals, setGoals] = useState<GoalTargets>({ ...TARGETS })
  const [favourites, setFavourites] = useState<FoodItem[]>([])
  const [frequentFoods, setFrequentFoods] = useState<FoodItem[]>([])

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [addWeight, setAddWeight] = useState<number>(100)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Custom Food Form state
  const [customForm, setCustomForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Goals Form state
  const [goalsForm, setGoalsForm] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })
  const [goalsError, setGoalsError] = useState<string | null>(null)
  const [goalsSuccess, setGoalsSuccess] = useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState<'log' | 'custom' | 'goals'>('log')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Debounced update tracking timeouts
  const pendingUpdatesRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Clean up pending timeouts on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(pendingUpdatesRef.current).forEach(clearTimeout)
    }
  }, [])

  // 1. Load custom foods, goals, favorites, and frequent foods on mount (defensive loading)
  useEffect(() => {
    let active = true
    async function loadInitial() {
      const customPromise = trackerApi.getCustomFoods(request).catch(err => {
        console.error('Failed to load custom foods', err)
        return []
      })
      const goalsPromise = trackerApi.getGoals(request).catch(err => {
        console.error('Failed to load goals', err)
        return null
      })
      const favouritesPromise = trackerApi.getFavourites(request).catch(err => {
        console.error('Failed to load favorites', err)
        return []
      })
      const frequentPromise = trackerApi.getFrequent(request).catch(err => {
        console.error('Failed to load frequent foods', err)
        return []
      })

      try {
        const [customData, goalsData, favouritesData, frequentData] = await Promise.all([
          customPromise,
          goalsPromise,
          favouritesPromise,
          frequentPromise,
        ])
        if (active) {
          setCustomFoods(customData)
          setFavourites(favouritesData)
          setFrequentFoods(frequentData)
          if (goalsData) {
            setGoals({
              calories: goalsData.calorieGoal,
              protein: goalsData.proteinGoal,
              carbs: goalsData.carbGoal,
              fat: goalsData.fatGoal,
            })
          }
        }
      } catch (err) {
        console.error('Unexpected error loading initial data', err)
      }
    }
    void loadInitial()
    return () => {
      active = false
    }
  }, [request])

  // Sync frequent foods when logged/tracked ingredients change
  useEffect(() => {
    let active = true
    async function refreshFrequent() {
      try {
        const frequentData = await trackerApi.getFrequent(request)
        if (active) {
          setFrequentFoods(frequentData)
        }
      } catch (err) {
        console.error('Failed to refresh frequent foods list', err)
      }
    }
    void refreshFrequent()
    return () => {
      active = false
    }
  }, [rangeIngredients, request])

  // 2. Manage Range Fetching
  useEffect(() => {
    let active = true

    // If selectedDate is already within the fetched range, do not query the network.
    if (fetchedRange && selectedDate >= fetchedRange.start && selectedDate <= fetchedRange.end) {
      return
    }

    async function loadRange() {
      setIsLoading(true)
      const targetRange = getRangeDates(selectedDate)
      try {
        const rangeData = await trackerApi.getTracked(request, targetRange)
        if (active) {
          setRangeIngredients(rangeData)
          setFetchedRange(targetRange)
        }
      } catch (err) {
        console.error('Failed to load tracked ingredients range', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadRange()

    return () => {
      active = false
    }
  }, [selectedDate, fetchedRange, request])

  // Derive daily tracked ingredients from pre-loaded range data
  const trackedIngredients = rangeIngredients.filter(item => item.trackedDate === selectedDate)

  // Sync goals form state when goals state updates
  useEffect(() => {
    setGoalsForm({
      calories: Math.round(goals.calories).toString(),
      protein: Math.round(goals.protein).toString(),
      carbs: Math.round(goals.carbs).toString(),
      fat: Math.round(goals.fat).toString(),
    })
  }, [goals])

  // Search logic
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const results = await trackerApi.searchFoods(request, searchQuery)
        setSearchResults(results)
      } catch (err) {
        console.error('Search failed', err)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, request])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate daily totals
  const totals = trackedIngredients.reduce(
    (acc, item) => {
      const multiplier = item.weight / 100
      acc.calories += item.caloriesPer100g * multiplier
      acc.protein += item.proteinPer100g * multiplier
      acc.carbs += item.carbsPer100g * multiplier
      acc.fat += item.fatPer100g * multiplier
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Convert tracked items to suggestion format
  const suggestionInput = trackedIngredients.map(item => ({
    name: item.name,
    weight: item.weight,
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
  }))

  const suggestions = getSuggestions(suggestionInput, goals)

  // Handlers
  const handleToggleFavourite = async (food: FoodItem) => {
    const existing = favourites.find(fav => fav.name.toLowerCase() === food.name.toLowerCase())
    try {
      if (existing) {
        await trackerApi.deleteFavourite(request, existing.id)
        setFavourites(prev => prev.filter(fav => fav.id !== existing.id))
      } else {
        const response = await trackerApi.addFavourite(request, {
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        })
        setFavourites(prev => [...prev, response])
      }
    } catch (err) {
      console.error('Failed to toggle favorite status', err)
    }
  }

  const handleDateChange = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    if (!year || !month || !day) return
    const date = new Date(Date.UTC(year, month - 1, day))
    date.setUTCDate(date.getUTCDate() + days)
    setSelectedDate(date.toISOString().split('T')[0] ?? '')
  }

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food)
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleAddFood = async () => {
    if (!selectedFood) return
    try {
      const response = await trackerApi.addTracked(request, {
        name: selectedFood.name,
        weight: addWeight,
        caloriesPer100g: selectedFood.calories,
        proteinPer100g: selectedFood.protein,
        carbsPer100g: selectedFood.carbs,
        fatPer100g: selectedFood.fat,
        trackedDate: selectedDate,
      })
      setRangeIngredients(prev => {
        const exists = prev.some(item => item.id === response.id)
        if (exists) {
          return prev.map(item => item.id === response.id ? response : item)
        } else {
          return [...prev, response]
        }
      })
      setSelectedFood(null)
      setAddWeight(100)
    } catch (err) {
      console.error('Failed to log food', err)
    }
  }

  const handleQuickAddSuggestion = async (sug: { name: string; caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }) => {
    try {
      const response = await trackerApi.addTracked(request, {
        name: sug.name,
        weight: 100,
        caloriesPer100g: sug.caloriesPer100g,
        proteinPer100g: sug.proteinPer100g,
        carbsPer100g: sug.carbsPer100g,
        fatPer100g: sug.fatPer100g,
        trackedDate: selectedDate,
      })
      setRangeIngredients(prev => {
        const exists = prev.some(item => item.id === response.id)
        if (exists) {
          return prev.map(item => item.id === response.id ? response : item)
        } else {
          return [...prev, response]
        }
      })
    } catch (err) {
      console.error('Failed to quick add suggestion', err)
    }
  }

  const handleUpdateWeight = (id: string, weight: number) => {
    // 1. Instantly update local state optimistically for snappy UI rendering
    setRangeIngredients(prev =>
      prev.map(item => (item.id === id ? { ...item, weight } : item))
    )

    // 2. Clear any pending debounced PUT calls for this item
    if (pendingUpdatesRef.current[id]) {
      clearTimeout(pendingUpdatesRef.current[id])
    }

    // 3. Do not push invalid weights to server
    if (weight <= 0) return

    // 4. Debounce the PUT call by 500ms
    pendingUpdatesRef.current[id] = setTimeout(async () => {
      try {
        const updated = await trackerApi.updateTracked(request, id, weight)
        // Refresh with server's confirmed values
        setRangeIngredients(prev =>
          prev.map(item => (item.id === id ? updated : item))
        )
        delete pendingUpdatesRef.current[id]
      } catch (err) {
        console.error('Failed to update weight on server', err)
      }
    }, 500)
  }

  const handleDeleteTracked = async (id: string) => {
    // Clear any pending debounced updates before deleting
    if (pendingUpdatesRef.current[id]) {
      clearTimeout(pendingUpdatesRef.current[id])
      delete pendingUpdatesRef.current[id]
    }

    const previousIngredients = [...rangeIngredients]

    // Optimistically update UI
    setRangeIngredients(prev => prev.filter(item => item.id !== id))

    try {
      await trackerApi.deleteTracked(request, id)
    } catch (err) {
      console.error('Failed to delete tracked item', err)
      // Rollback to previous state
      setRangeIngredients(previousIngredients)
    }
  }

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!customForm.name.trim()) {
      setFormError('Food name is required.')
      return
    }

    const caloriesVal = parseFloat(customForm.calories)
    const proteinVal = parseFloat(customForm.protein)
    const carbsVal = parseFloat(customForm.carbs)
    const fatVal = parseFloat(customForm.fat)

    if (
      isNaN(caloriesVal) || caloriesVal < 0 ||
      isNaN(proteinVal) || proteinVal < 0 ||
      isNaN(carbsVal) || carbsVal < 0 ||
      isNaN(fatVal) || fatVal < 0
    ) {
      setFormError('All macro values must be non-negative numbers.')
      return
    }

    try {
      const response = await trackerApi.createCustomFood(request, {
        name: customForm.name,
        calories: caloriesVal,
        protein: proteinVal,
        carbs: carbsVal,
        fat: fatVal,
      })
      setCustomFoods(prev => [...prev, response])
      setFormSuccess(`Successfully created food "${response.name}"!`)
      setCustomForm({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create custom food.'
      setFormError(errMsg)
    }
  }

  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault()
    setGoalsError(null)
    setGoalsSuccess(null)

    const caloriesVal = parseFloat(goalsForm.calories)
    const proteinVal = parseFloat(goalsForm.protein)
    const carbsVal = parseFloat(goalsForm.carbs)
    const fatVal = parseFloat(goalsForm.fat)

    if (
      isNaN(caloriesVal) || caloriesVal < 500 ||
      isNaN(proteinVal) || proteinVal < 10 ||
      isNaN(carbsVal) || carbsVal < 10 ||
      isNaN(fatVal) || fatVal < 5
    ) {
      setGoalsError('Min goals required: Calorie 500 kcal, Protein 10g, Carbs 10g, Fat 5g.')
      return
    }

    try {
      const updated = await trackerApi.updateGoals(request, {
        calorieGoal: caloriesVal,
        proteinGoal: proteinVal,
        carbGoal: carbsVal,
        fatGoal: fatVal,
      })
      setGoals({
        calories: updated.calorieGoal,
        protein: updated.proteinGoal,
        carbs: updated.carbGoal,
        fat: updated.fatGoal,
      })
      setGoalsSuccess('Daily targets updated successfully!')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update goals.'
      setGoalsError(errMsg)
    }
  }

  return (
    <div className="tracker-page">
      {/* Date Navigation Bar */}
      <DateNavBar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPickerChange={setSelectedDate}
      />

      {/* Totals Rings Grid */}
      <MacroRingsGrid totals={totals} goals={goals} isLoading={isLoading} />

      {/* Main Split Panels */}
      <div className="tracker-split-layout">
        {/* Left Side: Active Log & Suggestions */}
        <div className="tracker-left-panel">
          <div className="panel-card log-card">
            <h2 className="panel-title">Tracked Ingredients</h2>

            <div className={`log-content-area${isLoading ? ' log-fading' : ''}`}>
              {trackedIngredients.length === 0 && !isLoading ? (
                <div className="empty-log-placeholder">
                  <span className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', opacity: 0.6, marginBottom: '12px' }}>
                      <path d="M12 2a15.3 15.3 0 0 1 4 7H8a15.3 15.3 0 0 1 4-7z" />
                      <path d="M2 12h20" />
                      <path d="M4 12v1a8 8 0 0 0 16 0v-1" />
                      <path d="M12 12v3" />
                      <path d="M8 12c.5 1 1 2 2 2" />
                      <path d="M16 12c-.5 1-1 2-2 2" />
                    </svg>
                  </span>
                  <p>No ingredients logged for today.</p>
                  <p className="subtext">Use the lookup panel to search and add food items.</p>
                </div>
              ) : (
                <div className="ingredients-log-list">
                  {trackedIngredients.map(item => (
                    <div key={item.id} className="logged-item">
                      <div className="logged-item-info">
                        <span className="logged-item-name">{item.name}</span>
                        <span className="logged-item-macros">
                          {Math.round(item.caloriesPer100g * (item.weight / 100))} kcal |{' '}
                          {Math.round(item.proteinPer100g * (item.weight / 100))}g P |{' '}
                          {Math.round(item.carbsPer100g * (item.weight / 100))}g C |{' '}
                          {Math.round(item.fatPer100g * (item.weight / 100))}g F
                        </span>
                      </div>

                      <div className="logged-item-actions">
                        <div className="weight-adjuster">
                          <input
                            type="number"
                            className="weight-input"
                            value={item.weight}
                            min="1"
                            onChange={e =>
                              handleUpdateWeight(item.id, parseFloat(e.target.value) || 0)
                            }
                          />
                          <span className="weight-unit">g</span>
                        </div>
                        <button
                          className="delete-item-btn"
                          onClick={() => handleDeleteTracked(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Suggestions Card */}
          <div className={`panel-card suggestions-card${isLoading ? ' log-fading' : ''}`}>
            <h2 className="panel-title">Recommended Additions</h2>
            <div className="suggestions-grid">
              {suggestions.map(sug => (
                <div key={sug.id} className="suggestion-item-card">
                  <div className="sug-header">
                    <span className="sug-name">{sug.name}</span>
                    <button
                      className="btn-sug-add"
                      onClick={() => handleQuickAddSuggestion(sug)}
                    >
                      + 100g
                    </button>
                  </div>
                  <p className="sug-reason">{sug.reason}</p>
                  <div className="sug-macros">
                    <span>{sug.caloriesPer100g} kcal</span>
                    <span>P: {sug.proteinPer100g}g</span>
                    <span>C: {sug.carbsPer100g}g</span>
                    <span>F: {sug.fatPer100g}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Search Lookup & Custom Foods */}
        <div className="tracker-right-panel">
          <div className="panel-card tabs-card">
            <div className="panel-tabs">
              <button
                className={`panel-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
                onClick={() => setActiveTab('log')}
              >
                Food Search
              </button>
              <button
                className={`panel-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
              >
                Custom Foods ({customFoods.length})
              </button>
              <button
                className={`panel-tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => setActiveTab('goals')}
              >
                Daily Goals
              </button>
            </div>

            <div className="tab-contents">
              {/* Tab 1: Food search lookup */}
              {activeTab === 'log' && (
                <TrackerLogTab
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  showDropdown={showDropdown}
                  setShowDropdown={setShowDropdown}
                  searchResults={searchResults}
                  dropdownRef={dropdownRef}
                  selectedFood={selectedFood}
                  setSelectedFood={setSelectedFood}
                  addWeight={addWeight}
                  setAddWeight={setAddWeight}
                  handleSelectFood={handleSelectFood}
                  handleAddFood={handleAddFood}
                  favourites={favourites}
                  frequentFoods={frequentFoods}
                  handleToggleFavourite={handleToggleFavourite}
                />
              )}

              {/* Tab 2: Custom foods creation and list */}
              {activeTab === 'custom' && (
                <CustomFoodsTab
                  customForm={customForm}
                  setCustomForm={setCustomForm}
                  formError={formError}
                  formSuccess={formSuccess}
                  customFoods={customFoods}
                  handleCreateCustomFood={handleCreateCustomFood}
                  handleSelectFood={handleSelectFood}
                />
              )}

              {/* Tab 3: Daily Goals editing */}
              {activeTab === 'goals' && (
                <GoalsTab
                  goalsForm={goalsForm}
                  setGoalsForm={setGoalsForm}
                  goalsError={goalsError}
                  goalsSuccess={goalsSuccess}
                  handleUpdateGoals={handleUpdateGoals}
                />
              )}
            </div>
          </div>
          
          {/* Calorie consumption history chart */}
          <CalorieHistoryChart
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            calorieGoal={goals.calories}
            rangeIngredients={rangeIngredients}
          />
        </div>
      </div>
    </div>
  )
}
