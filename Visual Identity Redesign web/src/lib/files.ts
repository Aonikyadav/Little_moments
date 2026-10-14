import type { Photo } from '../types'
import { uid } from './design'
import { loadImage } from './render'

export const MAX_FILE_MB = 25
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']

export async function readImageFile(file: File): Promise<Photo> {
  if (!OK_TYPES.includes(file.type)) throw new Error(`“${file.name}” is not a supported image (use JPG, PNG, WebP, GIF or AVIF).`)
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`“${file.name}” is larger than ${MAX_FILE_MB} MB.`)
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('empty')
    return { id: uid('ph'), url, w: img.naturalWidth, h: img.naturalHeight, rev: 0 }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error(`“${file.name}” could not be read as an image.`)
  }
}

export async function readImageFiles(files: File[]): Promise<{ photos: Photo[]; errors: string[] }> {
  const photos: Photo[] = []
  const errors: string[] = []
  for (const f of files) {
    try {
      photos.push(await readImageFile(f))
    } catch (e) {
      errors.push(e instanceof Error ? e.message : `Could not read ${f.name}.`)
    }
  }
  return { photos, errors }
}
