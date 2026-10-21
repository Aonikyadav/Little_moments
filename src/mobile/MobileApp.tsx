import React, { useState } from "react"
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

export const MobileApp: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return !sessionStorage.getItem("lm_mobile_splash_seen")
  })
  const [currentTab, setCurrentTab] = useState<MobileTab>("home")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tmpl-user-001")
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem("lm_mobile_splash_seen", "true")
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setCurrentTab("studio")
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
    </div>
  )
}

export default MobileApp
