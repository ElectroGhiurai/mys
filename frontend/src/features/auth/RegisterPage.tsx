import { useNavigate, Link } from 'react-router-dom'
import { useAuthForm } from './useAuthForm'
import { FormField, ServerErrorBanner } from './AuthFormFields'
import { useAuth } from './AuthContext'
import { register } from './auth.api'
import './AuthPage.css'

/**
 * Register page — single responsibility: render the registration form.
 */
export default function RegisterPage() {
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const handleRegister = async (values: Record<string, string>) => {
    const data = await register(values)
    loginUser(data.user, data.accessToken)
    navigate('/dashboard')
  }

  const { values, errors, serverError, isLoading, handleChange, handleSubmit } =
    useAuthForm({
      fields: ['username', 'email', 'password'],
      onSubmit: handleRegister,
    })

  return (
    <main className="auth-page" id="main-content">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join us — it only takes a moment</p>
        </header>

        <ServerErrorBanner message={serverError} />

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Registration form"
        >
          <FormField
            id="register-username"
            label="Username"
            type="text"
            name="username"
            value={values.username}
            onChange={handleChange}
            error={errors.username}
          />
          <FormField
            id="register-email"
            label="Email address"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormField
            id="register-password"
            label="Password"
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />
          <p className="auth-hint">Must be at least 8 characters.</p>

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-btn__spinner" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <footer className="auth-card__footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link-btn">
              Sign in
            </Link>
          </p>
        </footer>
      </div>
    </main>
  )
}
