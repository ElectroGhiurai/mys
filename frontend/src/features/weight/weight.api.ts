import { z } from 'zod'

export const WeightLogSchema = z.object({
  id: z.string().uuid(),
  weightKg: z.number(),
  loggedDate: z.string(),
})

export type WeightLog = z.infer<typeof WeightLogSchema>;

export interface LogWeightRequest {
  weightKg: number;
  loggedDate: string;
}

type ApiRequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

/**
 * Service to interact with the backend Weight Log API.
 * Performs runtime schema validation on all responses.
 * 
 * Note: The `request` function passed from `useApi` automatically unwraps
 * `{ data: ... }` response envelopes (as defined in `apiFetch.ts:51`),
 * so the raw parameters passed to `parse()` are already the unwrapped bodies.
 */
export const weightApi = {
  getWeights: async (request: ApiRequestFn): Promise<WeightLog[]> => {
    const raw = await request<unknown>('/weights')
    return z.array(WeightLogSchema).parse(raw)
  },

  logWeight: async (request: ApiRequestFn, data: LogWeightRequest): Promise<WeightLog> => {
    const raw = await request<unknown>('/weights', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return WeightLogSchema.parse(raw)
  },

  deleteWeight: async (request: ApiRequestFn, id: string): Promise<null> => {
    return request<null>(`/weights/${id}`, {
      method: 'DELETE',
    })
  },
}
