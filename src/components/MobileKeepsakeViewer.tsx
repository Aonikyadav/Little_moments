import React, { useEffect, useState } from "react"
import {
  Sparkles,
  Download,
  Share2,
  Check,
  Camera,
  Loader2,
  RefreshCw,
  Smartphone,
  ShieldCheck,
} from "lucide-react"
import {
  listenForP2PPhoto,
  savePhotoToCameraRoll,
} from "../utils/photoTransfer"

interface MobileKeepsakeViewerProps {
  exportId?: string | null
  imgUrl?: string | null
  peerId?: string | null
  localSavedPhoto?: string | null
}

export const MobileKeepsakeViewer: React.FC<MobileKeepsakeViewerProps> = ({
  exportId,
  imgUrl: initialImgUrl,
  peerId: initialPeerId,
  localSavedPhoto,
}) => {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [statusMessage, setStatusMessage] = useState<string>("Connecting to studio...")
  const [isP2pConnected, setIsP2pConnected] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  useEffect(() => {
    let cancelP2p: (() => void) | undefined
    let isMounted = true

    // 1. Direct Cloud Image URL from QR code (?img=...)
    if (initialImgUrl) {
      setStatusMessage("Loading your high-res photobooth strip...")
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        if (!isMounted) return
        setPhotoSrc(initialImgUrl)
        setLoading(false)
        setStatusMessage("Photo received via Cloud Relay ✓")
      }
      img.onerror = () => {
        if (!isMounted) return
        // If direct cloud image fails, fall through to P2P / session storage
        checkLocalAndP2p()
      }
      img.src = initialImgUrl
      return () => {
        isMounted = false
      }
    }

    checkLocalAndP2p()

    function checkLocalAndP2p() {
      // 2. Check local sessionStorage / saved creation (same device or cache)
      if (exportId && typeof sessionStorage !== "undefined") {
        const cached = sessionStorage.getItem(`lm_export_${exportId}`)
        if (cached) {
          setPhotoSrc(cached)
          setLoading(false)
          setStatusMessage("Loaded from studio cache ✓")
          return
        }
      }

      if (localSavedPhoto) {
        setPhotoSrc(localSavedPhoto)
        setLoading(false)
        setStatusMessage("Loaded from gallery ✓")
        return
      }

      // 3. WebRTC P2P Transfer from Desktop Host (?peer=lm-exportId or ?id=exportId)
      const targetPeer = initialPeerId || (exportId ? `lm-${exportId.replace(/[^a-zA-Z0-9_-]/g, "")}` : null)
      if (targetPeer) {
        setStatusMessage("Connecting directly to your screen (P2P)...")
        cancelP2p = listenForP2PPhoto(
          targetPeer,
          (receivedDataUrl) => {
            if (!isMounted) return
            setPhotoSrc(receivedDataUrl)
            setLoading(false)
            setIsP2pConnected(true)
            setStatusMessage("Received directly via Wireless P2P ✓")
            if (exportId && typeof sessionStorage !== "undefined") {
              try {
                sessionStorage.setItem(`lm_export_${exportId}`, receivedDataUrl)
              } catch {
                // ignore
              }
            }
          },
          () => {
            if (isMounted) {
              setStatusMessage("Connected! Transferring photo strip...")
              setIsP2pConnected(true)
            }
          },
          (err) => {
            console.warn("[MobileKeepsakeViewer] P2P notice:", err)
          },
        )
      }

      // Timeout fallback after 10s if nothing arrived
      const timer = setTimeout(() => {
        if (isMounted && !photoSrc) {
          setLoading(false)
          setStatusMessage("Transfer session timed out")
        }
      }, 10000)

      return () => {
        clearTimeout(timer)
      }
    }

    return () => {
      isMounted = false
      cancelP2p?.()
    }
  }, [initialImgUrl, exportId, initialPeerId, localSavedPhoto])

  const handleSaveToDevice = async () => {
    if (!photoSrc) return
    setIsSaving(true)
    try {
      const result = await savePhotoToCameraRoll(
        photoSrc,
        `little-moments-${exportId || Date.now()}.png`,
      )
      if (result.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      // fallback handled inside savePhotoToCameraRoll
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col items-center justify-between p-4 text-stone-900 font-sans selection:bg-[#42131b] selection:text-[#faf8f2]">
      {/* Top Header */}
      <header className="w-full max-w-sm pt-2 pb-3 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono uppercase tracking-wider mb-2">
          <Smartphone size={13} className="text-rose-600 animate-pulse" />
          <span>Instant Mobile Transfer</span>
        </div>
        <h1 className="font-gochi text-3xl text-stone-900 flex items-center justify-center gap-2">
          <Sparkles className="text-amber-500 fill-amber-500" size={24} /> Little Moments
        </h1>
        <p className="text-[11px] font-mono text-stone-500 uppercase tracking-widest mt-0.5">
          {statusMessage}
        </p>
      </header>

      {/* Main Keepsake Card */}
      <main className="w-full max-w-sm bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-2 border-stone-900 flex flex-col items-center my-auto">
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-stone-200 border-t-[#42131b] animate-spin" />
              <Camera size={24} className="absolute inset-0 m-auto text-[#42131b]" />
            </div>
            <p className="font-gochi text-xl text-stone-900 mb-1">
              Transferring your print...
            </p>
            <p className="text-xs text-stone-500 font-mono max-w-[240px]">
              {statusMessage}
            </p>
          </div>
        ) : photoSrc ? (
          <div className="w-full flex flex-col items-center">
            {/* Photobooth Strip Preview */}
            <div className="relative group max-h-[62vh] rounded-xl overflow-hidden shadow-lg border border-stone-300 mb-4 bg-stone-100 flex items-center justify-center">
              <img
                src={photoSrc}
                alt="Your Little Moments Photobooth Keepsake"
                className="max-h-[62vh] w-auto object-contain rounded-xl"
              />
              {isP2pConnected && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                  <ShieldCheck size={11} /> P2P Secure
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={handleSaveToDevice}
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#42131b] text-[#faf8f2] border-2 border-stone-900 shadow-[3px_3px_0_#1c1917] hover:bg-[#5a1b26] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving to Device...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={18} className="text-emerald-400" />
                    Saved to Camera Roll!
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Save to Camera Roll / Photos
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveToDevice}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Share with Friends
              </button>
            </div>

            <p className="text-[11px] text-stone-400 text-center mt-3 font-mono">
              Tip: Press & hold the photo to save directly to Apple Photos or Google Gallery
            </p>
          </div>
        ) : (
          <div className="w-full py-12 flex flex-col items-center justify-center text-center">
            <Camera size={44} className="mb-3 text-stone-300" />
            <h3 className="font-gochi text-2xl text-stone-800 mb-1">
              Photo Strip Ready
            </h3>
            <p className="text-xs text-stone-500 font-mono max-w-[260px] mb-4">
              If this screen opened on another device, ensure the QR modal is open on your computer or scan again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="py-2 px-4 rounded-lg bg-stone-800 text-white text-xs font-mono flex items-center gap-1.5 hover:bg-stone-700"
            >
              <RefreshCw size={13} /> Try Reconnecting
            </button>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-sm pt-4 pb-2 text-center">
        <a
          href="/"
          className="text-xs font-mono text-stone-600 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 flex items-center justify-center gap-1"
        >
          Open Full Photo Studio & Create New ✦
        </a>
      </footer>
    </div>
  )
}
