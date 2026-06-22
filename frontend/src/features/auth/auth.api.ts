/**
 * Auth API — handles all HTTP communication for authentication.
 * Returns { data } on success, throws { code, message, field? } on failure.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

async function handleResponse(res: Response) {
  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = body?.error ?? {}
    throw {
      code: err.code ?? 'SERVER_ERROR',
      message: err.message ?? 'Something went wrong. Please try again.',
      field: err.details?.field ?? null,
    }
  }

  return body.data
}

export async function login(credentials: Record<string, string>) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // for HttpOnly cookie support
    body: JSON.stringify(credentials),
  })
  return handleResponse(res)
}

export async function register(data: Record<string, string>) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function refresh() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleResponse(res)
}
