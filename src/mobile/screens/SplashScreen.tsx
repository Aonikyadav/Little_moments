import React, { useEffect } from "react"

interface SplashScreenProps {
  onComplete: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 1800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#101014] text-white p-6 select-none cursor-pointer animate-fadeIn"
      title="Tap to continue"
    >
      <div className="flex flex-col items-center justify-center max-w-xs w-full text-center">
        {/* Dark Rounded Logo Card matching exact uploaded reference Image 1 */}
        <div className="w-48 h-48 rounded-[36px] bg-[#16161a] border-2 border-stone-800 shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(56,189,248,0.25)] flex items-center justify-center p-3.5 relative mb-6 animate-pulse">
          <img
            src="/lm-logo.svg"
            alt="Little Moments Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(56,189,248,0.45)]"
          />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className="font-sans font-black text-2xl tracking-tight text-white">
            Little Moments
          </span>
          <span className="text-amber-400 text-lg">✦</span>
        </div>
        <p className="text-[11px] font-mono tracking-widest text-stone-400 uppercase font-bold">
          Creative Photo Studio
        </p>

        {/* Ambient progress line */}
        <div className="w-36 h-1 bg-stone-800/80 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 via-amber-300 to-sky-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
