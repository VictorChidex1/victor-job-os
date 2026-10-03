import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { signInWithEmail, signInWithGoogle } from '@/services/auth'

function toAuthErrorMessage(error: unknown): string {
  const code =
    error instanceof Error && 'code' in error ? String((error as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Unable to sign in. Please try again.'
  }
}

export function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'email' | 'google' | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting('email')
    try {
      await signInWithEmail(email, password)
      navigate(from, { replace: true })
    } catch (signInError) {
      setError(toAuthErrorMessage(signInError))
    } finally {
      setSubmitting(null)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setSubmitting('google')
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (signInError) {
      setError(toAuthErrorMessage(signInError))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img
            src="/assets/victor-chidera-logo.webp"
            alt="Victor's Job OS logo"
            className="mx-auto mb-2 size-12 rounded-lg object-contain"
          />
          <CardTitle>Victor&apos;s Job OS</CardTitle>
          <CardDescription>Sign in to your opportunity command center.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting !== null}>
              {submitting === 'email' ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={submitting !== null}
            onClick={() => void handleGoogleSignIn()}
          >
            {submitting === 'google' ? 'Signing in…' : 'Continue with Google'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}