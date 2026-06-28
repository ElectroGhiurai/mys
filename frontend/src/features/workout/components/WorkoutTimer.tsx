import { useState, useEffect, useRef } from 'react'

const WORKOUT_TIMER_TRIGGER_EVENT = 'workout-timer-trigger';

export function WorkoutTimer() {
  const [activeTab, setActiveTab] = useState<'rest' | 'stopwatch'>('rest')

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(60)
  const [initialRestSeconds, setInitialRestSeconds] = useState(60)
  const [isRestRunning, setIsRestRunning] = useState(false)

  // Stopwatch State
  const [stopwatchMs, setStopwatchMs] = useState(0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const stopwatchStartRef = useRef<number>(0)
  const stopwatchAccumulatedRef = useRef<number>(0)

  // Audio chime synthesizer using native Web Audio API
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)
        
        gain.gain.setValueAtTime(0.15, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + duration)
      }
      
      playTone(587.33, ctx.currentTime, 0.4) // D5
      playTone(880.00, ctx.currentTime + 0.15, 0.6) // A5
    } catch (err) {
      console.warn('AudioContext failed:', err)
    }
  }

  // Rest Timer Effect
  useEffect(() => {
    let interval: any
    if (isRestRunning && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            setIsRestRunning(false)
            playChime()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRestRunning, restSeconds])

  // Stopwatch Effect
  useEffect(() => {
    let animationFrameId: number
    const updateStopwatch = () => {
      setStopwatchMs(Date.now() - stopwatchStartRef.current + stopwatchAccumulatedRef.current)
      animationFrameId = requestAnimationFrame(updateStopwatch)
    }
    if (isStopwatchRunning) {
      stopwatchStartRef.current = Date.now()
      animationFrameId = requestAnimationFrame(updateStopwatch)
    }
    return () => cancelAnimationFrame(animationFrameId)
  }, [isStopwatchRunning])

  // Listen for auto-rest timer trigger
  useEffect(() => {
    const handleTrigger = () => {
      setIsRestRunning(false)
      setRestSeconds(initialRestSeconds)
      setIsRestRunning(true)
      setActiveTab('rest')
    }
    window.addEventListener(WORKOUT_TIMER_TRIGGER_EVENT, handleTrigger)
    return () => window.removeEventListener(WORKOUT_TIMER_TRIGGER_EVENT, handleTrigger)
  }, [initialRestSeconds])

  // Rest Timer Handlers
  const handleStartRest = () => setIsRestRunning(true)
  const handlePauseRest = () => setIsRestRunning(false)
  const handleResetRest = () => {
    setIsRestRunning(false)
    setRestSeconds(initialRestSeconds)
  }
  const handleSetRestDuration = (sec: number) => {
    setIsRestRunning(false)
    setInitialRestSeconds(sec)
    setRestSeconds(sec)
  }
  const handleAdd30s = () => {
    setRestSeconds(prev => prev + 30)
    if (!isRestRunning) {
      setInitialRestSeconds(prev => prev + 30)
    }
  }

  // Stopwatch Handlers
  const handleStartStopwatch = () => {
    setIsStopwatchRunning(true)
  }
  const handlePauseStopwatch = () => {
    setIsStopwatchRunning(false)
    stopwatchAccumulatedRef.current += Date.now() - stopwatchStartRef.current
  }
  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false)
    stopwatchAccumulatedRef.current = 0
    setStopwatchMs(0)
  }

  // Time formatters
  const formatRestTime = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatStopwatchTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    const centis = Math.floor((ms % 1000) / 100)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${centis}`
  }

  // SVG circular countdown calculations
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = initialRestSeconds > 0
    ? circumference - (restSeconds / initialRestSeconds) * circumference
    : 0

  return (
    <div className="workout-card shadow-sm workout-timer-card">
      <div className="timer-tabs">
        <button
          className={`timer-tab-btn ${activeTab === 'rest' ? 'active' : ''}`}
          onClick={() => setActiveTab('rest')}
        >
          Rest Timer
        </button>
        <button
          className={`timer-tab-btn ${activeTab === 'stopwatch' ? 'active' : ''}`}
          onClick={() => setActiveTab('stopwatch')}
        >
          Stopwatch
        </button>
      </div>

      {activeTab === 'rest' ? (
        <div className="rest-timer-view">
          <div className="circle-timer-container">
            <svg className="progress-ring" width="120" height="120">
              <circle
                className="progress-ring-bg"
                stroke="var(--border-color, #333)"
                strokeWidth="6"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
              />
              <circle
                className="progress-ring-bar"
                stroke="var(--accent-color, #ff7b00)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: isRestRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.35s'
                }}
              />
            </svg>
            <div className="timer-text-overlay">
              {formatRestTime(restSeconds)}
            </div>
          </div>

          <div className="preset-buttons">
            {[30, 45, 60, 90, 120].map(sec => (
              <button
                key={sec}
                className={`preset-btn ${initialRestSeconds === sec ? 'active' : ''}`}
                onClick={() => handleSetRestDuration(sec)}
              >
                {sec}s
              </button>
            ))}
          </div>

          <div className="timer-controls">
            {isRestRunning ? (
              <button className="timer-btn pause" onClick={handlePauseRest}>Pause</button>
            ) : (
              <button className="timer-btn start" onClick={handleStartRest} disabled={restSeconds === 0}>Start</button>
            )}
            <button className="timer-btn add" onClick={handleAdd30s}>+30s</button>
            <button className="timer-btn reset" onClick={handleResetRest}>Reset</button>
          </div>
        </div>
      ) : (
        <div className="stopwatch-view">
          <div className="stopwatch-display">
            {formatStopwatchTime(stopwatchMs)}
          </div>

          <div className="timer-controls">
            {isStopwatchRunning ? (
              <button className="timer-btn pause" onClick={handlePauseStopwatch}>Pause</button>
            ) : (
              <button className="timer-btn start" onClick={handleStartStopwatch}>Start</button>
            )}
            <button className="timer-btn reset" onClick={handleResetStopwatch}>Reset</button>
          </div>
        </div>
      )}
    </div>
  )
}
