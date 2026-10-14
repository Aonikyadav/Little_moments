export interface StickerPath {
  d: string
  /** c = sticker colour, w = white, k = ink, n = none */
  f: 'c' | 'w' | 'k' | 'n'
  s?: boolean
}

export interface StickerDef {
  id: string
  label: string
  group: string
  paths: StickerPath[]
}

const circ = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

const petals = [
  [50, 26],
  [72.8, 42.6],
  [64.1, 69.4],
  [35.9, 69.4],
  [27.2, 42.6],
]

export const STICKER_GROUPS = ['Love', 'Sparkle', 'Faces', 'Film', 'Doodles', 'Nature', 'Party'] as const

export const STICKERS: StickerDef[] = [
  { id: 'heart', label: 'Heart', group: 'Love', paths: [{ d: 'M50 88C20 66 8 48 8 32 8 18 19 10 30 10c9 0 16 5 20 12 4-7 11-12 20-12 11 0 22 8 22 22 0 16-12 34-42 56Z', f: 'c', s: true }] },
  { id: 'bow', label: 'Bow', group: 'Love', paths: [{ d: 'M46 58 34 90l12-8 4 8 4-8 12 8-12-32Z', f: 'c', s: true }, { d: 'M50 50C35 30 12 28 10 42c-2 16 20 24 40 10 20 14 42 6 40-10-2-14-25-12-40 8Z', f: 'c', s: true }, { d: circ(50, 50, 8), f: 'w', s: true }] },
  { id: 'flower', label: 'Flower', group: 'Love', paths: [...petals.map(([x, y]) => ({ d: circ(x, y, 16), f: 'c' as const, s: true })), { d: circ(50, 50, 11), f: 'w', s: true }] },
  { id: 'ring', label: 'Ring', group: 'Love', paths: [{ d: circ(50, 62, 26), f: 'n', s: true }, { d: 'M38 30 50 16 62 30 50 38Z', f: 'c', s: true }] },
  { id: 'star', label: 'Star', group: 'Sparkle', paths: [{ d: 'M50 8 61 38 93 39 67 59 76 90 50 72 24 90 33 59 7 39 39 38Z', f: 'c', s: true }] },
  { id: 'sparkle', label: 'Sparkle', group: 'Sparkle', paths: [{ d: 'M50 5C53 32 68 47 95 50 68 53 53 68 50 95 47 68 32 53 5 50 32 47 47 32 50 5Z', f: 'c', s: true }] },
  { id: 'bolt', label: 'Bolt', group: 'Sparkle', paths: [{ d: 'M58 6 22 56h24l-8 38 40-54H54Z', f: 'c', s: true }] },
  { id: 'burst', label: 'Burst', group: 'Sparkle', paths: [{ d: 'M50 6 58 28 78 14 74 38 96 38 78 54 94 70 70 68 72 92 54 78 46 96 38 78 20 90 26 68 4 62 22 48 8 30 30 34 28 10 44 26Z', f: 'c', s: true }] },
  { id: 'smiley', label: 'Smiley', group: 'Faces', paths: [{ d: circ(50, 50, 40), f: 'c', s: true }, { d: circ(36, 42, 5), f: 'k' }, { d: circ(64, 42, 5), f: 'k' }, { d: 'M30 60Q50 82 70 60', f: 'n', s: true }] },
  { id: 'cat', label: 'Cat', group: 'Faces', paths: [{ d: 'M18 30 34 42Q50 36 66 42L82 30 84 62Q84 88 50 88 16 88 16 62Z', f: 'c', s: true }, { d: circ(38, 58, 4), f: 'k' }, { d: circ(62, 58, 4), f: 'k' }, { d: 'M46 68Q50 72 54 68M50 66v4', f: 'n', s: true }] },
  { id: 'wink', label: 'Wink', group: 'Faces', paths: [{ d: circ(50, 50, 40), f: 'c', s: true }, { d: circ(36, 42, 5), f: 'k' }, { d: 'M58 42Q64 36 70 42', f: 'n', s: true }, { d: 'M32 60Q50 78 70 58', f: 'n', s: true }] },
  { id: 'film', label: 'Film', group: 'Film', paths: [{ d: 'M8 24h84v52H8Z', f: 'c', s: true }, { d: 'M15 29h7v7h-7ZM30 29h7v7h-7ZM45 29h7v7h-7ZM60 29h7v7h-7ZM75 29h7v7h-7ZM15 64h7v7h-7ZM30 64h7v7h-7ZM45 64h7v7h-7ZM60 64h7v7h-7ZM75 64h7v7h-7Z', f: 'w' }, { d: 'M14 42h72v16H14Z', f: 'w', s: true }] },
  { id: 'camera', label: 'Camera', group: 'Film', paths: [{ d: 'M10 32h20l6-10h28l6 10h20v48H10Z', f: 'c', s: true }, { d: circ(50, 56, 16), f: 'w', s: true }, { d: circ(50, 56, 6), f: 'k' }] },
  { id: 'tape', label: 'Tape', group: 'Film', paths: [{ d: 'M8 36 90 30 92 62 10 68Z', f: 'c', s: true }, { d: 'M8 36l5 6-3 6 4 6-4 6M90 30l-5 6 3 6-4 6 4 6', f: 'n', s: true }] },
  { id: 'polaroid', label: 'Frame', group: 'Film', paths: [{ d: 'M16 10h68v80H16Z', f: 'w', s: true }, { d: 'M24 18h52v52H24Z', f: 'c', s: true }] },
  { id: 'squiggle', label: 'Squiggle', group: 'Doodles', paths: [{ d: 'M8 60Q18 24 29 60T50 60 71 60 92 60', f: 'n', s: true }] },
  { id: 'arrow', label: 'Arrow', group: 'Doodles', paths: [{ d: 'M10 74Q40 20 82 36M62 20 84 37 58 52', f: 'n', s: true }] },
  { id: 'circle', label: 'Scribble ring', group: 'Doodles', paths: [{ d: 'M52 12C24 10 8 32 14 56 20 80 50 92 76 80 98 68 94 30 66 18 44 10 26 22 22 36', f: 'n', s: true }] },
  { id: 'pencil', label: 'Pencil', group: 'Doodles', paths: [{ d: 'M18 82 22 64 68 18 82 32 36 78Z', f: 'c', s: true }, { d: 'M62 24 76 38', f: 'n', s: true }] },
  { id: 'bubble', label: 'Speech', group: 'Doodles', paths: [{ d: 'M12 18h76v46H58L36 86V64H12Z', f: 'w', s: true }] },
  { id: 'sun', label: 'Sun', group: 'Nature', paths: [{ d: circ(50, 50, 18), f: 'c', s: true }, { d: 'M50 8v16M50 76v16M8 50h16M76 50h16M20 20l11 11M69 69l11 11M80 20 69 31M31 69 20 80', f: 'n', s: true }] },
  { id: 'moon', label: 'Moon', group: 'Nature', paths: [{ d: 'M62 10C36 14 20 36 22 60c2 22 22 34 44 30C46 82 40 62 44 44 48 28 54 18 62 10Z', f: 'c', s: true }] },
  { id: 'cloud', label: 'Cloud', group: 'Nature', paths: [{ d: 'M28 74C12 74 8 58 18 52 16 38 34 30 44 40 52 26 76 28 78 46 92 46 96 66 82 74Z', f: 'w', s: true }] },
  { id: 'snow', label: 'Snowflake', group: 'Nature', paths: [{ d: 'M50 8v84M14 29l72 42M14 71l72-42M42 14l8 8 8-8M42 86l8-8 8 8', f: 'n', s: true }] },
  { id: 'leaf', label: 'Leaf', group: 'Nature', paths: [{ d: 'M20 80C14 40 40 14 84 16 86 58 60 86 20 80Z', f: 'c', s: true }, { d: 'M20 80 56 44', f: 'n', s: true }] },
  { id: 'balloon', label: 'Balloon', group: 'Party', paths: [{ d: 'M50 8C76 8 82 34 70 54 64 64 56 68 50 70 44 68 36 64 30 54 18 34 24 8 50 8Z', f: 'c', s: true }, { d: 'M50 70Q42 80 52 94', f: 'n', s: true }] },
  { id: 'crown', label: 'Crown', group: 'Party', paths: [{ d: 'M12 74 16 30 36 52 50 24 64 52 84 30 88 74Z', f: 'c', s: true }] },
  { id: 'party', label: 'Party hat', group: 'Party', paths: [{ d: 'M50 10 80 84H20Z', f: 'c', s: true }, { d: circ(50, 10, 6), f: 'w', s: true }, { d: 'M34 56 66 56M28 70 72 70', f: 'n', s: true }] },
]

export const stickerById = (id: string) => STICKERS.find((s) => s.id === id)

export const STICKER_COLORS = ['#b4432b', '#e9a23b', '#4f6f58', '#35557c', '#d96c8e', '#7b5ea7', '#1d1c1a', '#ffffff']

export const TEXT_FONTS = [
  { id: 'Caveat', label: 'Handwritten' },
  { id: 'Kalam', label: 'Marker' },
  { id: 'Playfair Display', label: 'Serif' },
  { id: 'Figtree', label: 'Sans' },
  { id: 'Special Elite', label: 'Typewriter' },
  { id: 'Pacifico', label: 'Retro script' },
]
