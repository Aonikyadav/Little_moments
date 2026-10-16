import { useEffect, useState } from "react"

// Repaint Canvas text when the existing global web-font wiring finishes loading.
export default function useFontRevision() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    document.fonts.addEventListener("loadingdone", refresh)
    return () => document.fonts.removeEventListener("loadingdone", refresh)
  }, [])
  return revision
}
