import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { TrackerPage } from '../TrackerPage'

// Mock useApi
const mockRequest = vi.fn()
vi.mock('../../../infrastructure/apiFetch', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('TrackerPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    // Set up default mock implementations
    mockRequest.mockImplementation(async (path: string) => {
      if (path.startsWith('/tracker/range')) {
        return [
          { date: new Date().toISOString().split('T')[0], calories: 1500, protein: 100, carbs: 180, fat: 50 }
        ]
      }
      if (path.startsWith('/tracker')) {
        return [
          {
            id: 'tracked-1',
            name: 'Apple',
            weight: 150,
            caloriesPer100g: 52,
            proteinPer100g: 0.3,
            carbsPer100g: 14,
            fatPer100g: 0.2,
            trackedDate: new Date().toISOString().split('T')[0],
          },
        ]
      }
      if (path.startsWith('/foods/custom')) {
        return [
          {
            id: 'custom-1',
            name: 'Custom Protein Shake',
            calories: 250,
            protein: 30,
            carbs: 10,
            fat: 3,
            isCustom: true,
          },
        ]
      }
      if (path.startsWith('/goals')) {
        return {
          calorieGoal: 2000,
          proteinGoal: 130,
          carbGoal: 220,
          fatGoal: 70,
        }
      }
      return null
    })
  })

  it('renders date navigation and loaded tracked ingredients', async () => {
    // Act
    render(<TrackerPage />)

    // Assert date nav
    expect(screen.getAllByRole('button', { name: /prev/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /next/i })[0]).toBeInTheDocument()

    // Wait for mock data to resolve and render
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText(/78 kcal/i)).toBeInTheDocument() // 52 * 1.5
    })
  })

  it('supports swapping tabs to Custom Foods and displays created list', async () => {
    const user = userEvent.setup()
    
    // Act
    render(<TrackerPage />)

    // Wait for mount loads
    await screen.findByText('Apple')

    const customTabBtn = screen.getByRole('button', { name: /custom foods/i })
    await user.click(customTabBtn)

    // Assert
    expect(screen.getByRole('heading', { name: /create custom ingredient/i })).toBeInTheDocument()
    expect(screen.getByText('Custom Protein Shake')).toBeInTheDocument()
    expect(screen.getByText(/250 kcal | P: 30g/i)).toBeInTheDocument()
  })

  it('supports swapping tabs to Daily Goals and updates goals form fields', async () => {
    const user = userEvent.setup()
    
    // Act
    render(<TrackerPage />)

    // Wait for mount loads
    await screen.findByText('Apple')

    const goalsTabBtn = screen.getByRole('button', { name: /daily goals/i })
    await user.click(goalsTabBtn)

    // Assert goals form
    expect(screen.getByRole('heading', { name: /set daily nutrition goals/i })).toBeInTheDocument()
    
    const calorieInput = screen.getByLabelText(/daily calorie target/i)
    expect(calorieInput).toHaveValue(2000)
  })
})
