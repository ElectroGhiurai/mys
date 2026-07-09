import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { WorkoutPage } from '../WorkoutPage'

// Mock useApi
const mockRequest = vi.fn()
vi.mock('../../../infrastructure/apiFetch', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('WorkoutPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    mockRequest.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path.startsWith('/exercises')) {
        if (options?.method === 'POST') {
          return {
            id: '8cb618b4-572d-4565-8d70-abce6692b2d3',
            exerciseName: 'Bench Press',
            category: 'Chest',
            loggedDate: '2026-06-23',
            sets: [
              { id: 'a0f7b0f0-8c2a-4f5b-9b1b-6eb618b4572d', setNumber: 1, weight: 80.0, reps: 10 }
            ]
          }
        }
        if (options?.method === 'DELETE') {
          return null
        }
        return [
          {
            id: '40ff81d5-05ab-459f-b9c3-fdd353c9b29f',
            exerciseName: 'Bench Press',
            category: 'Chest',
            loggedDate: '2026-06-22',
            sets: [
              { id: 'b0f7b0f0-8c2a-4f5b-9b1b-6eb618b4572e', setNumber: 1, weight: 70.0, reps: 10 },
              { id: 'c0f7b0f0-8c2a-4f5b-9b1b-6eb618b4572f', setNumber: 2, weight: 75.0, reps: 8 }
            ]
          }
        ]
      }
      return null
    })
  })

  it('renders title, metrics cards and history log table', async () => {
    render(<WorkoutPage />)

    await waitFor(() => {
      expect(screen.getByText('Workout Tracker')).toBeInTheDocument()
      expect(screen.getByText('Total Workouts')).toBeInTheDocument()
      expect(screen.getByText('75 kg')).toBeInTheDocument() // max weight
      expect(screen.getAllByText('Bench Press')[0]).toBeInTheDocument()
    })
  })

  it('supports logging workout on form submission', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    // Switch to Log Single Exercise tab
    const logTabBtn = screen.getByRole('button', { name: /log single exercise/i })
    await user.click(logTabBtn)

    // Find and type custom exercise name by enabling custom toggle
    const toggleCustomBtn = screen.getByRole('button', { name: /write custom/i })
    await user.click(toggleCustomBtn)

    const exerciseInput = screen.getByPlaceholderText(/e.g. incline db flys/i)
    await user.clear(exerciseInput)
    await user.type(exerciseInput, 'Dumbbell Flys')

    const submitBtn = screen.getByRole('button', { name: /log workout/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/exercises', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"exerciseName":"Dumbbell Flys"')
      }))
      expect(screen.getByText(/workout logged successfully/i)).toBeInTheDocument()
    })
  })

  it('supports inline deletion of workout log', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    const deleteBtn = screen.getByRole('button', { name: /delete log/i })
    await user.click(deleteBtn)

    // Inline confirm box is shown
    expect(screen.getByText('Confirm?')).toBeInTheDocument()
    const confirmYesBtn = screen.getByRole('button', { name: /yes/i })
    await user.click(confirmYesBtn)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/exercises/40ff81d5-05ab-459f-b9c3-fdd353c9b29f', expect.objectContaining({
        method: 'DELETE'
      }))
    })
  })

  it('supports view mode toggling and showing checklist/timer in active-session mode', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    // Initially in Dashboard mode
    expect(screen.getByText('Total Workouts')).toBeInTheDocument()
    expect(screen.queryByText('Select Active Routine')).not.toBeInTheDocument()
    expect(screen.queryByText('Reset Checks')).not.toBeInTheDocument()

    // Toggle to Active Gym Session mode
    const activeSessionBtn = screen.getByRole('button', { name: /active session/i })
    await user.click(activeSessionBtn)

    // Now in Active Gym Session mode
    expect(screen.getByText('Select Active Routine')).toBeInTheDocument()
    expect(screen.getByText('Reset Checks')).toBeInTheDocument()
    expect(screen.queryByText('Total Workouts')).not.toBeInTheDocument() // Metrics hidden
  })

  it('supports expanding correct-form guides for exercises', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    // Switch to Active Gym Session mode
    const activeSessionBtn = screen.getByRole('button', { name: /active session/i })
    await user.click(activeSessionBtn)

    // Expand guide for Dumbbell Press
    const guideBtns = screen.getAllByTitle('View form guide')
    await user.click(guideBtns[0]!) // Dumbbell Press guide button

    // Should display Correct Form Tips
    expect(screen.getByText('Correct Form Tips:')).toBeInTheDocument()
    expect(screen.getByText(/lie flat on a bench/i)).toBeInTheDocument()
  })

  it('supports bulk-logging completed exercises from checklist', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    // Switch to Active Gym Session mode
    const activeSessionBtn = screen.getByRole('button', { name: /active session/i })
    await user.click(activeSessionBtn)

    // By default, the selected routine is 'Push Day'
    // Let's check the first exercise checkbox (Dumbbell Press)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0]!) // check Dumbbell Press

    // Bulk log button should appear
    const bulkLogBtn = screen.getByRole('button', { name: /log completed \(1\)/i })
    await user.click(bulkLogBtn)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/exercises', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"exerciseName":"Dumbbell Press"')
      }))
    })
  })

  it('supports exporting workout logs as CSV', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    const createObjectURLMock = vi.fn(() => 'blob:url')
    const revokeObjectURLMock = vi.fn()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock
    
    const clickMock = vi.fn()
    const createElementMock = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = createElementMock(tagName)
      if (tagName === 'a') {
        el.click = clickMock
      }
      return el
    })

    const exportBtn = screen.getByRole('button', { name: /export csv/i })
    await user.click(exportBtn)

    expect(createObjectURLMock).toHaveBeenCalled()
    expect(clickMock).toHaveBeenCalled()
  })

  it('supports importing workout logs from CSV', async () => {
    const user = userEvent.setup()
    render(<WorkoutPage />)

    await screen.findByText('75 kg')

    const fileContent = 'Date,Exercise Name,Category,Set Number,Weight (kg),Reps,Distance (km),Duration (min)\n2026-06-23,Bench Press,Chest,1,80,10,,\n'
    const file = new File([fileContent], 'workouts.csv', { type: 'text/csv' })

    const importInput = screen.getByTitle(/import history from csv/i).querySelector('input[type="file"]') as HTMLInputElement
    expect(importInput).toBeInTheDocument()

    await user.upload(importInput, file)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/exercises', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"exerciseName":"Bench Press"')
      }))
    })
  })
})
