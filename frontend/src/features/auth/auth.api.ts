import { z } from 'zod'

/**
 * ARCHITECTURAL DECISION:
 * Direct fetch() calls are used in this file to bypass the centralized useApi hook.
 * This is an intentional decision to avoid a circular dependency boot cycle:
 * The AuthContext needs to invoke refresh() to establish the session before
 * the useApi hook can be initialized with an authenticated state.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

// Zod Schemas for Runtime Validation
export const UserSummarySchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
})

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSummarySchema,
})

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

async function handleResponse<T>(res: Response, schema: z.Schema<T>): Promise<T> {
  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = body?.error ?? {}
    throw {
      code: err.code ?? 'SERVER_ERROR',
      message: err.message ?? 'Something went wrong. Please try again.',
      field: err.details?.field ?? null,
    }
  }

  // Parse and validate response shape at runtime
  return schema.parse(body.data)
}

export async function login(credentials: Record<string, string>): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // for HttpOnly cookie support
    body: JSON.stringify(credentials),
  })
  return handleResponse(res, AuthResponseSchema)
}

export async function register(data: Record<string, string>): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse(res, AuthResponseSchema)
}

export async function refresh(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleResponse(res, AuthResponseSchema)
}
