import React, { useState } from "react"
import {
  Volume2,
  VolumeX,
  Clock,
  SwitchCamera,
  Zap,
  Sparkles,
  Download,
  ShieldCheck,
  Smartphone,
  Info,
  Database,
  Check,
} from "lucide-react"
import type { MobileSettingsState } from "../types"

interface SettingsScreenProps {
  onOpenAccountModal?: () => void
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenAccountModal,
}) => {
  const [settings, setSettings] = useState<MobileSettingsState>(() => {
    try {
      const stored = localStorage.getItem("little-mobile-settings")
      return stored
        ? JSON.parse(stored)
        : {
            soundEffects: true,
            countdownBeep: true,
            mirrorFrontCamera: true,
            flashSimulation: true,
            highResExport: true,
            autoSaveToGallery: false,
            hapticFeedback: true,
            analogPaperTexture: true,
          }
    } catch {
      return {
        soundEffects: true,
        countdownBeep: true,
        mirrorFrontCamera: true,
        flashSimulation: true,
        highResExport: true,
        autoSaveToGallery: false,
        hapticFeedback: true,
        analogPaperTexture: true,
      }
    }
  })

  const updateSetting = (key: keyof MobileSettingsState) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem("little-mobile-settings", JSON.stringify(next))
      } catch {
        // safe ignore
      }
      return next
    })
  }

  const toggleItems = [
    {
      key: "soundEffects" as keyof MobileSettingsState,
      title: "Camera Shutter Sound",
      subtitle: "Play vintage analog camera shutter on photo capture",
      icon: Volume2,
    },
    {
      key: "countdownBeep" as keyof MobileSettingsState,
      title: "Countdown Beep Tones",
      subtitle: "Audio rhythm tick during 3s and 5s timer countdowns",
      icon: Clock,
    },
    {
      key: "mirrorFrontCamera" as keyof MobileSettingsState,
      title: "Mirror Front Camera",
      subtitle: "Reflect self-portraits naturally as seen in a physical mirror",
      icon: SwitchCamera,
    },
    {
      key: "flashSimulation" as keyof MobileSettingsState,
      title: "Simulated Flash Burst",
      subtitle: "Bright screen burst animation when taking snapshots",
      icon: Zap,
    },
    {
      key: "highResExport" as keyof MobileSettingsState,
      title: "Ultra High-Res Export (300 DPI)",
      subtitle: "Render photobooth strips in maximum print quality",
      icon: Download,
    },
    {
      key: "autoSaveToGallery" as keyof MobileSettingsState,
      title: "Auto-Save to Photo Library",
      subtitle: "Automatically save finished creations to phone gallery",
      icon: Smartphone,
    },
    {
      key: "analogPaperTexture" as keyof MobileSettingsState,
      title: "Real Paper & Ink Grain",
      subtitle: "Subtle tactile parchment texture overlaid on strips",
      icon: Sparkles,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-4 pt-3 select-none">
      {/* Header matching sketch */}
      <header className="pb-2 mb-4 border-b-2 border-stone-900/10">
        <div className="flex items-center gap-1.5 font-caveat text-xl text-stone-700 font-bold">
          <span>Settings</span>
          <span className="text-amber-500">✦</span>
        </div>
        <div className="text-[10px] font-mono text-stone-500">
          Configure booth behavior, sounds, and export
        </div>
      </header>

      {/* Cloud Account Card */}
      <div className="bg-white rounded-2xl border-2 border-stone-900 p-3.5 shadow-[3px_3px_0_#1f1d1a] mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
            <Database size={18} />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-stone-900">
              Cloud Database & Storage
            </div>
            <div className="text-[10px] font-mono text-stone-500">
              Sync strips across devices with Supabase
            </div>
          </div>
        </div>
        {onOpenAccountModal && (
          <button
            type="button"
            onClick={onOpenAccountModal}
            className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-mono font-bold active:scale-95 transition-all shadow-xs"
          >
            Manage
          </button>
        )}
      </div>

      {/* Toggles list matching sketch (Text [toggle] ...) */}
      <div className="bg-white rounded-2xl border-2 border-stone-900 divide-y divide-stone-100 shadow-[4px_4px_0_#1f1d1a] overflow-hidden mb-5">
        {toggleItems.map((item) => {
          const Icon = item.icon
          const isEnabled = settings[item.key]
          return (
            <div
              key={item.key}
              onClick={() => updateSetting(item.key)}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3 pr-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isEnabled
                      ? "bg-amber-100 border-amber-300 text-amber-900"
                      : "bg-stone-100 border-stone-200 text-stone-400"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-stone-900">
                    {item.title}
                  </div>
                  <div className="text-[10px] font-mono text-stone-500 leading-tight mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {/* iOS / Material Style Tactile Toggle Switch matching sketch */}
              <button
                type="button"
                className={`w-12 h-6.5 rounded-full p-0.5 transition-colors relative shrink-0 border ${
                  isEnabled
                    ? "bg-stone-900 border-stone-900"
                    : "bg-stone-200 border-stone-300"
                }`}
                aria-pressed={isEnabled}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs flex items-center justify-center ${
                    isEnabled ? "translate-x-5.5 bg-amber-300" : "translate-x-0"
                  }`}
                >
                  {isEnabled && <Check size={10} className="text-stone-950 font-bold" />}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* About Box */}
      <div className="p-4 bg-[#faf8f2] rounded-2xl border border-stone-300 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#141418] border border-stone-800 p-1 mx-auto mb-2 flex items-center justify-center shadow-xs">
          <img src="/lm-logo.svg" alt="LM" className="w-full h-full object-contain" />
        </div>
        <div className="text-xs font-sans font-black text-stone-900">Little Moments</div>
        <div className="text-[10px] font-mono text-stone-500 mt-0.5">
          Mobile Edition v3.0 · Built with Analog Precision
        </div>
      </div>
    </div>
  )
}
