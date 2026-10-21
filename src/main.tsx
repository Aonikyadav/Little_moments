import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import MobileApp from './mobile/MobileApp'
import { Capacitor } from '@capacitor/core'
import './index.css'

function Root() {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()
  const isAppRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/app') ||
      window.location.search.includes('mode=app') ||
      window.location.search.includes('app=1') ||
      window.location.hash.includes('app'))

  // Dedicated Mobile App UI from scratch (used by Android APK and /app preview)
  if (isNative || isAppRoute) {
    return <MobileApp />
  }

  // Pure untouched Desktop Website
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
