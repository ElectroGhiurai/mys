import { useState, ChangeEvent, FormEvent } from 'react'

/**
 * Validates a single field and returns an error string or null.
 * Allowlist-based: checks for "good" patterns rather than filtering bad ones.
 */
function validateField(name: string, value: string): string | null {
  switch (name) {
    case 'email': {
      const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
      if (!value) return 'Email is required.'
      if (!emailPattern.test(value)) return 'Please enter a valid email address.'
      return null
    }
    case 'username': {
      if (!value) return 'Username is required.'
      if (value.length < 3) return 'Username must be at least 3 characters.'
      if (value.length > 30) return 'Username must be 30 characters or fewer.'
      if (!/^[a-zA-Z0-9_]+$/.test(value))
        return 'Username may only contain letters, numbers, and underscores.'
      return null
    }
    case 'password': {
      if (!value) return 'Password is required.'
      if (value.length < 8) return 'Password must be at least 8 characters.'
      return null
    }
    default:
      return null
  }
}

interface UseAuthFormProps {
  fields: string[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

export function useAuthForm({ fields, onSubmit }: UseAuthFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {})
  )
  const [errors, setErrors] = useState<Record<string, string | null>>(() =>
    fields.reduce((acc, f) => ({ ...acc, [f]: null }), {})
  )
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error as user types (fail fast but not aggressively)
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  function validateAll() {
    const newErrors: Record<string, string | null> = {}
    let isValid = true
    for (const field of fields) {
      const error = validateField(field, values[field])
      newErrors[field] = error
      if (error) isValid = false
    }
    setErrors(newErrors)
    return isValid
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    if (!validateAll()) return

    setIsLoading(true)
    try {
      await onSubmit(values)
    } catch (err: any) {
      // Map server field errors back to the correct field, otherwise show global error
      if (err?.field && fields.includes(err.field)) {
        setErrors((prev) => ({ ...prev, [err.field]: err.message }))
      } else {
        setServerError(err?.message ?? 'An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { values, errors, serverError, isLoading, handleChange, handleSubmit }
}
