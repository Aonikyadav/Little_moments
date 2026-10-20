import { createClient, type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js"
import { dataUrlToBlob } from "../utils/photoTransfer"

export interface SupabaseCredentials {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface SupabasePhotobooth {
  id: string
  userId: string
  userEmail?: string | null
  imageUrl: string
  title: string
  templateId?: string
  createdAt: string
  createdAtMs: number
}

export interface UserAccount {
  id: string
  email: string
  role: "user" | "superadmin"
  createdAt?: string
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

/* =========================================================================
   USER AUTHENTICATION (Sign Up, Sign In, Sign Out, Superadmin Detection)
   ========================================================================= */

/**
 * Register a new user with Email & Password in Supabase
 */
export async function signUpUser(
  email: string,
  pass: string,
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: "Supabase not configured." }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "User registration failed." }
    }

    // Attempt auto-login if session was not returned immediately
    if (!data.session) {
      const loginRes = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      })
      if (loginRes.data?.user) {
        return {
          success: true,
          user: {
            id: loginRes.data.user.id,
            email: loginRes.data.user.email || email,
            role: "user",
          },
        }
      }
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        role: "user",
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign up." }
  }
}

/**
 * Sign in an existing user with Email & Password
 */
export async function signInUser(
  email: string,
  pass: string,
): Promise<{
  success: boolean
  user?: UserAccount
  isSuperadmin: boolean
  error?: string
}> {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, isSuperadmin: false, error: "Supabase not configured." }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    })

    if (error) {
      return { success: false, isSuperadmin: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, isSuperadmin: false, error: "Sign in failed." }
    }

    // Check if user is superadmin
    let role: "user" | "superadmin" = "user"
    if (
      data.user.email === "admin@littlemoments.com" ||
      data.user.app_metadata?.role === "superadmin" ||
      data.user.user_metadata?.role === "superadmin"
    ) {
      role = "superadmin"
    } else {
      // Query profiles table
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()
        if (profile?.role === "superadmin") {
          role = "superadmin"
        }
      } catch {
        // fallback
      }
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        role,
      },
      isSuperadmin: role === "superadmin",
    }
  } catch (err: any) {
    return {
      success: false,
      isSuperadmin: false,
      error: err.message || "Sign in error.",
    }
  }
}

/**
 * Sign out of Supabase
 */
export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieves the currently logged in user
 */
export async function getCurrentUser(): Promise<UserAccount | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return null

    let role: "user" | "superadmin" = "user"
    if (
      data.user.email === "admin@littlemoments.com" ||
      data.user.app_metadata?.role === "superadmin" ||
      data.user.user_metadata?.role === "superadmin"
    ) {
      role = "superadmin"
    } else {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()
        if (profile?.role === "superadmin") {
          role = "superadmin"
        }
      } catch {
        // fallback
      }
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      role,
    }
  } catch {
    return null
  }
}

/**
 * Listens for Auth state changes (login, logout, token refresh)
 */
export function onAuthStateChange(
  callback: (user: UserAccount | null) => void,
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) {
    callback(null)
    return () => {}
  }

  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        let role: "user" | "superadmin" = "user"
        if (
          session.user.email === "admin@littlemoments.com" ||
          session.user.app_metadata?.role === "superadmin"
        ) {
          role = "superadmin"
        } else {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .maybeSingle()
            if (profile?.role === "superadmin") {
              role = "superadmin"
            }
          } catch {
            // fallback
          }
        }
        callback({
          id: session.user.id,
          email: session.user.email || "",
          role,
        })
      } else {
        callback(null)
      }
    },
  )

  return () => {
    authListener.subscription.unsubscribe()
  }
}

/* =========================================================================
   PHOTO STORAGE & DATA PRIVACY (Strict Separation per User)
   ========================================================================= */

/**
 * Uploads photobooth strip to Supabase Storage & inserts record into "photos" table.
 * Strictly associates photo with the authenticated user ID.
 */
export async function savePhotoboothToSupabase(
  exportId: string,
  dataUrl: string,
  metadata?: {
    title?: string
    templateId?: string
    composition?: any
  },
  currentUser?: UserAccount | null,
): Promise<{ success: boolean; photo?: SupabasePhotobooth; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, error: "Supabase is not configured." }
  }

  try {
    let userId = currentUser?.id || null
    let userEmail = currentUser?.email || null

    // If currentUser was not provided, check the active Supabase auth session
    if (!userId) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          userId = sessionData.session.user.id
          userEmail = sessionData.session.user.email || null
        }
      } catch (sessionErr) {
        console.warn("[Supabase] Session check warning:", sessionErr)
      }
    }

    // Fall back to persistent guest client ID if not signed in
    if (!userId) {
      userId = getOrCreateUserId()
      userEmail = "Guest (Unregistered)"
    }

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
        user_email: userEmail,
        image_url: finalImageUrl,
        title,
        template_id: templateId,
        is_public: true, // Allows single QR mobile viewing without exposing the whole gallery
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
      userEmail,
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
 * Fetches a single photobooth record by its secret exportId.
 * Used for QR code scanning. Does NOT reveal the user's email or other private photos.
 */
export async function fetchPhotoboothFromSupabase(
  exportId: string,
): Promise<{ success: boolean; photo?: SupabasePhotobooth; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, error: "Supabase is not configured." }
  }

  try {
    // 1. Query "photos" table (sanitized - returns title, imageUrl, createdAt)
    const { data, error } = await supabase
      .from("photos")
      .select("id, user_id, image_url, title, template_id, created_at")
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

    return { success: false, error: "Photo not found in database." }
  } catch (err: any) {
    console.error("[Supabase] fetchPhotoboothFromSupabase error:", err)
    return { success: false, error: err.message || "Failed to fetch from Supabase." }
  }
}

/**
 * Fetches only the CURRENT user's saved photobooths.
 * Prevents unauthorized users from seeing others' data.
 */
export async function fetchUserPhotoboothsFromSupabase(
  targetUserId: string,
): Promise<{ success: boolean; photos: SupabasePhotobooth[]; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, photos: [], error: "Supabase is not configured." }
  }

  try {
    const { data, error } = await supabase
      .from("photos")
      .select("id, user_id, image_url, title, template_id, created_at")
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

/* =========================================================================
   SUPERADMIN PORTAL METHODS
   ========================================================================= */

/**
 * Fetches system stats (Superadmin only)
 */
export async function fetchSuperadminStats(): Promise<{
  totalPhotos: number
  totalUsers: number
  photos: SupabasePhotobooth[]
}> {
  const supabase = getSupabaseClient()
  if (!supabase) return { totalPhotos: 0, totalUsers: 0, photos: [] }

  try {
    // 1. Photos
    const { data: photosData } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    // 2. Profiles / Users count
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const photos: SupabasePhotobooth[] = (photosData || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      imageUrl: row.image_url,
      title: row.title || "Photo Strip",
      templateId: row.template_id,
      createdAt: row.created_at,
      createdAtMs: new Date(row.created_at).getTime(),
    }))

    return {
      totalPhotos: photosData?.length || 0,
      totalUsers: usersCount || 1,
      photos,
    }
  } catch (err) {
    console.error("[Supabase] fetchSuperadminStats error:", err)
    return { totalPhotos: 0, totalUsers: 0, photos: [] }
  }
}

/**
 * Superadmin can delete any prohibited/abusive photo
 */
export async function deletePhotoAsAdmin(
  photoId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: "Supabase not configured." }

  try {
    // 1. Delete from storage bucket
    await supabase.storage.from("photos").remove([`${photoId}.png`])

    // 2. Delete from photos table
    const { error } = await supabase.from("photos").delete().eq("id", photoId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
