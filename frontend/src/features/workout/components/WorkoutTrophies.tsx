import { ExerciseLog } from '../workout.api'
import { WeightLog } from '../../weight/weight.api'
import { TrackedIngredient } from '../../tracker/tracker.api'

export interface WorkoutTrophiesProps {
  exercises: ExerciseLog[];
  weightLogs: WeightLog[];
  todayFoodItems: TrackedIngredient[];
}

export function WorkoutTrophies({ exercises, weightLogs, todayFoodItems }: WorkoutTrophiesProps) {
  // Century Club: Lifted >= 100 kg on any exercise set
  const maxWeightLifted = exercises.reduce((max, log) => {
    const setMax = log.sets.reduce((sMax, s) => {
      const w = Number(s.weight) || 0
      return w > sMax ? w : sMax
    }, 0)
    return setMax > max ? setMax : max
  }, 0)
  const isCenturyClubUnlocked = maxWeightLifted >= 100

  // Consistency Master: Logged >= 3 workouts in the past 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentWorkoutsCount = Array.from(new Set(
    exercises
      .filter(log => new Date(log.loggedDate).getTime() >= sevenDaysAgo)
      .map(log => log.loggedDate.split('T')[0])
  )).length
  const isConsistencyUnlocked = recentWorkoutsCount >= 3

  // Cardio Crusader: Logged >= 30 mins or >= 5 km cardio session
  const maxCardioDist = exercises.reduce((max, log) => {
    if (log.category.toLowerCase() !== 'cardio') return max
    const setMax = log.sets.reduce((sMax, s) => {
      const d = Number(s.distanceKm) || 0
      return d > sMax ? d : sMax
    }, 0)
    return setMax > max ? setMax : max
  }, 0)
  
  const maxCardioDuration = exercises.reduce((max, log) => {
    if (log.category.toLowerCase() !== 'cardio') return max
    const setMax = log.sets.reduce((sMax, s) => {
      const d = Number(s.durationMinutes) || 0
      return d > sMax ? d : sMax
    }, 0)
    return setMax > max ? setMax : max
  }, 0)
  const isCardioCrusaderUnlocked = maxCardioDist >= 5 || maxCardioDuration >= 30

  // Weight Watcher: Logged weight on >= 5 different days
  const uniqueWeightDays = Array.from(new Set(
    weightLogs.map(log => log.loggedDate.split('T')[0])
  )).length
  const isWeightWatcherUnlocked = uniqueWeightDays >= 5

  // Healthy Habit: Logged food today
  const isHealthyHabitUnlocked = todayFoodItems.length > 0

  const trophiesList = [
    {
      id: 'century-club',
      title: 'Century Club',
      description: 'Lift 100+ kg on any exercise set',
      isUnlocked: isCenturyClubUnlocked,
      progressText: `${maxWeightLifted} / 100 kg`,
      progressPercent: Math.min(100, Math.round((maxWeightLifted / 100) * 100)),
      // Dumbbell SVG
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="4" height="10" rx="1" />
          <rect x="18" y="7" width="4" height="10" rx="1" />
          <line x1="6" y1="12" x2="18" y2="12" strokeWidth="3" />
          <line x1="6" y1="9" x2="6" y2="15" />
          <line x1="18" y1="9" x2="18" y2="15" />
        </svg>
      ),
      color: '#ff4757'
    },
    {
      id: 'consistency-master',
      title: 'Consistency Master',
      description: 'Log 3+ workouts in the last 7 days',
      isUnlocked: isConsistencyUnlocked,
      progressText: `${recentWorkoutsCount} / 3 sessions`,
      progressPercent: Math.min(100, Math.round((recentWorkoutsCount / 3) * 100)),
      // Flame/Lightning SVG
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      color: '#ffa502'
    },
    {
      id: 'cardio-crusader',
      title: 'Cardio Crusader',
      description: 'Log 5+ km distance or 30+ min duration',
      isUnlocked: isCardioCrusaderUnlocked,
      progressText: `${maxCardioDist} km / ${maxCardioDuration} min`,
      progressPercent: Math.min(100, Math.max(Math.round((maxCardioDist / 5) * 100), Math.round((maxCardioDuration / 3) * 10))),
      // Running Shoe SVG
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3.5a2.5 2.5 0 0 0-2.5-2.5H16M14 6h-4v2M3 13h10l2-4h5v4" />
          <circle cx="7.5" cy="16.5" r="1.5" />
          <circle cx="16.5" cy="16.5" r="1.5" />
        </svg>
      ),
      color: '#2ed573'
    },
    {
      id: 'weight-watcher',
      title: 'Weight Watcher',
      description: 'Log body weight on 5+ different days',
      isUnlocked: isWeightWatcherUnlocked,
      progressText: `${uniqueWeightDays} / 5 days`,
      progressPercent: Math.min(100, Math.round((uniqueWeightDays / 5) * 100)),
      // Scale balance SVG
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="5" y1="7" x2="19" y2="7" />
          <path d="M5 7l3 8h-6z" />
          <path d="M19 7l3 8h-6z" />
        </svg>
      ),
      color: '#1e90ff'
    },
    {
      id: 'healthy-habit',
      title: 'Healthy Habit',
      description: 'Log food calories for today',
      isUnlocked: isHealthyHabitUnlocked,
      progressText: isHealthyHabitUnlocked ? 'Logged today' : 'No logs today',
      progressPercent: isHealthyHabitUnlocked ? 100 : 0,
      // Apple SVG
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6c1.5-1.5 3-1.5 4 0s-2.5 4-4 4-3-2.5-4-4 2.5-1.5 4 0z" />
          <line x1="12" y1="2" x2="14" y2="5" />
        </svg>
      ),
      color: '#a5b1c2'
    }
  ]

  return (
    <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '28px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 4px 0', color: 'var(--heading-color)', fontSize: '1.1rem' }}>Personal Record Milestones</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete goals to unlock achievements</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {trophiesList.map(trophy => (
          <div
            key={trophy.id}
            style={{
              backgroundColor: 'var(--surface-color-2)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              opacity: trophy.isUnlocked ? 1 : 0.45,
              filter: trophy.isUnlocked ? 'none' : 'grayscale(60%)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: trophy.isUnlocked ? `0 8px 24px rgba(0, 0, 0, 0.15), inset 0 0 12px ${trophy.color}15` : 'none'
            }}
          >
            {/* Achievement Status Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '20px',
              backgroundColor: trophy.isUnlocked ? `${trophy.color}20` : 'rgba(255, 255, 255, 0.05)',
              color: trophy.isUnlocked ? trophy.color : 'var(--text-muted)',
              border: `1px solid ${trophy.isUnlocked ? `${trophy.color}40` : 'var(--border-color)'}`
            }}>
              {trophy.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Custom SVG Icon Container */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: trophy.isUnlocked ? `${trophy.color}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${trophy.isUnlocked ? `${trophy.color}30` : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: trophy.isUnlocked ? trophy.color : 'var(--text-muted)',
                boxShadow: trophy.isUnlocked ? `0 0 15px ${trophy.color}30` : 'none'
              }}>
                {trophy.icon}
              </div>

              <div>
                <h4 style={{ margin: 0, color: 'var(--heading-color)', fontSize: '0.95rem', fontWeight: 700 }}>
                  {trophy.title}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {trophy.description}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                <span style={{ fontWeight: 600, color: trophy.isUnlocked ? trophy.color : 'var(--text-muted)' }}>{trophy.progressText}</span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '3px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${trophy.progressPercent}%`,
                  backgroundColor: trophy.isUnlocked ? trophy.color : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '3px',
                  boxShadow: trophy.isUnlocked ? `0 0 6px ${trophy.color}` : 'none',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
