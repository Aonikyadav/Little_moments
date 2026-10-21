import React, { useState, useEffect, useMemo } from "react"
import {
  ShieldAlert,
  Users,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  Eye,
  Copy,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Unlock,
  ShieldCheck,
  UserX,
  UserCheck,
  Clock,
  Layers,
  FileText,
  Archive,
  ArrowRight,
  X,
  BookOpen,
  Wand2,
  Paintbrush,
  Camera,
} from "lucide-react"
import type { UserAccount } from "../../services/supabase"
import {
  type AdminUserRecord,
  type AdminPlatformMetrics,
  type AdminAuditLogRecord,
  type CustomTemplateRecord,
  fetchPlatformMetrics,
  fetchAdminUserList,
  updateAdminUserStatus,
  updateAdminUserRole,
  fetchAdminAuditLogs,
  fetchCustomTemplates,
  publishCustomTemplate,
  unpublishCustomTemplate,
  archiveCustomTemplate,
  deleteCustomTemplate,
  duplicateCustomTemplate,
} from "../../services/adminService"
import { fetchSuperadminStats, deletePhotoAsAdmin } from "../../services/supabase"
import { VisualTemplateStudio } from "./VisualTemplateStudio"
import { loadProjects, type ProjectRecord } from "../../studio/storage"
import { getTemplate, templates } from "../../templates"
import type { Composition, Slot, PhotoCount } from "../../types"

export interface ScrapbookItemRecord {
  id: string
  title: string
  date: string
  imageUrl: string
  source: "cloud" | "studio-idb" | "local"
  userEmail?: string
  userId?: string
  templateId?: string
  composition?: Composition
  stickerCount?: number
  textCount?: number
  photoCount?: number
}

interface MasterControlDashboardProps {
  currentUser: UserAccount
  onClose: () => void
  onOpenTemplateInStudio?: (templateId: string) => void
}

export const MasterControlDashboard: React.FC<MasterControlDashboardProps> = ({
  currentUser,
  onClose,
}) => {
  // Navigation Tabs: "master" (User Directory & Moderation) | "templates" (Catalog) | "scrapbook" (Scrapbook Keepsakes) | "studio" (No-code builder)
  const [activeTab, setActiveTab] = useState<"master" | "templates" | "scrapbook" | "studio">("master")

  // Platform Metrics
  const [metrics, setMetrics] = useState<AdminPlatformMetrics>({
    totalUsers: 7,
    activeUsers: 3,
    totalPhotos: 5,
    publishedTemplatesCount: 0,
    draftTemplatesCount: 0,
    dbOnline: true,
  })

  // User Management State
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [userSearch, setUserSearch] = useState<string>("")
  const [roleFilter, setRoleFilter] = useState<"all" | "superadmin" | "user">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "photos">("newest")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const USERS_PER_PAGE = 8

  // Photos & Content Moderation
  const [recentPhotos, setRecentPhotos] = useState<any[]>([])
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

  // Scrapbook Items & Creations State
  const [scrapbookItems, setScrapbookItems] = useState<ScrapbookItemRecord[]>([])
  const [scrapbookSearch, setScrapbookSearch] = useState<string>("")
  const [scrapbookSourceFilter, setScrapbookSourceFilter] = useState<"all" | "cloud" | "studio-idb" | "local">("all")

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>([])

  // Template Manager State
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateRecord[]>([])
  const [templateStatusFilter, setTemplateStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all")
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all")
  const [selectedTemplateForStudio, setSelectedTemplateForStudio] = useState<CustomTemplateRecord | null>(null)

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    confirmColor?: "rose" | "stone"
    onConfirm: () => Promise<void>
  } | null>(null)

  // Loading & Toast
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Initial Data Load
  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [metricsData, userList, auditData, templatesData, statsData] = await Promise.all([
        fetchPlatformMetrics(),
        fetchAdminUserList(),
        fetchAdminAuditLogs(25),
        fetchCustomTemplates(true),
        fetchSuperadminStats(),
      ])

      setMetrics(metricsData)
      setUsers(userList)
      setAuditLogs(auditData)
      setCustomTemplates(templatesData)
      setRecentPhotos(statsData.photos || [])

      // Load Scrapbook Keepsakes from: 1) IndexedDB Studio Projects, 2) LocalStorage Creations, 3) Cloud Photos
      const loadedScrapbook: ScrapbookItemRecord[] = []
      const seenIds = new Set<string>()

      // 1. IndexedDB Studio Projects
      try {
        const idbProjects = await loadProjects()
        for (const p of idbProjects) {
          if (p.id && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            const tmpl = p.composition?.templateId ? getTemplate(p.composition.templateId) : null
            loadedScrapbook.push({
              id: p.id,
              title: tmpl?.name ? `${tmpl.name} (Studio Keep)` : "Studio Scrapbook Keep",
              date: p.date || new Date().toISOString(),
              imageUrl: p.image,
              source: "studio-idb",
              userEmail: currentUser.email,
              userId: currentUser.id,
              templateId: p.composition?.templateId,
              composition: p.composition,
              stickerCount: p.composition?.stickers?.length || 0,
              textCount: p.composition?.texts?.length || 0,
              photoCount: (p.composition?.photos?.length || tmpl?.count || 4) as PhotoCount,
            })
          }
        }
      } catch (err) {
        console.warn("[MasterControl] IDB projects load notice:", err)
      }

      // 2. LocalStorage Creations
      try {
        const rawLocal = localStorage.getItem("little-creations")
        if (rawLocal) {
          const localList = JSON.parse(rawLocal)
          if (Array.isArray(localList)) {
            for (const item of localList) {
              const itemId = item.id || `local-${Math.random().toString(36).substring(2, 7)}`
              if (!seenIds.has(itemId)) {
                seenIds.add(itemId)
                const comp: Composition | undefined = item.data || item.composition
                const tmpl = comp?.templateId ? getTemplate(comp.templateId) : null
                loadedScrapbook.push({
                  id: itemId,
                  title: item.name || tmpl?.name || "Local Scrapbook Keepsake",
                  date: item.date || new Date().toISOString(),
                  imageUrl: item.previewUrl || item.image,
                  source: "local",
                  userEmail: currentUser.email,
                  userId: currentUser.id,
                  templateId: comp?.templateId,
                  composition: comp,
                  stickerCount: comp?.stickers?.length || 0,
                  textCount: comp?.texts?.length || 0,
                  photoCount: (comp?.photos?.length || tmpl?.count || 4) as PhotoCount,
                })
              }
            }
          }
        }
      } catch (err) {
        console.warn("[MasterControl] Local creations load notice:", err)
      }

      // 3. Cloud Photos from Supabase
      const cloudPhotos = statsData.photos || []
      for (const p of cloudPhotos) {
        const pId = p.id || `cloud-${Math.random().toString(36).substring(2, 7)}`
        if (!seenIds.has(pId)) {
          seenIds.add(pId)
          const tmpl = p.templateId ? getTemplate(p.templateId) : null
          loadedScrapbook.push({
            id: pId,
            title: p.title || (tmpl?.name ? `${tmpl.name} Strip` : "Cloud Photobooth Keepsake"),
            date: p.createdAt || new Date().toISOString(),
            imageUrl: p.imageUrl,
            source: "cloud",
            userEmail: p.userEmail || undefined,
            userId: p.userId,
            templateId: p.templateId,
            photoCount: (tmpl?.count || 4) as PhotoCount,
          })
        }
      }

      setScrapbookItems(loadedScrapbook)
    } catch (err) {
      console.warn("[MasterControl] Error loading dashboard data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    let result = [...users]
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase()
      result = result.filter(
        (u) => u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter)
    }
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sortBy === "photos") {
      result.sort((a, b) => b.photoCount - a.photoCount)
    }
    return result
  }, [users, userSearch, roleFilter, statusFilter, sortBy])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE
    return filteredUsers.slice(start, start + USERS_PER_PAGE)
  }, [filteredUsers, currentPage])

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1

  // Filtered Templates List
  const filteredTemplates = useMemo(() => {
    let result = [...customTemplates]
    if (templateStatusFilter !== "all") {
      result = result.filter((t) => t.status === templateStatusFilter)
    }
    if (templateCategoryFilter !== "all") {
      result = result.filter((t) => t.category === templateCategoryFilter)
    }
    return result
  }, [customTemplates, templateStatusFilter, templateCategoryFilter])

  // Unique categories for filtering
  const existingCategories = useMemo(() => {
    const set = new Set(customTemplates.map((t) => t.category).filter(Boolean))
    return Array.from(set)
  }, [customTemplates])

  // Filtered Scrapbook Items List
  const filteredScrapbook = useMemo(() => {
    let result = [...scrapbookItems]
    if (scrapbookSearch.trim()) {
      const q = scrapbookSearch.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
          (s.templateId && s.templateId.toLowerCase().includes(q))
      )
    }
    if (scrapbookSourceFilter !== "all") {
      result = result.filter((s) => s.source === scrapbookSourceFilter)
    }
    return result
  }, [scrapbookItems, scrapbookSearch, scrapbookSourceFilter])

  // Actions: User Role & Status Changes
  const handleToggleUserRole = (u: AdminUserRecord) => {
    const targetRole = u.role === "superadmin" ? "user" : "superadmin"
    setConfirmModal({
      isOpen: true,
      title: targetRole === "superadmin" ? "Promote User to Superadmin" : "Demote to Standard User",
      message: `Are you sure you want to change role for ${u.email} to '${targetRole}'? Superadmins have unrestricted platform control.`,
      confirmLabel: `Change Role to ${targetRole}`,
      confirmColor: targetRole === "superadmin" ? "stone" : "rose",
      onConfirm: async () => {
        const res = await updateAdminUserRole(u.id, targetRole, currentUser)
        if (res.success) {
          showToast(`Updated role for ${u.email}!`)
          loadDashboardData()
        } else {
          showToast(`Error: ${res.error}`)
        }
      },
    })
  }

  const handleToggleUserStatus = (u: AdminUserRecord) => {
    const targetStatus = u.status === "active" ? "suspended" : "active"
    setConfirmModal({
      isOpen: true,
      title: targetStatus === "suspended" ? "Suspend User Account" : "Activate User Account",
      message:
        targetStatus === "suspended"
          ? `Are you sure you want to suspend ${u.email}? They will not be able to log in or create photobooths.`
          : `Re-activate ${u.email}'s account access?`,
      confirmLabel: targetStatus === "suspended" ? "Suspend Account" : "Re-activate Account",
      confirmColor: targetStatus === "suspended" ? "rose" : "stone",
      onConfirm: async () => {
        const res = await updateAdminUserStatus(u.id, targetStatus, currentUser)
        if (res.success) {
          showToast(`Status updated for ${u.email}!`)
          loadDashboardData()
        } else {
          showToast(`Error: ${res.error}`)
        }
      },
    })
  }

  // Actions: Template Publishing Lifecycle
  const handlePublishTemplate = async (templateId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Publish Template to Users",
      message: `Publish "${name}"? It will immediately appear in the user-facing template catalog across Web and Android.`,
      confirmLabel: "Confirm & Publish 🚀",
      confirmColor: "stone",
      onConfirm: async () => {
        const res = await publishCustomTemplate(templateId, currentUser)
        if (res.success) {
          showToast(`🎉 "${name}" is now live!`)
          loadDashboardData()
        } else {
          showToast(`Publish failed: ${res.error}`)
        }
      },
    })
  }

  const handleUnpublishTemplate = async (templateId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Unpublish Template",
      message: `Revert "${name}" to draft? It will be removed from public user discovery.`,
      confirmLabel: "Revert to Draft",
      confirmColor: "rose",
      onConfirm: async () => {
        const res = await unpublishCustomTemplate(templateId, currentUser)
        if (res.success) {
          showToast(`Reverted "${name}" to draft.`)
          loadDashboardData()
        }
      },
    })
  }

  const handleArchiveTemplate = async (templateId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Archive Template",
      message: `Archive "${name}"? Archived templates remain in history but are hidden from the normal catalog.`,
      confirmLabel: "Archive Template",
      confirmColor: "stone",
      onConfirm: async () => {
        const res = await archiveCustomTemplate(templateId, currentUser)
        if (res.success) {
          showToast(`Archived "${name}".`)
          loadDashboardData()
        }
      },
    })
  }

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently Delete Template",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete Permanently",
      confirmColor: "rose",
      onConfirm: async () => {
        const res = await deleteCustomTemplate(templateId, currentUser)
        if (res.success) {
          showToast(`Deleted "${name}".`)
          loadDashboardData()
        }
      },
    })
  }

  const handleDuplicateTemplate = async (templateId: string) => {
    const res = await duplicateCustomTemplate(templateId, currentUser)
    if (res.success) {
      showToast("Template duplicated! Ready to edit in Studio.")
      loadDashboardData()
    }
  }

  // Moderation: Delete Photo
  const handleDeletePhoto = (photoId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Moderate / Delete Photo Keepsake",
      message: `Permanently delete photo "${title}" (ID: ${photoId})? This removes it from cloud storage and the user's gallery.`,
      confirmLabel: "Delete Prohibited Photo",
      confirmColor: "rose",
      onConfirm: async () => {
        const res = await deletePhotoAsAdmin(photoId)
        if (res.success) {
          showToast("Photo removed from database.")
          loadDashboardData()
        } else {
          showToast(`Error: ${res.error}`)
        }
      },
    })
  }

  // Convert any Scrapbook Keepsake or Project into a Live Template in Visual Studio
  const handleConvertScrapbookToTemplate = (item: ScrapbookItemRecord) => {
    // 1. Resolve composition and base template definition
    const comp = item.composition
    const tid = comp?.templateId || item.templateId || "four-cut"
    const baseTmpl = getTemplate(tid) || templates[0]

    // 2. Build clean template slots (strip previous user photos so others can capture fresh photos)
    const slots: Slot[] = baseTmpl.slots?.length
      ? baseTmpl.slots.map((s) => ({ ...s }))
      : [
          { x: 30, y: 30, width: 340, height: 230, radius: 4 },
          { x: 30, y: 280, width: 340, height: 230, radius: 4 },
          { x: 30, y: 530, width: 340, height: 230, radius: 4 },
          { x: 30, y: 780, width: 340, height: 230, radius: 4 },
        ]

    const photoCount = (baseTmpl.count || slots.length || 4) as PhotoCount

    // 3. Extract decorative elements from composition (stickers, texts, frame, background)
    const stickers = comp?.stickers ? comp.stickers.map((s) => ({ ...s })) : []
    const texts = comp?.texts ? comp.texts.map((t) => ({ ...t })) : []
    const background = comp?.background || baseTmpl.background || "#ffffff"
    const backgroundPattern = comp?.backgroundPattern || baseTmpl.backgroundPattern
    const backgroundOpacity = comp?.backgroundOpacity ?? 1
    const frameId = comp?.frameId || baseTmpl.frameId
    const frameColor = comp?.frameColor || baseTmpl.frameColor
    const frameOpacity = comp?.frameOpacity ?? 1
    const frameTransform = comp?.frameTransform

    // 4. Create custom template draft
    const cleanTitle = item.title.replace(/\s*\(Template\)$/i, "").replace(/\s*\(Studio Keep\)$/i, "")
    const newTemplateDraft: CustomTemplateRecord = {
      id: `tmpl-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${cleanTitle} (Template)`,
      description: `Converted from Scrapbook keepsake (${new Date(item.date).toLocaleDateString()}). Preserves custom layout, decorations, and styling.`,
      category: baseTmpl.category || "Scrapbook Specials",
      tags: ["scrapbook-remix", "admin-curated", baseTmpl.category?.toLowerCase() || "custom"],
      version: 1,
      thumbnailUrl: item.imageUrl || baseTmpl.thumbnail,
      width: baseTmpl.width || 800,
      height: baseTmpl.height || 1200,
      aspectRatio: baseTmpl.orientation || "portrait",
      orientation: baseTmpl.orientation || "portrait",
      photoCount: photoCount,
      slots: slots,
      background: background,
      backgroundPattern: backgroundPattern,
      backgroundOpacity: backgroundOpacity,
      accent: baseTmpl.accent || "#ff6b8b",
      frameId: frameId,
      frameColor: frameColor,
      frameOpacity: frameOpacity,
      frameTransform: frameTransform,
      stickers: stickers,
      texts: texts,
      status: "draft",
      createdBy: currentUser.email || "superadmin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 5. Connect to Studio & notify
    setSelectedTemplateForStudio(newTemplateDraft)
    setActiveTab("studio")
    showToast(`🎨 Loaded "${newTemplateDraft.name}" into Studio! Ready to customize & publish.`)
  }

  // Switch to Studio with selected template
  const handleEditInStudio = (tmpl: CustomTemplateRecord) => {
    setSelectedTemplateForStudio(tmpl)
    setActiveTab("studio")
  }

  // Switch to Studio with blank new template
  const handleCreateNewTemplate = () => {
    setSelectedTemplateForStudio(null)
    setActiveTab("studio")
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f6f0] text-stone-900 font-mono flex flex-col overflow-hidden animate-fade-in">
      {/* 1. MASTER CONTROL TOP BAR */}
      <header className="px-4 sm:px-6 py-3 bg-[#faf8f0] border-b-2 border-stone-900 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-300 border-2 border-stone-900 flex items-center justify-center text-stone-950 font-bold shadow-[2px_2px_0_#171717]">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-stone-950 leading-tight">
                Little Moments — Master Control
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                Superadmin
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-mono">
              Central Platform Management & No-Code Visual Studio
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-200 p-0.5 rounded-xl border border-stone-300 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("master")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "master"
                  ? "bg-stone-900 text-amber-300 shadow-xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              <Users size={13} />
              <span>Master Control</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "templates"
                  ? "bg-stone-900 text-amber-300 shadow-xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              <Layers size={13} />
              <span>Templates ({customTemplates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scrapbook")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "scrapbook"
                  ? "bg-stone-900 text-amber-300 shadow-xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              <BookOpen size={13} />
              <span>Scrapbook ({scrapbookItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTemplateForStudio(null)
                setActiveTab("studio")
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "studio"
                  ? "bg-stone-900 text-amber-300 shadow-xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              <Sparkles size={13} />
              <span>Visual Studio</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-stone-300 hover:border-stone-900 text-stone-800 transition-all flex items-center gap-1 text-xs"
            title="Refresh database records"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-black text-white transition-all shadow-xs"
            title="Exit Admin Dashboard"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-mono shadow-xl border border-amber-300 flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "studio" ? (
          /* TAB 3: VISUAL TEMPLATE STUDIO */
          <VisualTemplateStudio
            initialTemplate={selectedTemplateForStudio}
            currentUser={currentUser}
            onBack={() => setActiveTab("templates")}
            onSaved={() => loadDashboardData()}
            onPublished={() => loadDashboardData()}
          />
        ) : (
          /* TAB 1 & 2: MASTER CONTROL & TEMPLATES CATALOG */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Real-time Central Platform Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border-2 border-stone-900 shadow-[3px_3px_0_#171717]">
                <span className="text-[10px] text-stone-500 font-bold block mb-1">TOTAL USERS</span>
                <span className="text-2xl font-bold text-stone-950 font-mono">{metrics.totalUsers}</span>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">Registered accounts</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border-2 border-stone-900 shadow-[3px_3px_0_#171717]">
                <span className="text-[10px] text-stone-500 font-bold block mb-1">ACTIVE USERS</span>
                <span className="text-2xl font-bold text-emerald-700 font-mono">{metrics.activeUsers}</span>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">Non-suspended</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border-2 border-stone-900 shadow-[3px_3px_0_#171717]">
                <span className="text-[10px] text-stone-500 font-bold block mb-1">TOTAL KEEPSAKES</span>
                <span className="text-2xl font-bold text-amber-700 font-mono">{metrics.totalPhotos}</span>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">Photos created</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border-2 border-stone-900 shadow-[3px_3px_0_#171717]">
                <span className="text-[10px] text-stone-500 font-bold block mb-1">PUBLISHED TEMPLATES</span>
                <span className="text-2xl font-bold text-stone-900 font-mono">{metrics.publishedTemplatesCount}</span>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">Live for users</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border-2 border-stone-900 shadow-[3px_3px_0_#171717] col-span-2 sm:col-span-1">
                <span className="text-[10px] text-stone-500 font-bold block mb-1">DATABASE HEALTH</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${metrics.dbOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  <span className="font-bold text-xs font-mono">{metrics.dbOnline ? "Postgres Online" : "Offline Cache"}</span>
                </div>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">Supabase Cloud</span>
              </div>
            </div>

            {/* TAB 1: MASTER CONTROL (USERS & AUDIT) */}
            {activeTab === "master" && (
              <div className="space-y-6">
                {/* User Directory Table Card */}
                <div className="bg-white rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0_#171717] p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                        <Users size={16} className="text-amber-600" />
                        <span>Registered User Accounts ({filteredUsers.length})</span>
                      </h2>
                      <p className="text-[11px] text-stone-500 font-mono">
                        Direct inspection, role-based controls, and security moderation
                      </p>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value)
                            setCurrentPage(1)
                          }}
                          placeholder="Search email or ID..."
                          className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs outline-none focus:border-stone-900 bg-stone-50"
                        />
                      </div>

                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          setRoleFilter(e.target.value as any)
                          setCurrentPage(1)
                        }}
                        className="py-1.5 px-2.5 rounded-lg border border-stone-300 text-xs bg-white font-bold outline-none"
                      >
                        <option value="all">All Roles</option>
                        <option value="superadmin">Superadmins</option>
                        <option value="user">Users</option>
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value as any)
                          setCurrentPage(1)
                        }}
                        className="py-1.5 px-2.5 rounded-lg border border-stone-300 text-xs bg-white font-bold outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b-2 border-stone-200 text-stone-500 text-[10px] uppercase">
                          <th className="pb-2">User Email / Account ID</th>
                          <th className="pb-2">Role</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Registered</th>
                          <th className="pb-2">Photos</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-stone-400">
                              No matching user accounts found.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u) => {
                            const isCurrentAdmin = u.email === currentUser.email
                            return (
                              <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                                <td className="py-2.5 font-bold text-stone-900">
                                  <div className="flex flex-col">
                                    <span>{u.email}</span>
                                    <span className="text-[9px] text-stone-400 font-normal truncate max-w-[180px]">
                                      ID: {u.id}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.role === "superadmin"
                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                        : "bg-stone-100 text-stone-700 border border-stone-200"
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                                      u.status === "active"
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        u.status === "active" ? "bg-emerald-600" : "bg-rose-600"
                                      }`}
                                    />
                                    <span>{u.status}</span>
                                  </span>
                                </td>
                                <td className="py-2.5 text-stone-500 text-[11px]">
                                  {new Date(u.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="py-2.5 font-bold text-stone-800">{u.photoCount}</td>
                                <td className="py-2.5 text-right">
                                  {isCurrentAdmin ? (
                                    <span className="text-[10px] text-stone-400 font-bold">Current Account</span>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleUserRole(u)}
                                        className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold"
                                        title={u.role === "superadmin" ? "Demote to User" : "Promote to Superadmin"}
                                      >
                                        {u.role === "superadmin" ? "Demote" : "Promote"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleUserStatus(u)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                                          u.status === "active"
                                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                        }`}
                                      >
                                        {u.status === "active" ? "Suspend" : "Activate"}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                      <span className="text-stone-500 text-[11px]">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded border disabled:opacity-30"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1 rounded border disabled:opacity-30"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Moderation Grid & Audit Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Photo Strips (All Users) */}
                  <div className="bg-white rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0_#171717] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                        <ImageIcon size={14} className="text-amber-600" />
                        <span>Live Photo Keepsakes Moderation ({recentPhotos.length})</span>
                      </h3>
                      <span className="text-[10px] text-stone-400">All registered users</span>
                    </div>

                    <div className="space-y-2 max-h-[32vh] overflow-y-auto pr-1">
                      {recentPhotos.length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-400 font-mono">
                          No photos created yet.
                        </div>
                      ) : (
                        recentPhotos.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-3 bg-stone-50/50"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                onClick={() => setPreviewPhotoUrl(p.imageUrl)}
                                className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                title="Click to inspect photo"
                              />
                              <div className="min-w-0 text-[11px]">
                                <strong className="font-bold text-stone-900 block truncate max-w-[180px]">
                                  {p.title}
                                </strong>
                                <span className="text-stone-500 text-[9.5px] block truncate">
                                  {p.userEmail || p.userId}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const matchingScrapbook = scrapbookItems.find((s) => s.id === p.id) || {
                                    id: p.id,
                                    title: p.title || "Cloud Keepsake",
                                    date: p.createdAt || new Date().toISOString(),
                                    imageUrl: p.imageUrl,
                                    source: "cloud" as const,
                                    userEmail: p.userEmail || undefined,
                                    templateId: p.templateId,
                                  }
                                  handleConvertScrapbookToTemplate(matchingScrapbook)
                                }}
                                className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-stone-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1 transition-all active:scale-95"
                                title="Open this keepsake in Visual Studio to convert it into a reusable user template"
                              >
                                <Wand2 size={11} className="text-amber-700" />
                                <span>Open in Studio</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(p.id, p.title)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:border-rose-300 border border-transparent transition-colors"
                                title="Delete prohibited photo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Security Audit Log */}
                  <div className="bg-white rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0_#171717] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                        <FileText size={14} className="text-amber-600" />
                        <span>Security & Administrative Audit Logs</span>
                      </h3>
                      <span className="text-[10px] text-stone-400">Immutable trail</span>
                    </div>

                    <div className="space-y-2 max-h-[32vh] overflow-y-auto pr-1 text-[11px] font-mono">
                      {auditLogs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-400 font-mono">
                          No administrative actions logged yet.
                        </div>
                      ) : (
                        auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-start justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-stone-900 block">{log.action}</span>
                              <span className="text-stone-500 text-[10px] block">
                                Target: {log.targetType} ({log.targetId.slice(0, 16)}...)
                              </span>
                              <span className="text-stone-400 text-[9px] block">
                                By {log.adminEmail} · {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEMPLATE MANAGER */}
            {activeTab === "templates" && (
              <div className="space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0_#171717] p-4">
                  <div>
                    <h2 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                      <Layers size={16} className="text-amber-600" />
                      <span>Visual Template CMS & Published Catalog</span>
                    </h2>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Create, publish, duplicate, or unpublish templates for all users
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter */}
                    <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border text-xs">
                      {(["all", "published", "draft", "archived"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setTemplateStatusFilter(st)}
                          className={`px-2.5 py-1 rounded capitalize font-bold ${
                            templateStatusFilter === st
                              ? "bg-stone-900 text-white shadow-xs"
                              : "text-stone-600 hover:text-stone-900"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateNewTemplate}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#d97762] active:scale-95"
                    >
                      <Plus size={14} />
                      <span>+ Create Template</span>
                    </button>
                  </div>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTemplates.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-stone-300 text-stone-400">
                      <Sparkles size={32} className="mx-auto mb-2 text-stone-300" />
                      <p className="font-bold">No custom templates found in this view.</p>
                      <button
                        type="button"
                        onClick={handleCreateNewTemplate}
                        className="mt-3 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs"
                      >
                        Create First Template
                      </button>
                    </div>
                  ) : (
                    filteredTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white rounded-2xl border-2 border-stone-900 shadow-[3px_3px_0_#171717] overflow-hidden flex flex-col justify-between"
                      >
                        {/* Cover Preview Image */}
                        <div
                          onClick={() => handleEditInStudio(t)}
                          className="aspect-[4/5] bg-stone-100 border-b-2 border-stone-900 p-3 flex items-center justify-center cursor-pointer group relative overflow-hidden"
                        >
                          {t.thumbnailUrl ? (
                            <img
                              src={t.thumbnailUrl}
                              alt={t.name}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <span className="font-bold text-stone-400 text-xs">{t.photoCount}-Cut Strip</span>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold tracking-wider shadow-xs ${
                                t.status === "published"
                                  ? "bg-emerald-500 text-white"
                                  : t.status === "draft"
                                    ? "bg-amber-400 text-stone-950"
                                    : "bg-stone-500 text-white"
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>

                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-stone-900/80 text-white text-[9px] font-bold">
                            v{t.version}
                          </span>
                        </div>

                        {/* Card Meta & Actions */}
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-amber-700 font-bold block uppercase truncate">
                              {t.category}
                            </span>
                            <strong className="font-bold text-stone-950 block truncate text-sm">
                              {t.name}
                            </strong>
                            <p className="text-stone-500 text-[10px] line-clamp-1 mt-0.5">
                              {t.description || `${t.photoCount} photo slots · ${t.aspectRatio}`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditInStudio(t)}
                              className="px-2.5 py-1 rounded bg-stone-900 text-amber-300 font-bold text-[10.5px] flex items-center gap-1"
                            >
                              <Edit3 size={11} />
                              <span>Edit</span>
                            </button>

                            <div className="flex items-center gap-1">
                              {t.status === "published" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnpublishTemplate(t.id, t.name)}
                                  className="px-2 py-1 rounded border border-stone-300 hover:border-stone-900 text-[10.5px] font-bold"
                                  title="Revert to Draft"
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePublishTemplate(t.id, t.name)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold flex items-center gap-1"
                                  title="Publish to Users"
                                >
                                  <Send size={10} />
                                  <span>Publish</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDuplicateTemplate(t.id)}
                                className="p-1 rounded text-stone-600 hover:text-stone-900"
                                title="Duplicate template"
                              >
                                <Copy size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(t.id, t.name)}
                                className="p-1 rounded text-rose-600 hover:text-rose-800"
                                title="Delete template"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SCRAPBOOK & CREATIONS (CONVERT TO TEMPLATE) */}
            {activeTab === "scrapbook" && (
              <div className="space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0_#171717] p-4">
                  <div>
                    <h2 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                      <BookOpen size={16} className="text-amber-600" />
                      <span>Scrapbook & Creations — Template Conversion Hub</span>
                    </h2>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Convert finished scrapbook keepsakes, photobooth strips, and studio projects into reusable public templates
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Source Filter */}
                    <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border text-xs">
                      {(["all", "cloud", "studio-idb", "local"] as const).map((src) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setScrapbookSourceFilter(src)}
                          className={`px-2.5 py-1 rounded font-bold capitalize ${
                            scrapbookSourceFilter === src
                              ? "bg-stone-900 text-white shadow-xs"
                              : "text-stone-600 hover:text-stone-900"
                          }`}
                        >
                          {src === "all" ? "All Sources" : src === "cloud" ? "Cloud DB" : src === "studio-idb" ? "Studio IDB" : "Local App"}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        value={scrapbookSearch}
                        onChange={(e) => setScrapbookSearch(e.target.value)}
                        placeholder="Search creations..."
                        className="pl-7 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Scrapbook Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredScrapbook.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-stone-300 text-stone-400">
                      <BookOpen size={32} className="mx-auto mb-2 text-stone-300" />
                      <p className="font-bold">No scrapbook creations found matching filter.</p>
                      <p className="text-xs text-stone-400 mt-1">
                        Any photo strips created in the Booth or Studio can be loaded here and converted to public templates!
                      </p>
                    </div>
                  ) : (
                    filteredScrapbook.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border-2 border-stone-900 shadow-[3px_3px_0_#171717] overflow-hidden flex flex-col justify-between group"
                      >
                        {/* Cover Image Preview */}
                        <div
                          onClick={() => item.imageUrl && setPreviewPhotoUrl(item.imageUrl)}
                          className="aspect-[4/5] bg-stone-100 border-b-2 border-stone-900 p-2.5 flex items-center justify-center cursor-pointer relative overflow-hidden group-hover:bg-amber-50/50 transition-colors"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="max-h-full max-w-full object-contain rounded shadow-xs group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon size={28} className="mx-auto text-stone-300 mb-1" />
                              <span className="font-bold text-stone-400 text-xs">{item.title}</span>
                            </div>
                          )}

                          {/* Source Badge */}
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold tracking-wider shadow-xs ${
                                item.source === "cloud"
                                  ? "bg-purple-600 text-white"
                                  : item.source === "studio-idb"
                                    ? "bg-amber-500 text-stone-950"
                                    : "bg-emerald-600 text-white"
                              }`}
                            >
                              {item.source === "cloud" ? "Cloud Keepsake" : item.source === "studio-idb" ? "Studio Project" : "Local Keepsake"}
                            </span>
                          </div>

                          {/* Inspect Overlay Icon */}
                          <span className="absolute bottom-2 right-2 p-1 rounded-lg bg-stone-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye size={12} />
                          </span>
                        </div>

                        {/* Card Meta & Open in Studio Button */}
                        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {item.photoCount ? (
                                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[9.5px] font-bold border border-stone-200">
                                  {item.photoCount}-Cut
                                </span>
                              ) : null}
                              {item.stickerCount ? (
                                <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 text-[9.5px] font-bold border border-pink-200">
                                  ★ {item.stickerCount} stickers
                                </span>
                              ) : null}
                              {item.textCount ? (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9.5px] font-bold border border-blue-200">
                                  T {item.textCount} texts
                                </span>
                              ) : null}
                            </div>

                            <strong className="font-bold text-stone-950 block truncate text-sm" title={item.title}>
                              {item.title}
                            </strong>
                            <p className="text-stone-500 text-[10px] truncate mt-0.5">
                              {item.userEmail || "Superadmin Project"} · {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleConvertScrapbookToTemplate(item)}
                              className="w-full py-1.5 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_#d97762] active:scale-95 transition-all"
                              title="Open this scrapbook design in Visual Studio to customize and publish as a user template"
                            >
                              <Wand2 size={12} className="text-amber-400" />
                              <span>Open in Studio</span>
                            </button>
                            {item.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhotoUrl(item.imageUrl)}
                                className="p-1.5 rounded-xl border border-stone-300 hover:border-stone-900 text-stone-700 shrink-0"
                                title="Inspect high resolution photo"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#faf8f0] w-full max-w-md rounded-2xl border-2 border-stone-900 shadow-[8px_8px_0_#171717] p-5 flex flex-col space-y-3">
            <h3 className="font-bold text-sm text-stone-950">{confirmModal.title}</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-mono">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmModal.onConfirm()
                  setConfirmModal(null)
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs active:scale-95 ${
                  confirmModal.confirmColor === "rose"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-stone-900 hover:bg-black text-white"
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-md max-h-[90vh] bg-white p-2 rounded-xl border-2 border-stone-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg hover:scale-105"
            >
              <X size={16} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Full Preview"
              className="max-h-[85vh] w-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterControlDashboard
