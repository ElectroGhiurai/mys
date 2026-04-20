import { useNavigate, Link } from 'react-router-dom'
import { useAuthForm } from './useAuthForm'
import { FormField, ServerErrorBanner } from './AuthFormFields'
import { useAuth } from './AuthContext'
import { login } from './auth.api'
import './AuthPage.css'

/**
 * Login page — single responsibility: render the login form and delegate to useAuthForm.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const handleLogin = async (values: Record<string, string>) => {
    const data = await login(values)
    loginUser(data.user, data.accessToken)
    navigate('/dashboard')
  }

  const { values, errors, serverError, isLoading, handleChange, handleSubmit } =
    useAuthForm({
      fields: ['email', 'password'],
      onSubmit: handleLogin,
    })

  return (
    <main className="auth-page" id="main-content">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </header>

        <ServerErrorBanner message={serverError} />

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Login form"
        >
          <FormField
            id="login-email"
            label="Email address"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormField
            id="login-password"
            label="Password"
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-btn__spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <footer className="auth-card__footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link-btn">
              Create one
            </Link>
          </p>
        </footer>
      </div>
    </main>
  )
}
