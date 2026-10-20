import React, { useState, useEffect } from "react"
import {
  X,
  User,
  ShieldCheck,
  LogOut,
  Sparkles,
  Database,
  Key,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  ShieldAlert,
  Image,
  RefreshCw,
  Eye,
} from "lucide-react"
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  signUpUser,
  signInUser,
  signOutUser,
  fetchSuperadminStats,
  deletePhotoAsAdmin,
  type UserAccount,
  type SupabasePhotobooth,
} from "../services/supabase"

interface UserAccountModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: UserAccount | null
  onUserUpdated: (user: UserAccount | null) => void
  cloudCreationsCount?: number
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  cloudCreationsCount = 0,
}) => {
  // Tabs: "auth" (login/register/profile) | "admin" (superadmin portal) | "config" (keys)
  const [activeTab, setActiveTab] = useState<"auth" | "admin" | "config">("auth")
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  // Form Inputs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Supabase Config Inputs
  const [customUrl, setCustomUrl] = useState("")
  const [customKey, setCustomKey] = useState("")

  // Superadmin Data
  const [adminStats, setAdminStats] = useState<{
    totalPhotos: number
    totalUsers: number
    photos: SupabasePhotobooth[]
  } | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [previewingPhoto, setPreviewingPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && currentUser?.role === "superadmin" && activeTab === "admin") {
      loadAdminDashboard()
    }
  }, [isOpen, currentUser, activeTab])

  if (!isOpen) return null

  const isConfigured = isSupabaseConfigured()
  const activeCreds = getSupabaseCredentials()

  const loadAdminDashboard = async () => {
    setAdminLoading(true)
    const stats = await fetchSuperadminStats()
    setAdminStats(stats)
    setAdminLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setLoading(true)

    const result = await signInUser(email, password)
    setLoading(false)

    if (result.success && result.user) {
      onUserUpdated(result.user)
      setSuccessMessage(
        result.isSuperadmin
          ? "Welcome, Superadmin! Access granted to Admin Portal."
          : `Signed in successfully as ${result.user.email}!`,
      )
      if (result.isSuperadmin) {
        setActiveTab("admin")
      }
    } else {
      setErrorMessage(result.error || "Invalid email or password.")
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setLoading(true)

    const result = await signUpUser(email, password)
    setLoading(false)

    if (result.success && result.user) {
      onUserUpdated(result.user)
      setSuccessMessage("Account created successfully! Your creations are now private and synced.")
    } else {
      setErrorMessage(result.error || "Failed to create account.")
    }
  }

  const handleSignOut = async () => {
    await signOutUser()
    onUserUpdated(null)
    setActiveTab("auth")
    setSuccessMessage("Signed out successfully.")
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this photo as Superadmin?")) {
      return
    }
    const res = await deletePhotoAsAdmin(photoId)
    if (res.success) {
      setAdminStats((prev) =>
        prev
          ? {
              ...prev,
              totalPhotos: Math.max(0, prev.totalPhotos - 1),
              photos: prev.photos.filter((p) => p.id !== photoId),
            }
          : null,
      )
    } else {
      alert("Could not delete photo: " + res.error)
    }
  }

  const handleSaveCustomKeys = () => {
    setErrorMessage(null)
    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMessage("Please enter both Supabase URL and Anon Key.")
      return
    }
    saveCustomSupabaseCredentials({
      supabaseUrl: customUrl.trim(),
      supabaseAnonKey: customKey.trim(),
    })
    window.location.reload()
  }

  const handleFillSuperadminQuick = () => {
    setEmail("admin@littlemoments.com")
    setPassword("Admin@LittleMoments2026!")
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#faf8f2] text-stone-900 rounded-3xl border-2 border-stone-900 shadow-[6px_6px_0_#1c1917] p-6 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-sm">
            <Database size={24} />
          </div>
          <div>
            <h2 className="font-gochi text-2xl text-stone-900 leading-none flex items-center gap-2">
              Supabase Account & Cloud <Sparkles size={16} className="text-emerald-600" />
            </h2>
            <p className="text-xs font-mono text-stone-500 mt-1">
              Private Cloud Storage · QR Transfer · Admin Portal
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-xl mb-5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("auth")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all ${
              activeTab === "auth"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {currentUser ? "My Account" : "Sign In / Register"}
          </button>

          {currentUser?.role === "superadmin" && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin")
                loadAdminDashboard()
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-amber-400 text-stone-950 shadow-sm"
                  : "text-amber-800 hover:text-amber-950"
              }`}
            >
              <ShieldAlert size={13} />
              <span>Admin Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`py-1.5 px-3 rounded-lg transition-all ${
              activeTab === "config"
                ? "bg-white text-stone-900 shadow-sm font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
            title="Database Connection Keys"
          >
            <Key size={14} />
          </button>
        </div>

        {/* Global Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-start gap-2">
            <Check size={15} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: AUTH (Profile or Login/Register) */}
        {activeTab === "auth" && (
          <div>
            {currentUser ? (
              /* Signed In Profile View */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full border-2 border-stone-900 flex items-center justify-center shadow ${
                        currentUser.role === "superadmin"
                          ? "bg-amber-400 text-stone-950 font-bold"
                          : "bg-emerald-100 text-emerald-900 font-bold"
                      }`}
                    >
                      {currentUser.role === "superadmin" ? <ShieldAlert size={22} /> : <User size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-stone-900 truncate">
                          {currentUser.email}
                        </span>
                        {currentUser.role === "superadmin" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-300 text-stone-900 font-bold border border-amber-400 shadow-sm flex items-center gap-1">
                            <ShieldAlert size={10} /> Superadmin
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                            <UserCheck size={11} /> Verified User
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                        User ID: {currentUser.id.slice(0, 14)}...
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-mono">
                    <span>Private Cloud Photobooths:</span>
                    <span className="font-bold text-stone-900">{cloudCreationsCount} strips</span>
                  </div>
                </div>

                {currentUser.role === "superadmin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("admin")
                      loadAdminDashboard()
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-400 text-stone-950 border-2 border-stone-900 shadow-[3px_3px_0_#1c1917] hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={16} /> Open Superadmin Portal & Manage Database
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-2 font-mono"
                >
                  <LogOut size={14} /> Sign Out of Account
                </button>
              </div>
            ) : (
              /* Signed Out: Login & Register Form */
              <div className="space-y-4">
                {/* Switch between Sign In / Sign Up */}
                <div className="flex border-b border-stone-300 pb-2 gap-4 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin")
                      setErrorMessage(null)
                    }}
                    className={`pb-1 font-bold transition-all ${
                      authMode === "signin"
                        ? "border-b-2 border-stone-900 text-stone-900"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup")
                      setErrorMessage(null)
                    }}
                    className={`pb-1 font-bold transition-all ${
                      authMode === "signup"
                        ? "border-b-2 border-stone-900 text-stone-900"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Create Free Account
                  </button>
                </div>

                <form onSubmit={authMode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-stone-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-3 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42131b]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-stone-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-3 text-stone-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42131b]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#42131b] text-white border-2 border-stone-900 shadow-[3px_3px_0_#1c1917] hover:bg-[#5a1b26] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {authMode === "signin" ? "Signing In..." : "Creating Account..."}
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        {authMode === "signin" ? "Sign In to Your Account" : "Register & Start Syncing"}
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Superadmin Helper */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold">Superadmin Account</span>
                      <p className="text-[10px] text-amber-700">admin@littlemoments.com</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillSuperadminQuick}
                    className="py-1 px-2.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition-colors"
                  >
                    Auto-Fill Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUPERADMIN PORTAL */}
        {activeTab === "admin" && currentUser?.role === "superadmin" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5 font-mono">
                  <ShieldAlert size={16} className="text-amber-600" />
                  <span>Master Administrative Portal</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-mono">
                  Full Database Inspection & Content Moderation
                </p>
              </div>
              <button
                type="button"
                onClick={loadAdminDashboard}
                disabled={adminLoading}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono flex items-center gap-1"
                title="Refresh stats"
              >
                <RefreshCw size={13} className={adminLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
                <span className="text-[10px] text-stone-500 block">Total Photos</span>
                <span className="text-xl font-bold text-emerald-800">
                  {adminStats ? adminStats.totalPhotos : "..."}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
                <span className="text-[10px] text-stone-500 block">Total Users</span>
                <span className="text-xl font-bold text-stone-900">
                  {adminStats ? adminStats.totalUsers : "..."}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
                <span className="text-[10px] text-stone-500 block">DB Health</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            {/* Photo List / Moderation Table */}
            <div>
              <h4 className="text-xs font-mono font-bold text-stone-700 mb-2">
                Recent System Photo Strips (All Users)
              </h4>

              {adminLoading ? (
                <div className="py-8 text-center text-xs font-mono text-stone-500 flex flex-col items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-stone-400 mb-2" />
                  Loading database records...
                </div>
              ) : adminStats?.photos.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-stone-400 bg-white rounded-xl border border-stone-200">
                  No photos created yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                  {adminStats?.photos.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-sm flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setPreviewingPhoto(p.imageUrl)}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate max-w-[170px]">{p.title}</p>
                          <p className="text-[10px] text-stone-400 truncate">
                            {p.userEmail || `User: ${p.userId.slice(0, 8)}...`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewingPhoto(p.imageUrl)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                          title="Preview full image"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(p.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                          title="Delete prohibited/abusive photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Lightbox Popup */}
            {previewingPhoto && (
              <div
                className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setPreviewingPhoto(null)}
              >
                <div className="relative max-h-[85vh] max-w-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewingPhoto(null)}
                    className="absolute -top-3 -right-3 bg-white text-stone-900 p-1.5 rounded-full shadow-lg"
                  >
                    <X size={16} />
                  </button>
                  <img
                    src={previewingPhoto}
                    alt="Preview"
                    className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain border-2 border-stone-800"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONFIGURATION (Keys) */}
        {activeTab === "config" && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <span className="text-stone-500 block text-[10px] uppercase">Active Supabase Endpoint</span>
              <span className="font-bold text-stone-900 break-all">
                {activeCreds?.supabaseUrl || "Not Connected"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Change Project URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Change Anon Public Key
                </label>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCustomKeys}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                >
                  Save & Apply Keys
                </button>
                {localStorage.getItem("lm_custom_supabase_config") && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCustomSupabaseCredentials()
                      window.location.reload()
                    }}
                    className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center justify-between">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-stone-800 flex items-center gap-1"
              >
                <ExternalLink size={12} className="text-stone-400" />
                Open Supabase Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
