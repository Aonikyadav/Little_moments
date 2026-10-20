import fs from 'node:fs'
import path from 'node:path'

const PACKS = [
  {
    slug: 'anime-ninja',
    title: 'Anime Ninja',
    description: 'Stealthy shinobi, chibi ninjas, red clouds, and martial action emblems',
  },
  {
    slug: 'coffee-scrapbook',
    title: 'Coffee & Scrapbook',
    description: 'Warm latte art, cafe typography, bows, baby breath bouquets, and vintage cameras',
  },
  {
    slug: 'maroon-romance',
    title: 'Maroon Romance',
    description: 'Deep rose bouquets, maroon velvet bows, heart locks, teacups, and floral lace',
  },
  {
    slug: 'midnight-bloom',
    title: 'Midnight Bloom',
    description: 'Crescent moons, purple floral clusters, gothic lace, starry quotes, and black cats',
  },
  {
    slug: 'midnight-bloom-vol2',
    title: 'Midnight Bloom Vol. 2',
    description: 'Moon mirrors, black candles, ornate charms, dark vintage books, and dark romance notes',
  },
  {
    slug: 'spider-hero',
    title: 'Spider Hero',
    description: 'Webs, spider emblems, comic panels, webbed hero poses, and comic action elements',
  },
]

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.length < 24) return { width: 100, height: 100 }
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return { width, height }
}

function toHumanTitle(fileName) {
  const base = path.basename(fileName, '.png')
  const withoutNum = base.replace(/^\d+[_\-\s]*/, '')
  const spaced = withoutNum.replace(/[_\-]+/g, ' ')
  return spaced
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function generateTags(name, packTitle) {
  const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const packWords = packTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  return Array.from(new Set([...words, ...packWords, 'sticker', 'png', 'transparent']))
}

const allStickers = []
const packDefinitions = []

for (const pack of PACKS) {
  const dir = path.join('public', 'stickers', pack.slug)
  if (!fs.existsSync(dir)) continue

  const files = fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .sort()

  let coverSrc = ''

  files.forEach((file, idx) => {
    const fullPath = path.join(dir, file)
    const { width, height } = readPngDimensions(fullPath)
    const name = toHumanTitle(file)
    const src = `/stickers/${pack.slug}/${file}`
    const id = `png-${pack.slug}-${String(idx + 1).padStart(2, '0')}`

    if (!coverSrc) {
      coverSrc = src
    }

    allStickers.push({
      id,
      name,
      pack: pack.title,
      packSlug: pack.slug,
      src,
      width,
      height,
      aspectRatio: Number((width / Math.max(1, height)).toFixed(3)),
      tags: generateTags(name, pack.title),
    })
  })

  packDefinitions.push({
    id: `pack-${pack.slug}`,
    slug: pack.slug,
    title: pack.title,
    description: pack.description,
    count: files.length,
    coverSrc,
  })
}

const tsContent = `// Automatically generated from extracted sticker packs
export interface PngStickerItem {
  id: string
  name: string
  pack: string
  packSlug: string
  src: string
  width: number
  height: number
  aspectRatio: number
  tags: string[]
}

export interface PngStickerPack {
  id: string
  slug: string
  title: string
  description: string
  count: number
  coverSrc: string
}

export const PNG_STICKER_PACKS: PngStickerPack[] = ${JSON.stringify(packDefinitions, null, 2)}

export const PNG_STICKERS: PngStickerItem[] = ${JSON.stringify(allStickers, null, 2)}

export function findPngSticker(id: string): PngStickerItem | undefined {
  return PNG_STICKERS.find((s) => s.id === id)
}

export function getStickersByPack(packSlug: string): PngStickerItem[] {
  if (!packSlug || packSlug === "all") return PNG_STICKERS
  return PNG_STICKERS.filter((s) => s.packSlug === packSlug)
}
`

fs.writeFileSync('src/data/pngStickers.ts', tsContent, 'utf-8')
console.log(`Generated src/data/pngStickers.ts with ${allStickers.length} stickers across ${packDefinitions.length} packs!`)
