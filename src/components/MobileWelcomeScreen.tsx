import React, { useState } from "react"
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react"
import {
  signInUser,
  signUpUser,
  isSupabaseConfigured,
  type UserAccount,
} from "../services/supabase"

interface MobileWelcomeScreenProps {
  onEnterApp: () => void
  onUserLoggedIn?: (user: UserAccount) => void
}

export const MobileWelcomeScreen: React.FC<MobileWelcomeScreenProps> = ({
  onEnterApp,
  onUserLoggedIn,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError("Please fill in both email and password")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === "signin") {
        const res = await signInUser(email, password)
        if (res.success && res.user) {
          setSuccess("Welcome back!")
          if (onUserLoggedIn) onUserLoggedIn(res.user)
          localStorage.setItem("lm_auth_completed", "true")
          setTimeout(() => onEnterApp(), 600)
        } else {
          setError(res.error || "Failed to sign in. Please check your credentials.")
        }
      } else {
        const res = await signUpUser(email, password)
        if (res.success) {
          if (res.user) {
            setSuccess("Account created successfully!")
            if (onUserLoggedIn) onUserLoggedIn(res.user)
            localStorage.setItem("lm_auth_completed", "true")
            setTimeout(() => onEnterApp(), 800)
          } else {
            setSuccess("Account created! You can now sign in.")
            setMode("signin")
          }
        } else {
          setError(res.error || "Failed to create account. Please try again.")
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleContinueAsGuest = () => {
    localStorage.setItem("lm_auth_completed", "true")
    onEnterApp()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#f8f6f0] text-stone-900 overflow-y-auto px-6 py-8 select-none">
      {/* Paper texture overlay */}
      <div className="paper-texture" aria-hidden="true" />

      {/* Top Brand Logo Section */}
      <div className="flex flex-col items-center text-center mt-2">
        <div className="relative group mb-4">
          {/* Exact Logo matching user attachment: Dark card with cursive LM and radiant star */}
          <div className="w-24 h-24 rounded-2xl bg-[#141418] border-2 border-stone-800 shadow-[0_12px_28px_rgba(0,0,0,0.35),4px_4px_0_#1f1d1a] flex items-center justify-center p-2 overflow-hidden">
            <img
              src="/lm-logo.svg"
              alt="Little Moments Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.35)]"
            />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 border border-stone-900 flex items-center justify-center text-stone-950 font-black text-xs shadow-xs">
            ✦
          </div>
        </div>

        <h1 className="text-2xl font-black font-sans tracking-tight text-stone-900 flex items-center gap-1.5 justify-center">
          <span>Little Moments</span>
        </h1>
        <p className="text-xs font-mono text-stone-600 mt-0.5 tracking-wide uppercase font-bold">
          Analog Photobooth & Creative Studio
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm mx-auto my-4 bg-white rounded-2xl border-2 border-stone-900 p-5 shadow-[5px_5px_0_#1f1d1a]">
        {/* Sign In vs Register Toggle */}
        <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-300 mb-4">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === "signin"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => {
              setMode("signin")
              setError(null)
              setSuccess(null)
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => {
              setMode("signup")
              setError(null)
              setSuccess(null)
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-mono flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-mono flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                autoCapitalize="none"
                autoComplete="email"
                required
              />
              <Mail
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-stone-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-8 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
              />
              <Lock
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-[2px_2px_0_#1f1d1a] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Studio" : "Create My Account"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold text-stone-400 bg-white px-2">
            <span>or</span>
          </div>
        </div>

        {/* 1-Tap Guest Access */}
        <button
          type="button"
          onClick={handleContinueAsGuest}
          className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-stone-950 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border border-stone-900 shadow-[2px_2px_0_#1f1d1a] transition-all"
        >
          <Camera size={15} />
          <span>Continue as Guest</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] font-mono text-stone-500 pb-2">
        <span>Little Moments Mobile Edition · All data stored securely</span>
      </div>
    </div>
  )
}
