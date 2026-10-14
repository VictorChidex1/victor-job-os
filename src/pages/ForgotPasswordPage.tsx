import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePageMeta } from '@/hooks/usePageMeta'
import { sendPasswordReset } from '@/services/auth'

function toResetErrorMessage(error: unknown): string {
  const code =
    error instanceof Error && 'code' in error ? String((error as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Unable to send the reset link. Please try again.'
  }
}

function isUnknownUser(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    String((error as { code: unknown }).code) === 'auth/user-not-found'
  )
}

export function ForgotPasswordPage() {
  usePageMeta({
    title: 'Reset password — Victor Job OS',
    description: 'Request a password reset link for your Victor Job OS account.',
    noindex: true,
    path: '/forgot-password',
  })

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (resetError) {
      // Never reveal whether an account exists (avoid enumeration).
      if (isUnknownUser(resetError)) {
        setSent(true)
      } else {
        setError(toResetErrorMessage(resetError))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fbfbfd] p-6 text-slate-900 selection:bg-sky-500/15 selection:text-sky-700">
      {/* Background architectural grid */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#00000007_1px,transparent_1px),linear-gradient(to_bottom,#00000007_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_70%,transparent_100%)]" />

      {/* Ambient aurora glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[12%] -left-[10%] size-[600px] rounded-full bg-sky-200/50 blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-[18%] right-[8%] size-[650px] rounded-full bg-indigo-200/50 blur-[140px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:p-10">
        {/* Top return link */}
        <div className="mb-6">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>Back to home</span>
          </Link>
        </div>

        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/assets/victor-job-os.png"
            alt="Victor Job OS logo"
            className="mb-3 size-12 rounded-xl object-contain shadow-xs"
          />
          {sent ? (
            <>
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Check your email</h1>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                If an account exists for <span className="font-medium text-slate-700">{email}</span>,
                we&apos;ve sent a link to reset your password.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h1>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Enter the email address associated with your account and we&apos;ll send you a reset link.
              </p>
            </>
          )}
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[0.7rem] leading-relaxed text-slate-500">
              Didn&apos;t receive it? Check your spam folder, or try again in a few minutes.
            </p>
            <Button
              type="button"
              onClick={() => {
                setSent(false)
                setError(null)
              }}
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-200 bg-white font-medium text-slate-800 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              Send again
            </Button>
            <Link
              to="/login"
              className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all hover:bg-slate-800"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900/10"
                />
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-2xs"
                role="alert"
              >
                <span className="font-semibold text-rose-800">Notice:</span>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 h-11 w-full rounded-xl bg-slate-950 font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all hover:bg-slate-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Send reset link
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>

            <Link
              to="/login"
              className="group flex items-center justify-center gap-1.5 pt-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to sign in
            </Link>
          </form>
        )}

        {/* Security footer */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[0.68rem] text-slate-500">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>Encrypted Authentication · Firebase Security Rules Protected</span>
          </p>
        </div>
      </div>
    </main>
  )
}
