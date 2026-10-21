import { getSupabaseClient, type UserAccount } from "./supabase"
import type { PhotoTemplate, Slot, StickerLayer, TextLayer, PhotoTransform, PhotoCount } from "../types"
import { dataUrlToBlob } from "../utils/photoTransfer"

export interface AdminUserRecord {
  id: string
  email: string
  role: "user" | "superadmin"
  status: "active" | "suspended"
  createdAt: string
  lastActiveAt?: string
  photoCount: number
}

export interface AdminPlatformMetrics {
  totalUsers: number
  activeUsers: number
  totalPhotos: number
  publishedTemplatesCount: number
  draftTemplatesCount: number
  dbOnline: boolean
}

export interface AdminAuditLogRecord {
  id: string
  adminId: string
  adminEmail: string
  action: string
  targetType: "template" | "user" | "photo"
  targetId: string
  details: Record<string, any>
  createdAt: string
}

export interface CustomTemplateRecord {
  id: string
  name: string
  description?: string
  category: string
  tags: string[]
  version: number
  thumbnailUrl?: string
  width: number
  height: number
  aspectRatio: string
  orientation: "portrait" | "landscape" | "square"
  photoCount: PhotoCount
  slots: Slot[]
  background: string
  backgroundPattern?: string
  backgroundOpacity?: number
  accent?: string
  frameId?: string
  frameColor?: string
  frameOpacity?: number
  frameTransform?: PhotoTransform
  stickers: StickerLayer[]
  texts: TextLayer[]
  status: "draft" | "published" | "archived"
  createdBy: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  stats?: {
    uses: number
    bookmarks: number
  }
}

const STORAGE_CUSTOM_TEMPLATES = "lm_custom_templates_v2"
const STORAGE_AUDIT_LOGS = "lm_admin_audit_logs_v2"

/* =========================================================================
   LOCAL OFFLINE CACHE HELPERS
   ========================================================================= */

function readLocalTemplates(): CustomTemplateRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_TEMPLATES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Public alias for synchronous local cache reads.
 * Use this to pre-load custom template stickers/texts/frames before the
 * async Supabase fetch completes, preventing the "empty composition" race condition.
 */
export function readLocalTemplateCache(): CustomTemplateRecord[] {
  return readLocalTemplates()
}

function writeLocalTemplates(items: CustomTemplateRecord[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_CUSTOM_TEMPLATES, JSON.stringify(items))
  } catch (e) {
    console.warn("[AdminService] Failed saving local templates cache", e)
  }
}

function readLocalAuditLogs(): AdminAuditLogRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOGS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocalAuditLogs(logs: AdminAuditLogRecord[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)))
  } catch (e) {
    console.warn("[AdminService] Failed saving local audit logs", e)
  }
}

/* =========================================================================
   AUDIT LOGGING
   ========================================================================= */

export async function logAdminAudit(
  adminUser: UserAccount | null | undefined,
  action: string,
  targetType: "template" | "user" | "photo",
  targetId: string,
  details: Record<string, any> = {},
): Promise<void> {
  const adminId = adminUser?.id || "admin_master"
  const adminEmail = adminUser?.email || "admin@littlemoments.com"
  const entry: AdminAuditLogRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminId,
    adminEmail,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  }

  // Local fallback log
  const localLogs = readLocalAuditLogs()
  writeLocalAuditLogs([entry, ...localLogs])

  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.from("admin_audit_logs").insert({
        admin_id: adminId,
        admin_email: adminEmail,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        created_at: entry.createdAt,
      })
    } catch (e) {
      console.warn("[AdminService] Remote audit log failed:", e)
    }
  }
}

export async function fetchAdminAuditLogs(limit = 30): Promise<AdminAuditLogRecord[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          adminId: r.admin_id,
          adminEmail: r.admin_email,
          action: r.action,
          targetType: r.target_type,
          targetId: r.target_id,
          details: r.details || {},
          createdAt: r.created_at,
        }))
      }
    } catch (e) {
      console.warn("[AdminService] fetchAdminAuditLogs remote error:", e)
    }
  }
  return readLocalAuditLogs().slice(0, limit)
}

/* =========================================================================
   PLATFORM METRICS & DASHBOARD STATS
   ========================================================================= */

export async function fetchPlatformMetrics(): Promise<AdminPlatformMetrics> {
  const supabase = getSupabaseClient()
  const localTemplates = readLocalTemplates()
  const publishedCount = localTemplates.filter((t) => t.status === "published").length
  const draftCount = localTemplates.filter((t) => t.status === "draft").length

  if (!supabase) {
    return {
      totalUsers: 7,
      activeUsers: 3,
      totalPhotos: 5,
      publishedTemplatesCount: publishedCount,
      draftTemplatesCount: draftCount,
      dbOnline: false,
    }
  }

  try {
    const [profilesRes, photosRes, templatesRes] = await Promise.all([
      supabase.from("profiles").select("id, status, last_active_at", { count: "exact" }),
      supabase.from("photos").select("id", { count: "exact", head: true }),
      supabase.from("templates").select("id, status"),
    ])

    const totalUsers = profilesRes.count || profilesRes.data?.length || 7
    const totalPhotos = photosRes.count || 5

    // Count active users (status != 'suspended' and active recently)
    const activeUsers = profilesRes.data
      ? profilesRes.data.filter((u: any) => u.status !== "suspended").length
      : Math.max(1, totalUsers - 1)

    let remotePublished = publishedCount
    let remoteDrafts = draftCount

    if (templatesRes.data) {
      remotePublished = templatesRes.data.filter((t: any) => t.status === "published").length
      remoteDrafts = templatesRes.data.filter((t: any) => t.status === "draft").length
    }

    return {
      totalUsers,
      activeUsers,
      totalPhotos,
      publishedTemplatesCount: remotePublished,
      draftTemplatesCount: remoteDrafts,
      dbOnline: true,
    }
  } catch (err) {
    console.warn("[AdminService] fetchPlatformMetrics error:", err)
    return {
      totalUsers: 7,
      activeUsers: 3,
      totalPhotos: 5,
      publishedTemplatesCount: publishedCount,
      draftTemplatesCount: draftCount,
      dbOnline: false,
    }
  }
}

/* =========================================================================
   USER DIRECTORY & MANAGEMENT
   ========================================================================= */

export async function fetchAdminUserList(): Promise<AdminUserRecord[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return [
      {
        id: "a0000000-0000-0000-0000-000000000001",
        email: "admin@littlemoments.com",
        role: "superadmin",
        status: "active",
        createdAt: "2026-10-20T16:55:21Z",
        photoCount: 2,
      },
    ]
  }

  try {
    // 1. Fetch all profiles
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (pErr) throw pErr

    // 2. Fetch photo count per user
    const { data: photos } = await supabase.from("photos").select("user_id, user_email")

    const photoCounts: Record<string, number> = {}
    ;(photos || []).forEach((p: any) => {
      const key = p.user_id || p.user_email || "unknown"
      photoCounts[key] = (photoCounts[key] || 0) + 1
      if (p.user_email) {
        photoCounts[p.user_email] = (photoCounts[p.user_email] || 0) + 1
      }
    })

    return (profiles || []).map((p: any) => ({
      id: p.id,
      email: p.email || "anonymous@littlemoments.app",
      role: p.role === "superadmin" || p.email === "admin@littlemoments.com" ? "superadmin" : "user",
      status: p.status === "suspended" ? "suspended" : "active",
      createdAt: p.created_at || new Date().toISOString(),
      lastActiveAt: p.last_active_at || p.created_at,
      photoCount: photoCounts[p.id] || photoCounts[p.email] || 0,
    }))
  } catch (err) {
    console.error("[AdminService] fetchAdminUserList error:", err)
    return []
  }
}

export async function updateAdminUserStatus(
  userId: string,
  newStatus: "active" | "suspended",
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: "Database not configured." }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId)

    if (error) throw error

    await logAdminAudit(adminUser, `user_status_${newStatus}`, "user", userId, { newStatus })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed updating user status." }
  }
}

export async function updateAdminUserRole(
  userId: string,
  newRole: "user" | "superadmin",
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: "Database not configured." }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)

    if (error) throw error

    await logAdminAudit(adminUser, `user_role_${newRole}`, "user", userId, { newRole })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed updating user role." }
  }
}

/* =========================================================================
   CUSTOM TEMPLATE CRUD & PUBLISHING ENGINE
   ========================================================================= */

function transformDbTemplate(row: any): CustomTemplateRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    category: row.category || "Normal Collage",
    tags: Array.isArray(row.tags) ? row.tags : [],
    version: row.version || 1,
    thumbnailUrl: row.thumbnail_url || undefined,
    width: row.width || 1800,
    height: row.height || 2400,
    aspectRatio: row.aspect_ratio || "original",
    orientation: row.orientation || "portrait",
    photoCount: (row.photo_count || (row.slots ? row.slots.length : 4)) as PhotoCount,
    slots: row.slots || [],
    background: row.background || "#ffffff",
    backgroundPattern: row.background_pattern || undefined,
    backgroundOpacity: row.background_opacity ?? 1.0,
    accent: row.accent || "#171717",
    frameId: row.frame_id || undefined,
    frameColor: row.frame_color || undefined,
    frameOpacity: row.frame_opacity ?? 1.0,
    frameTransform: row.frame_transform || undefined,
    stickers: row.stickers || [],
    texts: row.texts || [],
    status: row.status || "draft",
    createdBy: row.created_by || "admin",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    publishedAt: row.published_at || undefined,
    stats: row.stats || { uses: 0, bookmarks: 0 },
  }
}

/**
 * Fetches all templates from Supabase and syncs with local cache.
 * If includeDrafts is false, returns only published templates for normal users.
 */
export async function fetchCustomTemplates(includeDrafts = false): Promise<CustomTemplateRecord[]> {
  const supabase = getSupabaseClient()
  const localList = readLocalTemplates()

  if (supabase) {
    try {
      let query = supabase.from("templates").select("*").order("updated_at", { ascending: false })
      if (!includeDrafts) {
        query = query.eq("status", "published")
      }

      const { data, error } = await query
      if (!error && data) {
        const remoteTemplates = data.map(transformDbTemplate)

        // Merge remote templates with local drafts
        const mergedMap = new Map<string, CustomTemplateRecord>()
        remoteTemplates.forEach((t) => mergedMap.set(t.id, t))

        if (includeDrafts) {
          localList.forEach((t) => {
            if (!mergedMap.has(t.id)) {
              mergedMap.set(t.id, t)
            }
          })
        }

        const merged = Array.from(mergedMap.values())
        writeLocalTemplates(merged)
        return includeDrafts ? merged : merged.filter((t) => t.status === "published")
      }
    } catch (e) {
      console.warn("[AdminService] fetchCustomTemplates error, using local cache:", e)
    }
  }

  return includeDrafts ? localList : localList.filter((t) => t.status === "published")
}

/**
 * Uploads cover image thumbnail to Supabase Storage if dataUrl is provided
 */
async function uploadCoverImage(templateId: string, dataUrl: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase || !dataUrl.startsWith("data:")) return dataUrl

  try {
    const blob = dataUrlToBlob(dataUrl)
    const filePath = `covers/${templateId}_${Date.now()}.png`
    const { error: uploadErr } = await supabase.storage.from("templates").upload(filePath, blob, {
      contentType: "image/png",
      upsert: true,
    })

    if (uploadErr) {
      console.warn("[AdminService] Cover image upload error:", uploadErr)
      return dataUrl
    }

    const { data } = supabase.storage.from("templates").getPublicUrl(filePath)
    return data?.publicUrl || dataUrl
  } catch (e) {
    console.warn("[AdminService] Failed uploading cover image:", e)
    return dataUrl
  }
}

/**
 * Saves or updates a template draft
 */
export async function saveCustomTemplate(
  template: CustomTemplateRecord,
  coverDataUrl?: string,
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; template?: CustomTemplateRecord; error?: string }> {
  try {
    let finalThumbnail = template.thumbnailUrl
    if (coverDataUrl) {
      const uploadedUrl = await uploadCoverImage(template.id, coverDataUrl)
      if (uploadedUrl) finalThumbnail = uploadedUrl
    }

    const updated: CustomTemplateRecord = {
      ...template,
      thumbnailUrl: finalThumbnail,
      updatedAt: new Date().toISOString(),
      createdBy: adminUser?.email || template.createdBy || "admin@littlemoments.com",
    }

    // 1. Save to local cache immediately
    const local = readLocalTemplates().filter((t) => t.id !== updated.id)
    writeLocalTemplates([updated, ...local])

    // 2. Persist to Supabase
    const supabase = getSupabaseClient()
    if (supabase) {
      const payload = {
        id: updated.id,
        name: updated.name,
        description: updated.description || null,
        category: updated.category,
        tags: updated.tags,
        version: updated.version,
        thumbnail_url: updated.thumbnailUrl || null,
        width: updated.width,
        height: updated.height,
        aspect_ratio: updated.aspectRatio,
        orientation: updated.orientation,
        photo_count: updated.photoCount,
        slots: updated.slots,
        background: updated.background,
        background_pattern: updated.backgroundPattern || null,
        background_opacity: updated.backgroundOpacity,
        accent: updated.accent || "#171717",
        frame_id: updated.frameId || null,
        frame_color: updated.frameColor || null,
        frame_opacity: updated.frameOpacity,
        frame_transform: updated.frameTransform || null,
        stickers: updated.stickers,
        texts: updated.texts,
        status: updated.status,
        created_by: updated.createdBy,
        updated_at: updated.updatedAt,
        published_at: updated.publishedAt || null,
        stats: updated.stats || { uses: 0, bookmarks: 0 },
      }

      const { error } = await supabase.from("templates").upsert(payload, { onConflict: "id" })
      if (error) {
        console.warn("[AdminService] Remote template upsert error (saved locally):", error)
      }
    }

    await logAdminAudit(adminUser, "template_saved", "template", updated.id, {
      name: updated.name,
      status: updated.status,
    })

    return { success: true, template: updated }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed saving template" }
  }
}

/**
 * Publishes a template (making it visible in user catalog)
 */
export async function publishCustomTemplate(
  templateId: string,
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; error?: string }> {
  const local = readLocalTemplates()
  const target = local.find((t) => t.id === templateId)
  if (!target) return { success: false, error: "Template not found" }

  const published: CustomTemplateRecord = {
    ...target,
    status: "published",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: target.version + 1,
  }

  const res = await saveCustomTemplate(published, undefined, adminUser)
  if (res.success) {
    await logAdminAudit(adminUser, "template_published", "template", templateId, {
      name: published.name,
      version: published.version,
    })
  }
  return res
}

/**
 * Unpublishes a template back to draft
 */
export async function unpublishCustomTemplate(
  templateId: string,
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; error?: string }> {
  const local = readLocalTemplates()
  const target = local.find((t) => t.id === templateId)
  if (!target) return { success: false, error: "Template not found" }

  const unpub: CustomTemplateRecord = {
    ...target,
    status: "draft",
    updatedAt: new Date().toISOString(),
  }

  const res = await saveCustomTemplate(unpub, undefined, adminUser)
  if (res.success) {
    await logAdminAudit(adminUser, "template_unpublished", "template", templateId, {
      name: unpub.name,
    })
  }
  return res
}

/**
 * Archives a template
 */
export async function archiveCustomTemplate(
  templateId: string,
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; error?: string }> {
  const local = readLocalTemplates()
  const target = local.find((t) => t.id === templateId)
  if (!target) return { success: false, error: "Template not found" }

  const archived: CustomTemplateRecord = {
    ...target,
    status: "archived",
    updatedAt: new Date().toISOString(),
  }

  const res = await saveCustomTemplate(archived, undefined, adminUser)
  if (res.success) {
    await logAdminAudit(adminUser, "template_archived", "template", templateId, {
      name: archived.name,
    })
  }
  return res
}

/**
 * Permanently deletes a template
 */
export async function deleteCustomTemplate(
  templateId: string,
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; error?: string }> {
  const local = readLocalTemplates().filter((t) => t.id !== templateId)
  writeLocalTemplates(local)

  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.from("templates").delete().eq("id", templateId)
    } catch (e) {
      console.warn("[AdminService] Remote delete error:", e)
    }
  }

  await logAdminAudit(adminUser, "template_deleted", "template", templateId)
  return { success: true }
}

/**
 * Clones/Duplicates a template
 */
export async function duplicateCustomTemplate(
  templateId: string,
  adminUser?: UserAccount | null,
): Promise<{ success: boolean; template?: CustomTemplateRecord; error?: string }> {
  const local = readLocalTemplates()
  const source = local.find((t) => t.id === templateId)
  if (!source) return { success: false, error: "Template not found" }

  const newId = `tmpl-custom-${Date.now()}`
  const clone: CustomTemplateRecord = {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    status: "draft",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: undefined,
  }

  return saveCustomTemplate(clone, undefined, adminUser)
}

/**
 * Converts a CustomTemplateRecord into standard runtime PhotoTemplate
 */
export function customTemplateToPhotoTemplate(c: CustomTemplateRecord): PhotoTemplate {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    count: c.photoCount,
    width: c.width,
    height: c.height,
    slots: c.slots,
    background: c.background,
    accent: c.accent || "#171717",
    orientation: c.orientation,
    note: c.description || `#${c.category.toLowerCase().replace(/\s+/g, "")} #custom #studio`,
    thumbnail: c.thumbnailUrl,
    tags: c.tags,
    backgroundPattern: c.backgroundPattern,
    frameId: c.frameId,
    frameColor: c.frameColor,
    subtitle: c.description,
  }
}
