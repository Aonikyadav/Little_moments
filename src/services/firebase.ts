import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore"
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage"
import { dataUrlToBlob } from "../utils/photoTransfer"

export interface CloudPhotobooth {
  id: string
  userId: string
  isAnonymous: boolean
  userDisplayName?: string | null
  userEmail?: string | null
  imageUrl: string
  storagePath?: string
  createdAtMs: number
  title?: string
  templateId?: string
  aspectRatio?: string
  composition?: any
}

export interface FirebaseUserAccount {
  uid: string
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export interface FirebaseCredentials {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const STORAGE_KEY_CUSTOM_CONFIG = "lm_custom_firebase_config"

/**
 * Retrieves Firebase configuration from Vite environment variables or localStorage
 */
export function getFirebaseCredentials(): FirebaseCredentials | null {
  // 1. Check Vite Environment Variables
  const envConfig: FirebaseCredentials = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  }

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig
  }

  // 2. Check localStorage custom configuration
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_CONFIG)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.apiKey && parsed?.projectId) {
          return parsed as FirebaseCredentials
        }
      }
    } catch {
      // ignore
    }
  }

  return null
}

/**
 * Saves a user-provided Firebase configuration to localStorage
 */
export function saveCustomFirebaseCredentials(config: FirebaseCredentials): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CUSTOM_CONFIG, JSON.stringify(config))
    // Reset cached instances
    cachedApp = null
    cachedAuth = null
    cachedDb = null
    cachedStorage = null
  }
}

/**
 * Clears custom Firebase configuration from localStorage
 */
export function clearCustomFirebaseCredentials(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CONFIG)
    cachedApp = null
    cachedAuth = null
    cachedDb = null
    cachedStorage = null
  }
}

let cachedApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let cachedStorage: FirebaseStorage | null = null

/**
 * Checks if Firebase credentials are fully configured
 */
export function isFirebaseConfigured(): boolean {
  return getFirebaseCredentials() !== null
}

/**
 * Initializes and returns the Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp

  const credentials = getFirebaseCredentials()
  if (!credentials) return null

  try {
    if (!getApps().length) {
      cachedApp = initializeApp(credentials)
    } else {
      cachedApp = getApp()
    }
    return cachedApp
  } catch (err) {
    console.error("[Firebase] Initialization error:", err)
    return null
  }
}

/**
 * Returns the Firebase Auth instance
 */
export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth
  const app = getFirebaseApp()
  if (!app) return null
  try {
    cachedAuth = getAuth(app)
    return cachedAuth
  } catch (err) {
    console.error("[Firebase] Auth initialization error:", err)
    return null
  }
}

/**
 * Returns the Firestore instance
 */
export function getFirebaseFirestore(): Firestore | null {
  if (cachedDb) return cachedDb
  const app = getFirebaseApp()
  if (!app) return null
  try {
    cachedDb = getFirestore(app)
    return cachedDb
  } catch (err) {
    console.error("[Firebase] Firestore initialization error:", err)
    return null
  }
}

/**
 * Returns the Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage | null {
  if (cachedStorage) return cachedStorage
  const app = getFirebaseApp()
  if (!app) return null
  try {
    cachedStorage = getStorage(app)
    return cachedStorage
  } catch (err) {
    console.error("[Firebase] Storage initialization error:", err)
    return null
  }
}

/**
 * Subscribes to Auth state changes and automatically signs in anonymously
 * if no user session exists (Zero-Friction Guest Auth).
 */
export function initAuthListener(
  onUserChanged: (user: FirebaseUserAccount | null) => void,
): () => void {
  const auth = getFirebaseAuth()
  if (!auth) {
    onUserChanged(null)
    return () => {}
  }

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      onUserChanged({
        uid: firebaseUser.uid,
        isAnonymous: firebaseUser.isAnonymous,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      })
    } else {
      // Auto-sign in anonymously so every user immediately gets their own record
      try {
        const userCred = await signInAnonymously(auth)
        onUserChanged({
          uid: userCred.user.uid,
          isAnonymous: true,
          displayName: null,
          email: null,
          photoURL: null,
        })
      } catch (err) {
        console.warn("[Firebase] Anonymous sign-in notice:", err)
        onUserChanged(null)
      }
    }
  })

  return unsubscribe
}

/**
 * Signs in with Google Popup
 */
export async function signInWithGoogle(): Promise<{ success: boolean; user?: FirebaseUserAccount; error?: string }> {
  const auth = getFirebaseAuth()
  if (!auth) {
    return { success: false, error: "Firebase is not configured." }
  }

  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const result = await signInWithPopup(auth, provider)
    return {
      success: true,
      user: {
        uid: result.user.uid,
        isAnonymous: false,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      },
    }
  } catch (err: any) {
    console.error("[Firebase] Google sign-in error:", err)
    return {
      success: false,
      error: err.message || "Failed to sign in with Google",
    }
  }
}

/**
 * Signs out the current user
 */
export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) return
  try {
    await signOut(auth)
  } catch (err) {
    console.error("[Firebase] Sign-out error:", err)
  }
}

/**
 * Uploads photobooth strip to Firebase Cloud (Storage + Firestore Database)
 */
export async function savePhotoboothToCloud(
  exportId: string,
  dataUrl: string,
  metadata?: {
    title?: string
    templateId?: string
    aspectRatio?: string
    composition?: any
  },
): Promise<{ success: boolean; photo?: CloudPhotobooth; error?: string }> {
  const auth = getFirebaseAuth()
  const db = getFirebaseFirestore()
  const storage = getFirebaseStorage()

  if (!db) {
    return { success: false, error: "Firebase Firestore is not configured." }
  }

  try {
    let currentUser = auth?.currentUser
    if (!currentUser && auth) {
      try {
        const cred = await signInAnonymously(auth)
        currentUser = cred.user
      } catch {
        // continue
      }
    }

    const userId = currentUser ? currentUser.uid : "public_guest"
    const isAnonymous = currentUser ? currentUser.isAnonymous : true
    const userDisplayName = currentUser?.displayName || null
    const userEmail = currentUser?.email || null

    let finalImageUrl = dataUrl
    let storagePath: string | undefined

    // 1. Upload to Firebase Storage if configured
    if (storage) {
      try {
        const blob = dataUrlToBlob(dataUrl)
        storagePath = `photobooths/${userId}/${exportId}.png`
        const fileRef = storageRef(storage, storagePath)
        await uploadBytes(fileRef, blob, {
          contentType: "image/png",
          customMetadata: {
            exportId,
            userId,
            createdAt: new Date().toISOString(),
          },
        })
        finalImageUrl = await getDownloadURL(fileRef)
      } catch (storageErr) {
        console.warn("[Firebase] Storage upload failed, storing directly in Firestore:", storageErr)
      }
    }

    // 2. Save Document in Firestore Collection "photos"
    const photoDoc: CloudPhotobooth = {
      id: exportId,
      userId,
      isAnonymous,
      userDisplayName,
      userEmail,
      imageUrl: finalImageUrl,
      storagePath,
      createdAtMs: Date.now(),
      title: metadata?.title || "Little Moments Keepsake",
      templateId: metadata?.templateId,
      aspectRatio: metadata?.aspectRatio,
      composition: metadata?.composition,
    }

    const photoDocRef = doc(db, "photos", exportId)
    await setDoc(photoDocRef, {
      ...photoDoc,
      createdAt: serverTimestamp(),
    })

    // 3. Link to User's private creation history in "users/{userId}/creations"
    if (currentUser) {
      try {
        const userCreationRef = doc(db, "users", userId, "creations", exportId)
        await setDoc(userCreationRef, {
          id: exportId,
          imageUrl: finalImageUrl,
          title: photoDoc.title,
          createdAtMs: photoDoc.createdAtMs,
          createdAt: serverTimestamp(),
        })
      } catch {
        // non-blocking
      }
    }

    return { success: true, photo: photoDoc }
  } catch (err: any) {
    console.error("[Firebase] savePhotoboothToCloud error:", err)
    return { success: false, error: err.message || "Failed to save to cloud database." }
  }
}

/**
 * Retrieves a photobooth record from Firestore by its unique exportId
 */
export async function fetchPhotoboothFromCloud(
  exportId: string,
): Promise<{ success: boolean; photo?: CloudPhotobooth; error?: string }> {
  const db = getFirebaseFirestore()
  if (!db) {
    return { success: false, error: "Firebase Firestore is not configured." }
  }

  try {
    const photoDocRef = doc(db, "photos", exportId)
    const snapshot = await getDoc(photoDocRef)

    if (snapshot.exists()) {
      return { success: true, photo: snapshot.data() as CloudPhotobooth }
    } else {
      return { success: false, error: "Photo strip not found in cloud database." }
    }
  } catch (err: any) {
    console.error("[Firebase] fetchPhotoboothFromCloud error:", err)
    return { success: false, error: err.message || "Failed to fetch from cloud database." }
  }
}

/**
 * Retrieves all saved photobooths for the current user from Firestore
 */
export async function fetchUserCreations(
  userId: string,
): Promise<{ success: boolean; photos: CloudPhotobooth[]; error?: string }> {
  const db = getFirebaseFirestore()
  if (!db) {
    return { success: false, photos: [], error: "Firebase Firestore is not configured." }
  }

  try {
    const q = query(
      collection(db, "photos"),
      where("userId", "==", userId),
      orderBy("createdAtMs", "desc"),
    )
    const snapshot = await getDocs(q)
    const photos: CloudPhotobooth[] = []
    snapshot.forEach((d) => {
      photos.push(d.data() as CloudPhotobooth)
    })
    return { success: true, photos }
  } catch (err: any) {
    console.error("[Firebase] fetchUserCreations error:", err)
    return { success: false, photos: [], error: err.message }
  }
}
