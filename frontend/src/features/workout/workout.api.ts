import { z } from 'zod'

export const ExerciseSetSchema = z.object({
  id: z.string().uuid().optional(),
  setNumber: z.number().int().positive(),
  weight: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  distanceKm: z.number().nullable().optional(),
  durationMinutes: z.number().int().nullable().optional(),
})

export type ExerciseSet = z.infer<typeof ExerciseSetSchema>;

export const ExerciseLogSchema = z.object({
  id: z.string().uuid(),
  exerciseName: z.string().min(1),
  category: z.string().min(1),
  loggedDate: z.string(),
  sets: z.array(ExerciseSetSchema),
})

export type ExerciseLog = z.infer<typeof ExerciseLogSchema>;

export interface LogExerciseSetRequest {
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
}

export interface LogExerciseRequest {
  id?: string;
  exerciseName: string;
  category: string;
  loggedDate: string;
  sets: LogExerciseSetRequest[];
}

type ApiRequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

/**
 * Service to interact with the backend Gym Exercise API.
 * Performs runtime schema validation on all responses.
 * 
 * Note: The `request` function passed from `useApi` automatically unwraps
 * `{ data: ... }` response envelopes (as defined in `apiFetch.ts:51`),
 * so the raw parameters passed to `parse()` are already the unwrapped bodies.
 */
export const workoutApi = {
  getExercises: async (request: ApiRequestFn): Promise<ExerciseLog[]> => {
    const raw = await request<unknown>('/exercises')
    return z.array(ExerciseLogSchema).parse(raw)
  },

  logExercise: async (request: ApiRequestFn, data: LogExerciseRequest): Promise<ExerciseLog> => {
    const raw = await request<unknown>('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return ExerciseLogSchema.parse(raw)
  },

  deleteExercise: async (request: ApiRequestFn, id: string): Promise<null> => {
    return request<null>(`/exercises/${id}`, {
      method: 'DELETE',
    })
  },
}
