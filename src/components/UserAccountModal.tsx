import React, { useState } from "react"
import {
  X,
  User,
  Sparkles,
  Database,
  Key,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  Layers,
  Server,
} from "lucide-react"
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  getOrCreateUserId,
  type SupabaseCredentials,
} from "../services/supabase"
import {
  isFirebaseConfigured,
  getFirebaseCredentials,
} from "../services/firebase"

interface UserAccountModalProps {
  isOpen: boolean
  onClose: () => void
  user?: any
  onUserUpdated?: (user: any) => void
  cloudCreationsCount?: number
}

const SUPABASE_SQL_SCHEMA = `-- 1. Create the photos table
create table if not exists photos (
  id text primary key,
  user_id text,
  image_url text not null,
  title text,
  template_id text,
  created_at timestamp with time zone default now()
);

-- 2. Enable public read and insert
alter table photos enable row level security;

create policy "Public photos can be read by anyone"
  on photos for select using (true);

create policy "Anyone can insert photos"
  on photos for insert with check (true);
`

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  cloudCreationsCount = 0,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showConfigEditor, setShowConfigEditor] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  if (!isOpen) return null

  const isSupabaseActive = isSupabaseConfigured()
  const activeSupabaseCreds = getSupabaseCredentials()
  const isFirebaseActive = isFirebaseConfigured()
  const activeUserId = getOrCreateUserId()

  const handleSaveSupabase = () => {
    setErrorMessage(null)
    const url = supabaseUrl.trim()
    const key = supabaseAnonKey.trim()

    if (!url || !key) {
      setErrorMessage("Please enter both your Supabase Project URL and Anon Public Key.")
      return
    }

    if (!url.startsWith("http")) {
      setErrorMessage("Project URL must start with https:// (e.g. https://xyz.supabase.co)")
      return
    }

    saveCustomSupabaseCredentials({
      supabaseUrl: url,
      supabaseAnonKey: key,
    })

    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setShowConfigEditor(false)
      window.location.reload()
    }, 1200)
  }

  const handleClearSupabase = () => {
    clearCustomSupabaseCredentials()
    window.location.reload()
  }

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#faf8f2] text-stone-900 rounded-3xl border-2 border-stone-900 shadow-[6px_6px_0_#1c1917] p-6 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-sm">
            <Database size={24} />
          </div>
          <div>
            <h2 className="font-gochi text-2xl text-stone-900 leading-none flex items-center gap-2">
              Cloud Database & Sync <Sparkles size={16} className="text-emerald-600" />
            </h2>
            <p className="text-xs font-mono text-stone-500 mt-1">
              Supabase PostgreSQL · Instant Mobile QR
            </p>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="mb-5 p-3 rounded-2xl border bg-white flex items-center justify-between text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseActive
                  ? "bg-emerald-500 animate-pulse"
                  : isFirebaseActive
                    ? "bg-amber-500"
                    : "bg-stone-400"
              }`}
            />
            <span className="font-bold text-stone-800">
              {isSupabaseActive
                ? "Supabase PostgreSQL Active"
                : isFirebaseActive
                  ? "Firebase Cloud Active"
                  : "Database Not Connected"}
            </span>
          </div>
          {isSupabaseActive && activeSupabaseCreds && (
            <span className="text-[10px] text-emerald-700 font-mono truncate max-w-[120px]">
              {activeSupabaseCreds.supabaseUrl.replace("https://", "")}
            </span>
          )}
        </div>

        {/* Creator Session Info */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 mb-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-50 border-2 border-stone-800 flex items-center justify-center text-emerald-800">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-stone-900 truncate">
                  Creator Session
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {isSupabaseActive ? "PostgreSQL Synced" : "Local Session"}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono truncate">
                Device ID: {activeUserId}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-mono">
            <span>Saved Creations:</span>
            <span className="font-bold text-stone-900">{cloudCreationsCount} strips</span>
          </div>
        </div>

        {/* Supabase Setup / Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Server size={14} className="text-emerald-700" />
              <span>Supabase Connection</span>
            </span>
            <button
              type="button"
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              className="text-[11px] font-mono text-emerald-700 hover:text-emerald-900 underline"
            >
              {showConfigEditor ? "Close" : isSupabaseActive ? "Change Keys" : "✦ Connect Now"}
            </button>
          </div>

          {showConfigEditor && (
            <div className="p-4 rounded-2xl bg-white border border-stone-300 space-y-3 shadow-inner">
              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 mb-1">
                  1. Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-stone-700 mb-1">
                  2. Supabase Anon Public Key
                </label>
                <input
                  type="text"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveSupabase}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  {saveSuccess ? (
                    <>
                      <Check size={14} className="text-emerald-300" /> Connected!
                    </>
                  ) : (
                    "Save & Connect Supabase"
                  )}
                </button>

                {localStorage.getItem("lm_custom_supabase_config") && (
                  <button
                    type="button"
                    onClick={handleClearSupabase}
                    className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* 1-Click SQL Setup Helper */}
              <div className="pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-stone-600 flex items-center gap-1">
                    <Layers size={12} /> SQL Table Schema
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-[10px] font-mono text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    {copiedSql ? (
                      <>
                        <Check size={11} className="text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> Copy SQL
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mb-2">
                  In Supabase ➔ click <strong>SQL Editor</strong> ➔ paste & click <strong>Run</strong>. Also create a Public Storage bucket named <strong>photos</strong>.
                </p>
              </div>
            </div>
          )}

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
            <span className="text-stone-400 text-[10px]">Free PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
