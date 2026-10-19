import { useEffect, useState } from "react"

export default function useFontRevision(): number {
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        setRevision((r) => r + 1)
      })

      const onLoadingDone = () => {
        setRevision((r) => r + 1)
      }

      document.fonts.addEventListener("loadingdone", onLoadingDone)
      return () => {
        document.fonts.removeEventListener("loadingdone", onLoadingDone)
      }
    }
  }, [])

  return revision
}
