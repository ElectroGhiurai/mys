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
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise(r => setTimeout(r, 800)) // simulate delay
    if (credentials.email === 'error@test.com') {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials', field: 'email' }
    }
    return {
      user: { id: '1', username: 'demo_user', email: credentials.email },
      accessToken: 'mock_jwt_token_123'
    }
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // for HttpOnly cookie support
    body: JSON.stringify(credentials),
  })
  return handleResponse(res)
}

export async function register(data: Record<string, string>) {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise(r => setTimeout(r, 800))
    return {
      user: { id: '2', username: data.username, email: data.email },
      accessToken: 'mock_jwt_token_456'
    }
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function refresh() {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise(r => setTimeout(r, 400))
    // To simulate being logged out initially on mock mode, we can just throw.
    // If we want them to stay logged in across reloads on mock mode, we'd use localStorage.
    // Let's just simulate being logged out.
    throw { code: 'UNAUTHORIZED', message: 'No session' }
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleResponse(res)
}
