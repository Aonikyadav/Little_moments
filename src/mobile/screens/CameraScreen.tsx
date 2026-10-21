import React, { useState, useRef, useEffect } from "react"
import {
  SwitchCamera,
  Upload,
  Clock,
  Sparkles,
  Zap,
  ZapOff,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Film,
} from "lucide-react"
import type { MobileTab } from "../types"

interface CameraScreenProps {
  onNavigate: (tab: MobileTab) => void
  onPhotosCaptured: (photos: string[]) => void
}

// Simple synthesizer tone for authentic photobooth countdown ticks
const playAudioTone = (freq = 880, duration = 0.08) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // audio context blocked or unavailable
  }
}

const sampleFallbackPhotos = [
  "/images/romantic_love_kisspose_aesthetic/031.jpg",
  "/images/romantic_love_kisspose_aesthetic/032.jpg",
  "/images/romantic_love_kisspose_aesthetic/033.jpg",
  "/images/romantic_love_kisspose_aesthetic/034.jpg",
]

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onNavigate,
  onPhotosCaptured,
}) => {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [timer, setTimer] = useState<number>(0) // 0 = off, 3, 5
  const [flash, setFlash] = useState<boolean>(true)
  const [flashBurst, setFlashBurst] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const countdownIntervalRef = useRef<any>(null)

  // Start Camera Stream
  useEffect(() => {
    let active = true

    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setCameraError(null)
      } catch (err) {
        console.warn("[Camera] Live stream error:", err)
        setCameraError("Camera access unavailable. You can upload photos below.")
      }
    }

    startCamera()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [facingMode])

  // Capture Single Photo Frame
  const takeSnapshot = () => {
    let photoUrl = ""

    if (videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
          if (facingMode === "user") {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
          }
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
          photoUrl = canvas.toDataURL("image/jpeg", 0.92)
        }
      } catch (err) {
        console.warn("[Snapshot] Canvas capture exception:", err)
      }
    }

    // High quality fallback if webcam feed is empty or running on virtual device
    if (!photoUrl) {
      const fallbackIdx = capturedPhotos.length % sampleFallbackPhotos.length
      photoUrl = sampleFallbackPhotos[fallbackIdx]
    }

    setCapturedPhotos((prev) => {
      const next = [...prev, photoUrl]
      if (next.length >= 4) {
        onPhotosCaptured(next)
      }
      return next
    })
  }

  // Handle Shutter Press with Reliable Countdown Timer
  const handleShutter = () => {
    if (isCapturing) return

    if (timer > 0) {
      setIsCapturing(true)
      let count = timer
      setCountdown(count)
      playAudioTone(880, 0.1)

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }

      countdownIntervalRef.current = setInterval(() => {
        count -= 1
        if (count > 0) {
          setCountdown(count)
          playAudioTone(880, 0.1)
        } else {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
          setCountdown(0)
          playAudioTone(1760, 0.25)

          if (flash) {
            setFlashBurst(true)
            setTimeout(() => setFlashBurst(false), 250)
          }

          setTimeout(() => {
            setCountdown(null)
            takeSnapshot()
            setIsCapturing(false)
          }, 300)
        }
      }, 1000)
    } else {
      if (flash) {
        setFlashBurst(true)
        setTimeout(() => setFlashBurst(false), 250)
      }
      playAudioTone(1760, 0.2)
      takeSnapshot()
    }
  }

  // Handle Gallery Uploads
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          setCapturedPhotos((prev) => {
            const next = [...prev, result]
            if (next.length >= 4) {
              onPhotosCaptured(next)
            }
            return next
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFinishToStudio = () => {
    if (capturedPhotos.length > 0) {
      onPhotosCaptured(capturedPhotos)
    }
    onNavigate("studio")
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between pb-6 relative select-none">
      {/* Simulated Screen Flash Burst */}
      {flashBurst && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Top Controls Bar with Back Arrow to Home */}
      <div className="flex items-center justify-between px-3 py-2.5 z-20 bg-stone-900/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Back button to leave camera */}
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="w-8 h-8 rounded-full bg-stone-800 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-xs"
            title="Leave Camera & Return Home"
            aria-label="Back to Home"
          >
            <ArrowLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => setFlash(!flash)}
            className={`p-1.5 rounded-full border border-white/20 active:scale-95 transition-all ${
              flash ? "bg-amber-400 text-stone-950 font-bold" : "bg-stone-800 text-white"
            }`}
            title="Toggle Flash"
          >
            {flash ? <Zap size={15} /> : <ZapOff size={15} />}
          </button>

          <span className="text-xs font-mono font-bold tracking-tight text-stone-200">
            {capturedPhotos.length}/4 Cuts
          </span>
        </div>

        <div className="flex items-center gap-2">
          {capturedPhotos.length > 0 && (
            <button
              type="button"
              onClick={handleFinishToStudio}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-stone-950 rounded-full font-mono font-bold text-xs active:scale-95 transition-transform shadow-xs"
            >
              <span>Studio</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder Frame */}
      <div className="relative flex-1 flex items-center justify-center p-3 overflow-hidden">
        <div className="w-full max-w-sm aspect-[3/4] bg-stone-900 rounded-3xl border-2 border-stone-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center text-xs font-mono text-stone-400">
              <Film size={36} className="mx-auto mb-2 text-stone-500" />
              <p className="mb-3">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-400 text-stone-950 font-bold rounded-xl active:scale-95 shadow-md"
              >
                Upload from Gallery
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />
          )}

          {/* Active Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-30">
              <div className="w-24 h-24 rounded-full bg-amber-400 text-stone-950 border-4 border-stone-900 flex items-center justify-center shadow-2xl animate-bounce">
                <span className="text-5xl font-black font-sans">
                  {countdown === 0 ? "📸" : countdown}
                </span>
              </div>
              <span className="text-amber-300 font-mono font-bold text-xs mt-3 tracking-widest uppercase">
                {countdown === 0 ? "SMILE!" : `Capturing in ${countdown}s...`}
              </span>
            </div>
          )}

          {/* Viewfinder crosshairs */}
          <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-2xl flex items-center justify-center">
            <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400 absolute top-2 left-2" />
            <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400 absolute top-2 right-2" />
            <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400 absolute bottom-2 left-2" />
            <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400 absolute bottom-2 right-2" />
          </div>
        </div>
      </div>

      {/* Captured Thumbnails Strip preview */}
      {capturedPhotos.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900/80 z-20">
          {capturedPhotos.map((img, i) => (
            <div
              key={i}
              className="w-12 h-14 rounded-lg bg-stone-800 border-2 border-amber-400 overflow-hidden relative shadow-xs"
            >
              <img src={img} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 bg-stone-900 text-[8px] font-mono px-1 text-white">
                #{i + 1}
              </span>
            </div>
          ))}
          {capturedPhotos.length < 4 && (
            <div className="w-12 h-14 rounded-lg border-2 border-dashed border-stone-600 flex items-center justify-center text-[10px] font-mono text-stone-500">
              +{4 - capturedPhotos.length}
            </div>
          )}
        </div>
      )}

      {/* Bottom Camera Action Rail - Fully Unobstructed */}
      <div className="px-6 pt-3 pb-3 bg-stone-900 border-t border-white/10 flex flex-col gap-3 z-30 shadow-2xl">
        {/* Timer selector pills: [OFF] [3s] [5s] */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-mono text-stone-400 uppercase font-bold mr-1 flex items-center gap-1">
            <Clock size={12} />
            <span>Timer:</span>
          </span>
          {[0, 3, 5].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimer(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all active:scale-95 ${
                timer === t
                  ? "bg-amber-400 text-stone-950 shadow-xs"
                  : "bg-stone-800 text-stone-300 hover:text-white border border-stone-700"
              }`}
            >
              {t === 0 ? "OFF" : `${t}s`}
            </button>
          ))}
        </div>

        {/* Shutter Rail: [Switch Camera] [Big Arcade Shutter] [Upload Image] */}
        <div className="flex items-center justify-around pb-1">
          {/* Switch Camera Button from sketch */}
          <button
            type="button"
            onClick={() =>
              setFacingMode(facingMode === "user" ? "environment" : "user")
            }
            className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex flex-col items-center justify-center text-white active:scale-90 transition-transform shadow-md"
            title="Switch Camera"
          >
            <SwitchCamera size={18} />
            <span className="text-[8px] font-mono mt-0.5">Flip</span>
          </button>

          {/* Central Arcade Shutter Button from sketch */}
          <button
            type="button"
            onClick={handleShutter}
            disabled={isCapturing}
            className="w-20 h-20 rounded-full bg-stone-100 border-4 border-amber-400 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.5),3px_3px_0_#000] active:scale-95 transition-all disabled:opacity-50"
            aria-label="Capture Shutter"
          >
            <div className="w-16 h-16 rounded-full bg-stone-900 border-2 border-stone-800 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-rose-600 animate-pulse" />
            </div>
          </button>

          {/* Upload Image Button from sketch */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex flex-col items-center justify-center text-white active:scale-90 transition-transform shadow-md"
            title="Upload Photo"
          >
            <Upload size={18} />
            <span className="text-[8px] font-mono mt-0.5">Upload</span>
          </button>
        </div>
      </div>

      {/* Hidden file upload input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}

export default CameraScreen
