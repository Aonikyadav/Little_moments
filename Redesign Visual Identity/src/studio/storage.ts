import type { Composition } from "../types"
export type ProjectRecord = {
  id: string
  date: string
  image: string
  composition: Composition
}
let database: Promise<IDBDatabase> | undefined
function db() {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("little-moments-studio", 1)
      request.onupgradeneeded = () =>
        request.result.createObjectStore("projects", { keyPath: "id" })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        database = undefined
        reject(request.error)
      }
    })
  return database
}
export async function saveProject(record: ProjectRecord) {
  const database = await db()
  await new Promise<void>((resolve, reject) => {
    const txn = database.transaction("projects", "readwrite")
    txn.objectStore("projects").put(record)
    txn.oncomplete = () => resolve()
    txn.onerror = () => reject(txn.error)
    txn.onabort = () => reject(txn.error)
  })
}
export async function loadProjects() {
  const database = await db()
  return new Promise<ProjectRecord[]>((resolve, reject) => {
    const r = database.transaction("projects").objectStore("projects").getAll()
    r.onsuccess = () => resolve(r.result as ProjectRecord[])
    r.onerror = () => reject(r.error)
  })
}
export async function removeProject(id: string) {
  const database = await db()
  await new Promise<void>((resolve, reject) => {
    const t = database.transaction("projects", "readwrite")
    t.objectStore("projects").delete(id)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}
