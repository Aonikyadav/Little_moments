import React, { useState, useRef } from "react"
import { Camera, Upload, Sparkles, X, ArrowRight, LayoutGrid } from "lucide-react"
import type { MobileTab } from "./types"
import { BottomNavBar } from "./components/BottomNavBar"
import { SplashScreen } from "./screens/SplashScreen"
import { HomeScreen } from "./screens/HomeScreen"
import { TemplatesScreen } from "./screens/TemplatesScreen"
import { CameraScreen } from "./screens/CameraScreen"
import { BookmarksScreen } from "./screens/BookmarksScreen"
import { SettingsScreen } from "./screens/SettingsScreen"
import { KBoothScreen } from "./screens/KBoothScreen"
import { MobileStudioScreen } from "./screens/MobileStudioScreen"
import { getTemplate } from "../templates"
import { TemplateThumbnail } from "../components/TemplateThumbnail"

export const MobileApp: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return !sessionStorage.getItem("lm_mobile_splash_seen")
  })
  const [currentTab, setCurrentTab] = useState<MobileTab>("home")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tmpl-user-001")
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [actionTemplateId, setActionTemplateId] = useState<string | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem("lm_mobile_splash_seen", "true")
  }

  // When clicking any template: Prompt whether to use Camera or Upload from Gallery (No dummy photos!)
  const handleSelectTemplate = (templateId: string) => {
    setActionTemplateId(templateId)
  }

  const handlePhotosCaptured = (photos: string[]) => {
    setCapturedPhotos(photos)
    setCurrentTab("studio")
  }

  const handleOpenCreationInStudio = (creation: any) => {
    if (creation.image) {
      setCapturedPhotos([creation.image])
    }
    setCurrentTab("studio")
  }

  // Gallery file picker upload handler
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const readPromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readPromises).then((urls) => {
      if (actionTemplateId) {
        setSelectedTemplateId(actionTemplateId)
      }
      setCapturedPhotos(urls)
      setActionTemplateId(null)
      setCurrentTab("studio")
      if (galleryInputRef.current) galleryInputRef.current.value = ""
    })
  }

  const actionTemplate = actionTemplateId ? getTemplate(actionTemplateId) : null

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 font-mono relative">
      {/* Paper texture subtle overlay */}
      <div className="paper-texture" aria-hidden="true" />

      {/* 1. Starting Page (Splash) from sketch */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* 2. Main Tab Views */}
      <main className="w-full">
        {currentTab === "home" && (
          <HomeScreen
            onNavigate={setCurrentTab}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {currentTab === "templates" && (
          <TemplatesScreen
            onNavigate={setCurrentTab}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {currentTab === "camera" && (
          <CameraScreen
            onNavigate={setCurrentTab}
            onPhotosCaptured={handlePhotosCaptured}
          />
        )}

        {currentTab === "bookmarks" && (
          <BookmarksScreen
            onNavigate={setCurrentTab}
            onOpenCreationInStudio={handleOpenCreationInStudio}
          />
        )}

        {currentTab === "settings" && <SettingsScreen />}

        {currentTab === "kbooth" && (
          <KBoothScreen
            onNavigate={setCurrentTab}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {/* 3. Studio Screen (Full screen pro editor matching Image 2 & 3) */}
        {currentTab === "studio" && (
          <MobileStudioScreen
            onClose={() => setCurrentTab("home")}
            onNavigateToCamera={() => setCurrentTab("camera")}
            initialTemplateId={selectedTemplateId}
            incomingPhotos={capturedPhotos}
          />
        )}
      </main>

      {/* 4. Bottom Navigation Bar (Hidden when in Studio, Camera, or Splash) */}
      {!showSplash && currentTab !== "studio" && currentTab !== "camera" && (
        <BottomNavBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />
      )}

      {/* 5. Template Choice Action Sheet (Prompting Camera vs Gallery Upload - Zero Dummy Images!) */}
      {actionTemplate && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-[#faf8f0] w-full max-w-sm rounded-t-3xl sm:rounded-2xl border-t-2 sm:border-2 border-stone-900 shadow-[6px_6px_0_#171717] p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-stone-300">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-caveat text-2xl font-bold text-stone-900 leading-tight">Start Creating</h3>
              </div>
              <button
                type="button"
                onClick={() => setActionTemplateId(null)}
                className="w-8 h-8 rounded-full bg-white border border-stone-400 flex items-center justify-center text-stone-700 hover:text-stone-950 active:scale-90"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Template Info Card */}
            <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border-2 border-stone-900 mb-4 shadow-xs">
              <div className="w-14 h-20 bg-stone-100 rounded border border-stone-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <TemplateThumbnail template={actionTemplate} className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono font-bold text-amber-700 uppercase">
                  {actionTemplate.count}-CUT STRIP
                </span>
                <strong className="text-sm font-bold text-stone-900 truncate">
                  {actionTemplate.name}
                </strong>
                <span className="text-[10px] font-mono text-stone-500 line-clamp-2 mt-0.5">
                  {actionTemplate.note || "Choose how you want to add your photos"}
                </span>
              </div>
            </div>

            {/* The 2 Primary Action Buttons: Real Camera or Gallery Upload */}
            <div className="space-y-2.5 mb-3">
              {/* Option 1: Use Camera */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateId(actionTemplate.id)
                  setCapturedPhotos([])
                  setActionTemplateId(null)
                  setCurrentTab("camera")
                }}
                className="w-full py-3 px-4 rounded-xl bg-stone-900 text-white font-mono text-xs font-bold border-2 border-stone-900 shadow-[3px_3px_0_#d97762] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Camera size={18} className="text-amber-300" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Snap in Photobooth</span>
                    <span className="text-[9.5px] text-stone-400 font-normal">Use camera for live photo burst</span>
                  </div>
                </div>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 2: Upload from Gallery */}
              <button
                type="button"
                onClick={() => {
                  galleryInputRef.current?.click()
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-200 text-stone-950 font-mono text-xs font-bold border-2 border-stone-900 shadow-[3px_3px_0_#171717] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Upload size={18} className="text-stone-900" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Upload from Gallery</span>
                    <span className="text-[9.5px] text-amber-950/70 font-normal">Select real photos from device</span>
                  </div>
                </div>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Hidden file input for gallery upload */}
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>

            {/* Option 3: Open Blank in Studio */}
            <div className="text-center pt-2 border-t border-dashed border-stone-300">
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateId(actionTemplate.id)
                  setCapturedPhotos([])
                  setActionTemplateId(null)
                  setCurrentTab("studio")
                }}
                className="text-[11px] font-mono text-stone-600 hover:text-stone-950 underline"
              >
                Open Studio with Blank Slots (No Photos) →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileApp
