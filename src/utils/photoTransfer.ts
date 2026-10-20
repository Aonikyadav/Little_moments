/**
 * Little Moments — Instant Wireless Photo Transfer Engine
 * 
 * Multi-tier Zero-Fail architecture for transferring high-res photobooth
 * strips from desktop / kiosk screens to any mobile device via QR Code:
 * 
 * 1. Tier 1 (Cloud Relay): Asynchronously uploads strip to high-speed ephemeral
 *    storage (uguu.se / catbox.moe), embedding the direct image link in the QR URL.
 *    Works across ANY network, mobile 4G/5G, and separate Wi-Fi routers worldwide.
 * 
 * 2. Tier 2 (WebRTC P2P DataChannel): Direct encrypted peer-to-peer connection
 *    via PeerJS. Streams uncompressed raw canvas data directly to the phone's browser.
 * 
 * 3. Tier 3 (Local Storage / Same-device): Instant local session transfer for testing
 *    and single-device workflows.
 * 
 * 4. Native Camera Roll Saving: Integrates Web Share API (navigator.share) to directly
 *    invoke iOS "Save Image" / Android "Save to Device" photo gallery dialogs.
 */

import { Peer, type DataConnection } from "peerjs"

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Uploads a canvas image blob to high-speed ephemeral cloud storage.
 * Retries across primary (uguu.se) and secondary (catbox.moe) relays.
 */
export async function uploadStripToCloudRelay(blob: Blob): Promise<UploadResult> {
  const filename = `little-moments-${Date.now()}.png`

  // 1. Primary: uguu.se (48-hour temporary host, direct image link, fast CDN)
  try {
    const form = new FormData()
    form.append("files[]", blob, filename)
    const res = await fetch("https://uguu.se/upload.php", {
      method: "POST",
      body: form,
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success && json.files?.[0]?.url) {
        return { success: true, url: json.files[0].url }
      }
    }
  } catch (err) {
    console.warn("[PhotoTransfer] Primary relay upload failed, trying fallback:", err)
  }

  // 2. Secondary: catbox.moe (fast direct CDN link)
  try {
    const form = new FormData()
    form.append("reqtype", "fileupload")
    form.append("fileToUpload", blob, filename)
    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.trim().startsWith("http")) {
        return { success: true, url: text.trim() }
      }
    }
  } catch (err) {
    console.warn("[PhotoTransfer] Secondary relay upload failed:", err)
  }

  return { success: false, error: "Cloud relays unavailable" }
}

/**
 * Converts a dataURL string to a binary Blob for network upload.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Desktop / Kiosk P2P Host: Listens for incoming mobile phone connections
 * and pushes the full uncompressed photobooth strip.
 */
export class PhotoTransferHost {
  private peer: Peer | null = null
  private exportId: string
  private dataUrl: string
  private onMobileConnected?: () => void

  constructor(exportId: string, dataUrl: string, onMobileConnected?: () => void) {
    this.exportId = exportId
    this.dataUrl = dataUrl
    this.onMobileConnected = onMobileConnected
  }

  public start() {
    try {
      // Create peer with sanitized ID matching export
      const peerId = `lm-${this.exportId.replace(/[^a-zA-Z0-9_-]/g, "")}`
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      })

      this.peer.on("connection", (conn: DataConnection) => {
        conn.on("open", () => {
          this.onMobileConnected?.()
          conn.send({
            type: "LITTLE_MOMENTS_PHOTO",
            dataUrl: this.dataUrl,
            timestamp: Date.now(),
          })
        })
      })

      this.peer.on("error", (err) => {
        console.warn("[PhotoTransferHost] Peer error:", err)
      })
    } catch (e) {
      console.warn("[PhotoTransferHost] WebRTC host initialization failed:", e)
    }
  }

  public destroy() {
    try {
      this.peer?.destroy()
    } catch {
      // ignore
    }
    this.peer = null
  }
}

/**
 * Mobile Phone Receiver: Connects to desktop P2P host to receive the image.
 */
export function listenForP2PPhoto(
  peerId: string,
  onPhotoReceived: (dataUrl: string) => void,
  onConnecting?: () => void,
  onError?: (err: any) => void,
): () => void {
  let peer: Peer | null = null
  try {
    peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    })

    peer.on("open", () => {
      onConnecting?.()
      const conn = peer!.connect(peerId, { reliable: true })

      conn.on("open", () => {
        conn.on("data", (data: any) => {
          if (data && data.type === "LITTLE_MOMENTS_PHOTO" && data.dataUrl) {
            onPhotoReceived(data.dataUrl)
          }
        })
      })

      conn.on("error", (err) => {
        onError?.(err)
      })
    })

    peer.on("error", (err) => {
      onError?.(err)
    })
  } catch (e) {
    onError?.(e)
  }

  return () => {
    try {
      peer?.destroy()
    } catch {
      // ignore
    }
  }
}

/**
 * Native Camera Roll Saving: Triggers native OS share sheet (iOS/Android)
 * or downloads directly as an image file.
 */
export async function savePhotoToCameraRoll(
  imageUrl: string,
  fileName = `little-moments-${Date.now()}.png`,
): Promise<{ success: boolean; shared: boolean; message: string }> {
  try {
    let blob: Blob
    if (imageUrl.startsWith("data:")) {
      blob = dataUrlToBlob(imageUrl)
    } else {
      const response = await fetch(imageUrl, { mode: "cors" })
      blob = await response.blob()
    }

    const file = new File([blob], fileName, { type: blob.type || "image/png" })

    // Check if Web Share API with files is supported (modern iOS Safari and Android Chrome)
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: "Little Moments Photobooth",
          text: "My Photobooth Keepsake · Little Moments",
        })
        return {
          success: true,
          shared: true,
          message: "Saved to device / shared successfully!",
        }
      } catch (shareErr: any) {
        // User may cancel the share dialog, which is normal
        if (shareErr.name === "AbortError") {
          return { success: true, shared: true, message: "Share dialog closed" }
        }
      }
    }

    // Direct Browser Download Fallback
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

    return {
      success: true,
      shared: false,
      message: "Photo downloaded to your device gallery!",
    }
  } catch (err) {
    console.error("[savePhotoToCameraRoll] Error saving:", err)
    return {
      success: false,
      shared: false,
      message: "Could not save photo automatically. Press and hold image to save.",
    }
  }
}
