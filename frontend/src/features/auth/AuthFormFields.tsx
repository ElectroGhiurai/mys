import { ChangeEventHandler } from 'react'
import './AuthPage.css'

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string | null;
  required?: boolean;
}

/**
 * A single, reusable form field: label + input + accessible error message.
 * Follows WCAG 2.1 AA: label association, aria-describedby, aria-invalid, aria-required.
 */
export function FormField({ id, label, type = 'text', name, value, onChange, error, required = true }: FormFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
        {required && <span className="auth-required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`auth-input${error ? ' auth-input--error' : ''}`}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : name}
      />
      {error && (
        <p id={errorId} className="auth-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Server-level error banner (non-field errors).
 */
export function ServerErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="auth-server-error" role="alert" aria-live="assertive">
      <span className="auth-server-error__icon" aria-hidden="true">⚠</span>
      {message}
    </div>
  )
}
