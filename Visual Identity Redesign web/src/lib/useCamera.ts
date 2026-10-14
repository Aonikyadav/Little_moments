import { useCallback, useEffect, useRef, useState } from 'react'

export type CamErrorKind = 'denied' | 'nodevice' | 'busy' | 'unsupported' | 'other'

export interface CamError {
  kind: CamErrorKind
  message: string
}

function mapError(e: unknown): CamError {
  const name = (e as { name?: string })?.name ?? ''
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return { kind: 'denied', message: 'Camera permission was blocked.' }
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError')
    return { kind: 'nodevice', message: 'No accessible camera was found for these settings.' }
  if (name === 'NotReadableError' || name === 'AbortError' || name === 'TrackStartError')
    return { kind: 'busy', message: 'The camera is busy or in use by another app.' }
  return { kind: 'other', message: 'The camera could not be started.' }
}

export function useCamera(facing: 'user' | 'environment', deviceId: string) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'requesting' | 'ready' | 'error'>('requesting')
  const [error, setError] = useState<CamError | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    setStatus('requesting')
    setError(null)

    const run = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError({
          kind: 'unsupported',
          message: window.isSecureContext
            ? 'This browser does not support camera access.'
            : 'Camera access needs a secure (https) page.',
        })
        setStatus('error')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: facing }),
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play().catch(() => undefined)
        }
        setStatus('ready')
        const list = await navigator.mediaDevices.enumerateDevices().catch(() => [])
        if (!cancelled) setDevices(list.filter((d) => d.kind === 'videoinput'))
      } catch (e) {
        if (cancelled) return
        setError(mapError(e))
        setStatus('error')
      }
    }
    void run()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      const v = videoRef.current
      if (v) v.srcObject = null
    }
  }, [facing, deviceId, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { videoRef, status, error, devices, retry }
}
