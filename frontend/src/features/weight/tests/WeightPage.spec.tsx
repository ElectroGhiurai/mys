import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { WeightPage } from '../WeightPage'

// Mock useApi
const mockRequest = vi.fn()
vi.mock('../../../infrastructure/apiFetch', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('WeightPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // Default mock implementation
    mockRequest.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path.startsWith('/weights')) {
        if (options?.method === 'POST') {
          return { id: '6eb618b4-572d-4565-8d70-abce6692b2d3', weightKg: 79.5, loggedDate: '2026-06-23' }
        }
        return [
          { id: '40ff81d5-05ab-459f-b9c3-fdd353c9b29f', weightKg: 80.5, loggedDate: '2026-06-22' }
        ]
      }
      if (path.startsWith('/goals')) {
        if (options?.method === 'PUT') {
          return {
            calorieGoal: 2000,
            proteinGoal: 130,
            carbGoal: 220,
            fatGoal: 70,
            startingWeightKg: 84.0,
            targetWeightKg: 75.0
          }
        }
        return {
          calorieGoal: 2000,
          proteinGoal: 130,
          carbGoal: 220,
          fatGoal: 70,
          startingWeightKg: 85.0,
          targetWeightKg: 75.0
        }
      }
      return null
    })
  })

  it('renders title, metrics and loaded weight logs history', async () => {
    // Act
    render(<WeightPage />)

    // Wait for mock data to resolve and render
    await waitFor(() => {
      expect(screen.getAllByText(/85(\.0)?\s*kg/i)[0]).toBeInTheDocument() // Starting
      expect(screen.getAllByText(/80\.5\s*kg/i)[0]).toBeInTheDocument() // Current
      expect(screen.getAllByText(/75(\.0)?\s*kg/i)[0]).toBeInTheDocument() // Target
      expect(screen.getAllByText(/4\.5\s*kg/i)[0]).toBeInTheDocument() // Total Lost (85 - 80.5)
      expect(screen.getByText(/Target Loss Progress/i)).toBeInTheDocument()
    })
  })

  it('supports logging weight on form submission', async () => {
    const user = userEvent.setup()

    // Act
    render(<WeightPage />)

    await screen.findByText('85 kg')

    const weightInput = screen.getByLabelText(/weight \(kg\)/i)
    await user.clear(weightInput)
    await user.type(weightInput, '79.5')

    const submitBtn = screen.getByRole('button', { name: /log weight/i })
    await user.click(submitBtn)

    // Assert
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/weights', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"weightKg":79.5')
      }))
      expect(screen.getByText(/weight logged successfully/i)).toBeInTheDocument()
    })
  })

  it('supports toggling goals configuration drawer and saving goals', async () => {
    const user = userEvent.setup()

    // Act
    render(<WeightPage />)

    await screen.findByText('85 kg')

    const toggleBtn = screen.getByRole('button', { name: /configure weight goals/i })
    await user.click(toggleBtn)

    // Wait for drawer inputs to render
    const startingInput = screen.getByLabelText(/starting weight \(kg\)/i)
    expect(startingInput).toHaveValue(85.0)

    await user.clear(startingInput)
    await user.type(startingInput, '84.0')

    const saveBtn = screen.getByRole('button', { name: /save goals/i })
    await user.click(saveBtn)

    // Assert
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/goals', expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"startingWeightKg":84')
      }))
      expect(screen.getByText(/goals updated successfully/i)).toBeInTheDocument()
    })
  })

  it('supports deleting a weight log via inline confirmation', async () => {
    const user = userEvent.setup()
    
    render(<WeightPage />)
    
    // Find the delete button for the log
    const deleteBtn = await screen.findByRole('button', { name: /delete weight log/i })
    await user.click(deleteBtn)
    
    // Assert inline "Confirm" and "Cancel" buttons are shown
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    expect(confirmBtn).toBeInTheDocument()
    expect(cancelBtn).toBeInTheDocument()
    
    // Click Confirm
    await user.click(confirmBtn)
    
    // Verify DELETE request is fired
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/weights/40ff81d5-05ab-459f-b9c3-fdd353c9b29f', expect.objectContaining({
        method: 'DELETE'
      }))
    })
  })

  it('renders error message when API call fails', async () => {
    // Configure mock to fail
    mockRequest.mockRejectedValue(new Error('Network error loading goals'))
    
    render(<WeightPage />)
    
    // Assert error message is rendered
    expect(await screen.findByText('Network error loading goals')).toBeInTheDocument()
  })
})
