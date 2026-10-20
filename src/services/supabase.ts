import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { dataUrlToBlob } from "../utils/photoTransfer"

export interface SupabaseCredentials {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface SupabasePhotobooth {
  id: string
  userId: string
  imageUrl: string
  title: string
  templateId?: string
  createdAt: string
  createdAtMs: number
}

const STORAGE_KEY_CUSTOM_SUPABASE = "lm_custom_supabase_config"
const STORAGE_KEY_USER_ID = "lm_client_user_id"

/**
 * Returns a persistent anonymous client user ID
 */
export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "server_guest"
  let id = localStorage.getItem(STORAGE_KEY_USER_ID)
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(STORAGE_KEY_USER_ID, id)
  }
  return id
}

/**
 * Retrieves Supabase credentials from Vite environment variables or localStorage
 */
export function getSupabaseCredentials(): SupabaseCredentials | null {
  // 1. Vite Environment Variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL || ""
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

  if (envUrl && envKey) {
    return {
      supabaseUrl: envUrl.trim(),
      supabaseAnonKey: envKey.trim(),
    }
  }

  // 2. localStorage custom configuration
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_SUPABASE)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.supabaseUrl && parsed?.supabaseAnonKey) {
          return {
            supabaseUrl: parsed.supabaseUrl.trim(),
            supabaseAnonKey: parsed.supabaseAnonKey.trim(),
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return null
}

/**
 * Saves user-provided Supabase credentials to localStorage
 */
export function saveCustomSupabaseCredentials(config: SupabaseCredentials): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SUPABASE, JSON.stringify(config))
    cachedClient = null
  }
}

/**
 * Clears custom Supabase credentials from localStorage
 */
export function clearCustomSupabaseCredentials(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_SUPABASE)
    cachedClient = null
  }
}

let cachedClient: SupabaseClient | null = null

/**
 * Checks if Supabase credentials are fully configured
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials() !== null
}

/**
 * Returns the Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const creds = getSupabaseCredentials()
  if (!creds) return null

  try {
    cachedClient = createClient(creds.supabaseUrl, creds.supabaseAnonKey)
    return cachedClient
  } catch (err) {
    console.error("[Supabase] Initialization error:", err)
    return null
  }
}

/**
 * Uploads photobooth strip to Supabase Storage & inserts record into "photos" table
 */
export async function savePhotoboothToSupabase(
  exportId: string,
  dataUrl: string,
  metadata?: {
    title?: string
    templateId?: string
    composition?: any
  },
): Promise<{ success: boolean; photo?: SupabasePhotobooth; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, error: "Supabase is not configured." }
  }

  try {
    const userId = getOrCreateUserId()
    const filename = `${exportId}.png`
    const blob = dataUrlToBlob(dataUrl)

    let finalImageUrl = dataUrl

    // 1. Upload to Supabase Storage Bucket "photos"
    try {
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(filename, blob, {
          contentType: "image/png",
          upsert: true,
        })

      if (!uploadErr && uploadData?.path) {
        const { data: publicUrlData } = supabase.storage
          .from("photos")
          .getPublicUrl(uploadData.path)

        if (publicUrlData?.publicUrl) {
          finalImageUrl = publicUrlData.publicUrl
        }
      } else if (uploadErr) {
        console.warn("[Supabase] Storage bucket upload warning:", uploadErr.message)
      }
    } catch (storageException) {
      console.warn("[Supabase] Storage exception:", storageException)
    }

    // 2. Insert Record into PostgreSQL "photos" Table
    const title = metadata?.title || "Little Moments Keepsake"
    const templateId = metadata?.templateId || null
    const nowIso = new Date().toISOString()
    const nowMs = Date.now()

    const { error: dbError } = await supabase.from("photos").upsert(
      {
        id: exportId,
        user_id: userId,
        image_url: finalImageUrl,
        title,
        template_id: templateId,
        created_at: nowIso,
      },
      { onConflict: "id" },
    )

    if (dbError) {
      console.warn("[Supabase] Database upsert warning:", dbError.message)
    }

    const photobooth: SupabasePhotobooth = {
      id: exportId,
      userId,
      imageUrl: finalImageUrl,
      title,
      templateId: templateId || undefined,
      createdAt: nowIso,
      createdAtMs: nowMs,
    }

    return { success: true, photo: photobooth }
  } catch (err: any) {
    console.error("[Supabase] savePhotoboothToSupabase error:", err)
    return { success: false, error: err.message || "Failed to save to Supabase." }
  }
}

/**
 * Fetches a photobooth record from Supabase by its unique exportId
 */
export async function fetchPhotoboothFromSupabase(
  exportId: string,
): Promise<{ success: boolean; photo?: SupabasePhotobooth; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, error: "Supabase is not configured." }
  }

  try {
    // 1. Query "photos" table
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("id", exportId)
      .maybeSingle()

    if (!error && data?.image_url) {
      return {
        success: true,
        photo: {
          id: data.id,
          userId: data.user_id,
          imageUrl: data.image_url,
          title: data.title || "Little Moments Keepsake",
          templateId: data.template_id,
          createdAt: data.created_at || new Date().toISOString(),
          createdAtMs: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        },
      }
    }

    // 2. Fallback: Check if file exists directly in Supabase Storage "photos"
    const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(`${exportId}.png`)

    if (publicUrlData?.publicUrl) {
      return {
        success: true,
        photo: {
          id: exportId,
          userId: "cloud_user",
          imageUrl: publicUrlData.publicUrl,
          title: "Little Moments Keepsake",
          createdAt: new Date().toISOString(),
          createdAtMs: Date.now(),
        },
      }
    }

    return { success: false, error: "Photo not found in Supabase." }
  } catch (err: any) {
    console.error("[Supabase] fetchPhotoboothFromSupabase error:", err)
    return { success: false, error: err.message || "Failed to fetch from Supabase." }
  }
}

/**
 * Fetches all saved photobooths for the current user
 */
export async function fetchUserPhotoboothsFromSupabase(
  userId?: string,
): Promise<{ success: boolean; photos: SupabasePhotobooth[]; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, photos: [], error: "Supabase is not configured." }
  }

  try {
    const targetUserId = userId || getOrCreateUserId()
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, photos: [], error: error.message }
    }

    const photos: SupabasePhotobooth[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      imageUrl: row.image_url,
      title: row.title || "Photobooth Strip",
      templateId: row.template_id,
      createdAt: row.created_at,
      createdAtMs: new Date(row.created_at).getTime(),
    }))

    return { success: true, photos }
  } catch (err: any) {
    console.error("[Supabase] fetchUserPhotoboothsFromSupabase error:", err)
    return { success: false, photos: [], error: err.message }
  }
}
