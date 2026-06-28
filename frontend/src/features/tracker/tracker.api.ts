import { z } from 'zod'

// Zod Schemas for Runtime Validation
export const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  isCustom: z.boolean(),
})

export const TrackedIngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number(),
  caloriesPer100g: z.number(),
  proteinPer100g: z.number(),
  carbsPer100g: z.number(),
  fatPer100g: z.number(),
  trackedDate: z.string(),
})

export const GoalDtoSchema = z.object({
  calorieGoal: z.number(),
  proteinGoal: z.number(),
  carbGoal: z.number(),
  fatGoal: z.number(),
  startingWeightKg: z.number().nullable().optional(),
  targetWeightKg: z.number().nullable().optional(),
})


export const DailySummaryDtoSchema = z.object({
  date: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
})

export type FoodItem = z.infer<typeof FoodItemSchema>;
export type TrackedIngredient = z.infer<typeof TrackedIngredientSchema>;
export type GoalDto = z.infer<typeof GoalDtoSchema>;
export type DailySummaryDto = z.infer<typeof DailySummaryDtoSchema>;

export interface CreateCustomFoodRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AddTrackedRequest {
  name: string;
  weight: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  trackedDate: string;
}

export interface UpdateGoalRequest {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  startingWeightKg?: number | null;
  targetWeightKg?: number | null;
}


type ApiRequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

/**
 * Service to interact with the backend Tracker API.
 * Uses the request function provided by the useApi hook.
 * Performs runtime schema validation on all responses.
 */
export const trackerApi = {
  searchFoods: async (request: ApiRequestFn, query: string): Promise<FoodItem[]> => {
    const raw = await request<unknown>(`/foods?query=${encodeURIComponent(query)}`)
    return z.array(FoodItemSchema).parse(raw)
  },

  createCustomFood: async (request: ApiRequestFn, data: CreateCustomFoodRequest): Promise<FoodItem> => {
    const raw = await request<unknown>('/foods/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return FoodItemSchema.parse(raw)
  },

  getCustomFoods: async (request: ApiRequestFn): Promise<FoodItem[]> => {
    const raw = await request<unknown>('/foods/custom')
    return z.array(FoodItemSchema).parse(raw)
  },

  getTracked: async (
    request: ApiRequestFn,
    params: string | { start: string; end: string }
  ): Promise<TrackedIngredient[]> => {
    const query = typeof params === 'string'
      ? `date=${params}`
      : `start=${params.start}&end=${params.end}`
    const raw = await request<unknown>(`/tracker?${query}`)
    return z.array(TrackedIngredientSchema).parse(raw)
  },

  addTracked: async (request: ApiRequestFn, data: AddTrackedRequest): Promise<TrackedIngredient> => {
    const raw = await request<unknown>('/tracker', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return TrackedIngredientSchema.parse(raw)
  },

  updateTracked: async (request: ApiRequestFn, id: string, weight: number): Promise<TrackedIngredient> => {
    const raw = await request<unknown>(`/tracker/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ weight }),
    })
    return TrackedIngredientSchema.parse(raw)
  },

  deleteTracked: async (request: ApiRequestFn, id: string): Promise<null> => {
    return request<null>(`/tracker/${id}`, {
      method: 'DELETE',
    })
  },

  getGoals: async (request: ApiRequestFn): Promise<GoalDto> => {
    const raw = await request<unknown>('/goals')
    return GoalDtoSchema.parse(raw)
  },

  updateGoals: async (request: ApiRequestFn, data: UpdateGoalRequest): Promise<GoalDto> => {
    const raw = await request<unknown>('/goals', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return GoalDtoSchema.parse(raw)
  },

  getTrackedRange: async (request: ApiRequestFn, startStr: string, endStr: string): Promise<DailySummaryDto[]> => {
    const raw = await request<unknown>(`/tracker/range?start=${startStr}&end=${endStr}`)
    return z.array(DailySummaryDtoSchema).parse(raw)
  },

  getFavourites: async (request: ApiRequestFn): Promise<FoodItem[]> => {
    const raw = await request<unknown>('/foods/favourites')
    return z.array(FoodItemSchema).parse(raw)
  },

  addFavourite: async (request: ApiRequestFn, data: { name: string; calories: number; protein: number; carbs: number; fat: number }): Promise<FoodItem> => {
    const raw = await request<unknown>('/foods/favourites', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return FoodItemSchema.parse(raw)
  },

  deleteFavourite: async (request: ApiRequestFn, id: string): Promise<null> => {
    return request<null>(`/foods/favourites/${id}`, {
      method: 'DELETE',
    })
  },

  getFrequent: async (request: ApiRequestFn): Promise<FoodItem[]> => {
    const raw = await request<unknown>('/foods/frequent')
    return z.array(FoodItemSchema).parse(raw)
  },
}
