import React, { useState, useRef, useEffect } from "react"
import {
  SwitchCamera,
  Upload,
  Clock,
  Sparkles,
  Zap,
  ZapOff,
  ArrowRight,
  RotateCcw,
  Check,
  Film,
} from "lucide-react"
import type { MobileTab } from "../types"

interface CameraScreenProps {
  onNavigate: (tab: MobileTab) => void
  onPhotosCaptured: (photos: string[]) => void
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onNavigate,
  onPhotosCaptured,
}) => {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [timer, setTimer] = useState<number>(0) // 0 = off, 3, 5
  const [flash, setFlash] = useState<boolean>(true)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
      } catch (err: any) {
        setCameraError("Camera access unavailable. You can upload photos below.")
      }
    }

    startCamera()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  // Capture Single Photo Frame
  const takeSnapshot = () => {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9)

    setCapturedPhotos((prev) => {
      const next = [...prev, dataUrl]
      if (next.length >= 4) {
        onPhotosCaptured(next)
      }
      return next
    })
  }

  // Handle Shutter Press with Optional Countdown
  const handleShutter = () => {
    if (isCapturing) return
    if (timer > 0) {
      setIsCapturing(true)
      let count = timer
      setCountdown(count)
      const interval = setInterval(() => {
        count -= 1
        if (count > 0) {
          setCountdown(count)
        } else {
          clearInterval(interval)
          setCountdown(null)
          takeSnapshot()
          setIsCapturing(false)
        }
      }, 1000)
    } else {
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
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between pb-24 relative select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-4 py-3 z-20 bg-stone-900/60 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFlash(!flash)}
            className={`p-2 rounded-full border border-white/20 active:scale-95 transition-all ${
              flash ? "bg-amber-400 text-stone-950 font-bold" : "bg-stone-800 text-white"
            }`}
            title="Toggle Flash"
          >
            {flash ? <Zap size={16} /> : <ZapOff size={16} />}
          </button>
          <span className="text-xs font-mono font-bold tracking-tight">
            {capturedPhotos.length}/4 Cuts Captured
          </span>
        </div>

        {capturedPhotos.length > 0 && (
          <button
            type="button"
            onClick={handleFinishToStudio}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-stone-950 rounded-full font-mono font-bold text-xs active:scale-95 transition-transform"
          >
            <span>Edit in Studio</span>
            <ArrowRight size={13} />
          </button>
        )}
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
                className="px-4 py-2 bg-amber-400 text-stone-950 font-bold rounded-xl active:scale-95"
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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-30 animate-pulse">
              <span className="text-8xl font-black font-sans text-amber-300 drop-shadow-2xl">
                {countdown}
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

      {/* Bottom Camera Action Rail matching blueprint sketch */}
      <div className="px-6 py-4 bg-stone-900 border-t border-white/10 flex flex-col gap-3 z-20">
        {/* Timer selector pills: [OFF] [3s] [5s] */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-mono text-stone-400 uppercase font-bold mr-1">
            Timer:
          </span>
          {[0, 3, 5].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimer(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                timer === t
                  ? "bg-amber-400 text-stone-950 shadow-xs"
                  : "bg-stone-800 text-stone-400 hover:text-white"
              }`}
            >
              {t === 0 ? "OFF" : `${t}s`}
            </button>
          ))}
        </div>

        {/* Shutter Rail: [Switch Camera] [Big Arcade Shutter] [Upload Image] */}
        <div className="flex items-center justify-around">
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
