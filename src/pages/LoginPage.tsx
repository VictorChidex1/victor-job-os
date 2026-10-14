import { useState, useRef, type FormEvent, type MouseEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/auth";

const currentYear = new Date().getFullYear();

function toAuthErrorMessage(error: unknown): string {
  const code =
    error instanceof Error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Authentication failed. Please verify your credentials.";
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function LoginPage() {
  usePageMeta({
    title: "Sign in — Victor Job OS",
    description:
      "Authenticate to access your private opportunity intelligence command center.",
    noindex: true,
    path: "/login",
  });

  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"email" | "google" | null>(null);

  // Interactive Spotlight coordinates for the auth card
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleCardMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  const from =
    (location.state as { from?: string } | null)?.from ?? "/app/dashboard";

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords match.");
      return;
    }
    setSubmitting("email");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name.trim() || undefined);
      } else {
        await signInWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (signInError) {
      setError(toAuthErrorMessage(signInError));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting("google");
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (signInError) {
      setError(toAuthErrorMessage(signInError));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col lg:flex-row bg-[#fbfbfd] text-slate-900 overflow-x-hidden selection:bg-sky-500/15 selection:text-sky-700">
      {/* Background Architectural Grid Pattern (Light Mode) */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#00000007_1px,transparent_1px),linear-gradient(to_bottom,#00000007_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_70%,transparent_100%)]" />

      {/* Ambient Breathing Pastel Aurora Glows (100% GPU Composited) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[12%] -left-[10%] size-[600px] rounded-full bg-sky-200/50 blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-[18%] right-[8%] size-[650px] rounded-full bg-indigo-200/50 blur-[140px]"
        />
      </div>

      {/* ============================================================ */}
      {/* LEFT STAGE: The Live Intelligence Showcase (Desktop 54% width) */}
      {/* ============================================================ */}
      <section className="relative z-10 flex flex-1 flex-col justify-between p-5 sm:p-10 lg:p-16 border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-white/40 backdrop-blur-xs">
        <div>
          {/* Top Header / Brand Badge (Responsive & Clean Single-Line Alignment) */}
          <div className="flex items-center justify-between gap-3 w-full">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <img
                src="/assets/victor-job-os.png"
                alt="Victor Job OS logo"
                className="size-7 sm:size-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform shrink-0"
              />
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap group-hover:text-sky-600 transition-colors">
                Victor Job OS
              </span>
            </Link>

            {/* Live Operational Status Pulse (Responsive & Never Wraps) */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/90 px-2.5 py-1 sm:px-3 text-xs shadow-xs shrink-0 whitespace-nowrap">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[0.65rem] sm:text-[0.68rem] font-semibold tracking-wider text-emerald-700 uppercase">
                <span className="sm:hidden">Active · v1.0</span>
                <span className="hidden sm:inline">System Active · v1.0 Secure</span>
              </span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="mt-8 sm:mt-14 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-600 mb-2.5 sm:mb-3">
              <Cpu className="size-3.5" />
              Autonomous Career Architecture
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.15] sm:leading-[1.12]">
              Your job search, running like a sovereign system.
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
              Continuous opportunity discovery, algorithmic fit qualification,
              and verifiable evidence matching — private to you.
            </p>
          </div>
        </div>

        {/* The "Expensive" Kinetic Telemetry Terminal Card (Light Mode Luxury) */}
        <div className="my-6 sm:my-10 max-w-xl">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-xl p-4 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
            {/* The Hardware Laser Scan Line (Compositor-only CSS/Motion animation) */}
            <motion.div
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent pointer-events-none opacity-70 shadow-[0_0_12px_rgba(14,165,233,0.5)] z-20"
              animate={{ top: ["0%", "100%"] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Terminal Top Window Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-rose-400/80" />
                <div className="size-2.5 rounded-full bg-amber-400/80" />
                <div className="size-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono text-[0.7rem] text-slate-500 font-medium">
                  telemetry://pipeline.live
                </span>
              </div>
              <span className="font-mono text-[0.65rem] text-sky-700 font-medium tracking-wider uppercase bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                Deterministic
              </span>
            </div>

            {/* Live Telemetry Pods */}
            <div className="mt-5 space-y-3 text-xs">
              {/* Pod 1: Discovery */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-sky-300 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                    <Radio className="size-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      ATS Stream Discovery
                    </div>
                    <div className="text-[0.7rem] text-slate-500">
                      Aggregating Greenhouse, Lever, Ashby
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-700 text-xs flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  18 Polled
                </div>
              </div>

              {/* Pod 2: Match Intelligence */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-indigo-300 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Algorithmic Fit Matrix
                    </div>
                    <div className="text-[0.7rem] text-slate-500">
                      Senior React • TypeScript • Cloud
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-sky-700 text-xs bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  94% Match
                </div>
              </div>

              {/* Pod 3: Human-in-the-Loop Safeguard */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-amber-300 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Outreach Evidence Drafting
                    </div>
                    <div className="text-[0.7rem] text-slate-500">
                      Grounded in verified project metrics
                    </div>
                  </div>
                </div>
                <div className="font-mono font-medium text-amber-800 text-[0.7rem] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Approval Gated
                </div>
              </div>
            </div>

            {/* Bottom Proof Badges */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[0.7rem] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-3.5 text-sky-600" /> Zero Cold
                Form Submissions
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="size-3.5 text-emerald-600" /> Real-time
                Firestore Sync
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Footer Meta (Hidden on mobile so it does not sit in the middle of the page) */}
        <div className="hidden lg:flex text-xs text-slate-500 items-center justify-between max-w-xl">
          <span>© {currentYear} Victor Job OS. All rights reserved.</span>
          <span className="font-mono text-[0.7rem] text-slate-500">
            Single-Tenant Architecture
          </span>
        </div>
      </section>

      {/* ============================================================ */}
      {/* RIGHT STAGE: The Biometric-Grade Auth Chamber (46% width)     */}
      {/* ============================================================ */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full max-w-[440px] rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300"
        >
          {/* Interactive Cursor Spotlight Glow (Light Mode Luxury Sheen) */}
          {isHovered && (
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300"
              style={{
                background: `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.05), transparent 75%)`,
              }}
            />
          )}

          {/* Top Return Link */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">
                ←
              </span>
              <span>Back to home</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6 space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signup" ? "Create Your Account" : "Welcome to Command"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {mode === "signup"
                ? "Initialize your personal opportunity intelligence platform."
                : "Authenticate to access your private job search operations."}
            </p>
          </div>

          {/* Mode Switcher Tabs (Segmented Control in Light Mode) */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200/70 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setConfirmPassword("");
                setShowConfirmPassword(false);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-slate-950 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setConfirmPassword("");
                setShowConfirmPassword(false);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-slate-950 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Primary Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-slate-700"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Victor Chidera"
                    className="h-11 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:border-slate-400 pl-10 pr-4 text-sm rounded-xl transition-all shadow-2xs"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-slate-700"
              >
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
                  className="h-11 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:border-slate-400 pl-10 pr-4 text-sm rounded-xl transition-all shadow-2xs"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password Field with Show/Hide Eye Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-700"
                >
                  Password
                </Label>
                {mode === "signin" && (
                  <Link
                    to="/forgot-password"
                    className="text-[0.7rem] font-medium text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  className="h-11 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:border-slate-400 pl-10 pr-11 text-sm rounded-xl transition-all shadow-2xs"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field with Show/Hide Eye Toggle (Signup only) */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs font-medium text-slate-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    className="h-11 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:border-slate-400 pl-10 pr-11 text-sm rounded-xl transition-all shadow-2xs"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 shadow-2xs"
                role="alert"
              >
                <span className="font-semibold text-rose-800">Notice:</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting !== null}
              className="h-11 w-full rounded-xl bg-slate-950 text-white font-semibold hover:bg-slate-800 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
            >
              {submitting === "email" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {mode === "signup" ? "Creating Account…" : "Authenticating…"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {mode === "signup"
                    ? "Deploy Account"
                    : "Enter Command Center"}
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 font-mono text-[0.65rem] tracking-wider uppercase text-slate-400">
              or continue with
            </span>
          </div>

          {/* Google SSO Button */}
          <Button
            type="button"
            variant="outline"
            disabled={submitting !== null}
            onClick={() => void handleGoogleSignIn()}
            className="h-11 w-full rounded-xl bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-medium transition-all flex items-center justify-center gap-3 cursor-pointer shadow-2xs hover:border-slate-300"
          >
            <GoogleIcon className="size-4 shrink-0" />
            <span>
              {submitting === "google"
                ? "Connecting to Google…"
                : "Continue with Google"}
            </span>
          </Button>

          {/* Security Guarantee Note */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-[0.68rem] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3 text-emerald-600" />
              <span>
                Encrypted Authentication · Firebase Security Rules Protected
              </span>
            </p>
          </div>
        </div>

        {/* Mobile Footer Meta (Positioned at the true end of the page on mobile) */}
        <div className="lg:hidden mt-8 w-full max-w-[440px] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-center sm:text-left">
          <span>© {currentYear} Victor Job OS. All rights reserved.</span>
          <span className="font-mono text-[0.7rem] text-slate-500">
            Single-Tenant Architecture
          </span>
        </div>
      </section>
    </main>
  );
}
