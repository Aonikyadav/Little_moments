import type { Style, Template } from '../types'

export const CATEGORIES = [
  'Classic photo booth',
  'Korean four-cut',
  'Purikura',
  'Polaroid',
  'Retro film',
  'Vintage',
  'Minimalist',
  'Black & white',
  'Cute & romantic',
  'Couple',
  'Friends',
  'Birthday',
  'Travel',
  'Scrapbook',
  'Y2K',
  'Neon & cyber',
  'Seasonal',
  'Custom layouts',
] as const

export const PHOTO_COUNTS = [1, 2, 3, 4, 5, 6, 8, 9]

export const BASE_STYLE: Style = {
  bg: '#fffdf7',
  bg2: null,
  padding: 34,
  gap: 14,
  radius: 0,
  border: 0,
  borderColor: '#111111',
  shadow: false,
  decor: 'none',
  decorColor: '#111111',
  aspect: 1,
  footerText: '',
  footerFont: 'Figtree',
  footerColor: '#111111',
}

const st = (p: Partial<Style>): Style => ({ ...BASE_STYLE, ...p })

const L = {
  white: st({ footerColor: '#1a1a1a', footerFont: 'Special Elite', footerText: 'PHOTO BOOTH · {date}' }),
  black: st({ bg: '#171717', footerColor: '#f2efe6', footerFont: 'Special Elite', footerText: 'PHOTO BOOTH · {date}' }),
  pink4: st({ bg: '#ffd9e2', radius: 12, gap: 12, padding: 28, decor: 'hearts', decorColor: '#ff9db5', footerColor: '#8a3350', footerFont: 'Pacifico', footerText: 'four cuts · {date}' }),
  cream4: st({ bg: '#f3ead8', radius: 6, gap: 12, padding: 30, footerColor: '#5c4a33', footerFont: 'Playfair Display', footerText: '{date}' }),
  sky4: st({ bg: '#cfe6f7', bg2: '#eaf4fb', radius: 10, gap: 12, padding: 28, decor: 'dots', decorColor: '#ffffff', footerColor: '#2c5a80', footerFont: 'Kalam', footerText: 'smile · {date}' }),
  purikura: st({ bg: '#ffd6f0', bg2: '#c8e6ff', radius: 22, border: 8, borderColor: '#ffffff', gap: 16, padding: 30, shadow: true, decor: 'stars', decorColor: '#ffffff', footerColor: '#a23d86', footerFont: 'Pacifico', footerText: '*:･ﾟ✧ {date}' }),
  polaroid: st({ bg: '#fbfaf6', padding: 38, gap: 18, shadow: true, footerColor: '#2b2b2b', footerFont: 'Caveat', footerText: '{date}' }),
  polaroidWarm: st({ bg: '#f4ead6', padding: 38, gap: 18, shadow: true, footerColor: '#4a3a28', footerFont: 'Caveat', footerText: 'good times' }),
  film: st({ bg: '#1a1a1a', padding: 44, gap: 16, decor: 'film', decorColor: '#f2efe6', footerColor: '#e9c46a', footerFont: 'Special Elite', footerText: 'KODAK-ish 400 · {date}' }),
  vintage: st({ bg: '#e8d9b8', padding: 36, gap: 14, border: 6, borderColor: '#fffaf0', shadow: true, footerColor: '#4a3a28', footerFont: 'Playfair Display', footerText: 'Est. {date}' }),
  minimal: st({ bg: '#ffffff', padding: 40, gap: 20, footerColor: '#222222', footerFont: 'Figtree', footerText: '{date}' }),
  minimalGrey: st({ bg: '#ecebe8', padding: 40, gap: 18, footerColor: '#333333', footerFont: 'Figtree', footerText: '{date}' }),
  bw: st({ bg: '#ffffff', padding: 34, gap: 12, border: 2, borderColor: '#111111', footerColor: '#111111', footerFont: 'Playfair Display', footerText: 'NOIR · {date}' }),
  bwDark: st({ bg: '#0d0d0d', padding: 34, gap: 12, border: 2, borderColor: '#f2efe6', footerColor: '#f2efe6', footerFont: 'Playfair Display', footerText: 'NOIR · {date}' }),
  cute: st({ bg: '#ffe3ec', radius: 18, border: 6, borderColor: '#ffffff', gap: 16, padding: 30, shadow: true, decor: 'hearts', decorColor: '#ff8fab', footerColor: '#d1456b', footerFont: 'Pacifico', footerText: 'love · {date}' }),
  couple: st({ bg: '#fde8e4', bg2: '#f6c1c9', radius: 8, gap: 14, padding: 32, decor: 'hearts', decorColor: '#ffffff', footerColor: '#8f2f45', footerFont: 'Playfair Display', footerText: 'us · {date}' }),
  friends: st({ bg: '#fff3b0', radius: 4, border: 5, borderColor: '#111111', gap: 14, padding: 30, decor: 'dots', decorColor: '#ffcf33', footerColor: '#111111', footerFont: 'Kalam', footerText: 'best friends · {date}' }),
  birthday: st({ bg: '#ffe9a8', bg2: '#ffc9d6', radius: 10, gap: 14, padding: 30, decor: 'confetti', decorColor: '#e63946', footerColor: '#7a1f3d', footerFont: 'Pacifico', footerText: 'Happy Birthday!' }),
  travel: st({ bg: '#f1e3c8', padding: 34, gap: 16, border: 8, borderColor: '#ffffff', shadow: true, decor: 'grid', decorColor: '#c9b48a', footerColor: '#3a5a4a', footerFont: 'Caveat', footerText: 'wish you were here' }),
  scrap: st({ bg: '#dccdb0', padding: 40, gap: 26, border: 10, borderColor: '#fffdf5', shadow: true, decor: 'tape', decorColor: '#e9c46a', footerColor: '#4a3a28', footerFont: 'Caveat', footerText: 'remember this · {date}' }),
  y2k: st({ bg: '#b8f1ff', bg2: '#f7b8ff', radius: 12, border: 6, borderColor: '#ffffff', gap: 14, padding: 30, shadow: true, decor: 'stars', decorColor: '#ffffff', footerColor: '#3a1c71', footerFont: 'Pacifico', footerText: 'y2k · {date}' }),
  neon: st({ bg: '#0a0a1a', radius: 6, border: 4, borderColor: '#00f0ff', gap: 18, padding: 36, decor: 'neon', decorColor: '#00f0ff', footerColor: '#ff3cac', footerFont: 'Special Elite', footerText: 'NIGHT MODE · {date}' }),
  winter: st({ bg: '#dff1ff', bg2: '#f4faff', radius: 8, gap: 14, padding: 30, decor: 'snow', decorColor: '#ffffff', footerColor: '#2c5a80', footerFont: 'Pacifico', footerText: "Season's greetings" }),
  autumn: st({ bg: '#f2c48d', bg2: '#e8a56a', radius: 6, gap: 14, padding: 30, decor: 'checker', decorColor: '#ffffff', footerColor: '#5a2c10', footerFont: 'Playfair Display', footerText: 'autumn · {date}' }),
  checker: st({ bg: '#f5f5f5', padding: 34, gap: 14, border: 3, borderColor: '#111111', decor: 'checker', decorColor: '#111111', footerColor: '#111111', footerFont: 'Special Elite', footerText: 'DINER · {date}' }),
}

type Frs = Template['frs']

const grid = (c: number, r: number): Frs => {
  const a: Frs = []
  for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) a.push([i / c, j / r, 1 / c, 1 / r])
  return a
}

interface O {
  sw?: number
  sh?: number
  footer?: number
  fs?: number
  filter?: string
  pop?: number
}

let counter = 0
const hash = (s: string) => {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function toneOf(bg: string): Template['tone'] {
  const n = parseInt(bg.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  if (lum < 80) return 'dark'
  if (Math.max(r, g, b) - Math.min(r, g, b) > 28) return 'color'
  return 'light'
}

function build(id: string, name: string, cats: string[], count: number, frs: Frs, iw: number, ih: number, look: Style, o: O = {}): Template {
  const footer = o.footer ?? (look.footerText ? 120 : 0)
  return {
    id,
    name,
    cats,
    count,
    w: iw + look.padding * 2,
    h: ih + look.padding * 2 + footer,
    frs,
    footer,
    footerSize: o.fs ?? 38,
    look,
    defaultFilter: o.filter ?? 'original',
    pop: o.pop ?? 40 + (hash(id) % 56),
    added: counter++,
    tone: toneOf(look.bg),
  }
}

function gridT(id: string, name: string, cats: string[], c: number, r: number, look: Style, o: O = {}) {
  const sw = o.sw ?? 400
  const sh = o.sh ?? 300
  return build(id, name, cats, c * r, grid(c, r), c * sw + (c - 1) * look.gap, r * sh + (r - 1) * look.gap, look, o)
}

function custom(id: string, name: string, cats: string[], frs: Frs, iw: number, ih: number, look: Style, o: O = {}) {
  return build(id, name, cats, frs.length, frs, iw, ih, look, o)
}

const third = 1 / 3

export const TEMPLATES: Template[] = [
  // ---- 1 photo
  custom('t1-polaroid', 'Polaroid Classic', ['Polaroid', 'Minimalist'], [[0, 0, 1, 1]], 620, 620, L.polaroid, { footer: 170, fs: 64, pop: 98 }),
  custom('t1-polaroid-warm', 'Polaroid Sepia', ['Polaroid', 'Vintage'], [[0, 0, 1, 1]], 620, 620, L.polaroidWarm, { footer: 170, fs: 64, filter: 'vintage' }),
  custom('t1-portrait', 'Single Portrait', ['Classic photo booth', 'Minimalist'], [[0, 0, 1, 1]], 600, 780, L.white, { footer: 100 }),
  custom('t1-film', 'Film Frame', ['Retro film'], [[0, 0, 1, 1]], 640, 480, L.film, { filter: 'retro' }),
  custom('t1-noir', 'Noir Portrait', ['Black & white'], [[0, 0, 1, 1]], 600, 780, L.bwDark, { filter: 'bw', footer: 100 }),
  custom('t1-cute', 'Heart Card', ['Cute & romantic'], [[0, 0, 1, 1]], 600, 700, L.cute, { footer: 120, fs: 52 }),
  custom('t1-postcard', 'Postcard Moment', ['Travel'], [[0, 0, 1, 1]], 900, 620, L.travel, { footer: 110, fs: 56 }),
  custom('t1-birthday', 'Birthday Card', ['Birthday'], [[0, 0, 1, 1]], 620, 700, L.birthday, { footer: 130, fs: 58 }),
  custom('t1-scrap', 'Scrapbook Snapshot', ['Scrapbook'], [[0, 0, 1, 1]], 620, 620, L.scrap, { footer: 120, fs: 56 }),
  custom('t1-neon', 'Neon Sign', ['Neon & cyber'], [[0, 0, 1, 1]], 620, 700, L.neon, { filter: 'cinematic' }),
  custom('t1-y2k', 'Y2K Sticker', ['Y2K', 'Purikura'], [[0, 0, 1, 1]], 620, 700, L.y2k, { footer: 120, fs: 52 }),
  custom('t1-winter', 'Winter Card', ['Seasonal'], [[0, 0, 1, 1]], 620, 700, L.winter, { footer: 120, fs: 52, filter: 'cool' }),

  // ---- 2 photos
  gridT('t2-stack', 'Duo Stack', ['Classic photo booth', 'Friends', 'Couple'], 1, 2, L.white, { sw: 500, sh: 400, footer: 120 }),
  gridT('t2-side', 'Side by Side', ['Minimalist', 'Friends'], 2, 1, L.minimal, { sw: 420, sh: 560, footer: 90 }),
  gridT('t2-pola', 'Polaroid Pair', ['Polaroid', 'Couple'], 2, 1, L.polaroid, { sw: 400, sh: 420, footer: 150, fs: 56 }),
  gridT('t2-us', 'Us Two', ['Couple', 'Cute & romantic'], 1, 2, L.couple, { sw: 500, sh: 400, footer: 120, fs: 50 }),
  custom('t2-bigsmall', 'Big & Small', ['Custom layouts', 'Scrapbook'], [[0, 0, 1, 0.64], [0, 0.64, 1, 0.36]], 540, 700, L.vintage, { footer: 100 }),
  gridT('t2-film', 'Film Pair', ['Retro film', 'Black & white'], 1, 2, L.film, { sw: 440, sh: 330, footer: 100, filter: 'bw' }),
  gridT('t2-sparkle', 'Sparkle Duo', ['Purikura', 'Y2K'], 1, 2, L.purikura, { sw: 460, sh: 400, footer: 120, fs: 50 }),
  gridT('t2-travel', 'Travel Pair', ['Travel'], 2, 1, L.travel, { sw: 420, sh: 520, footer: 110, fs: 54 }),

  // ---- 3 photos
  gridT('t3-strip', 'Triple Strip', ['Classic photo booth', 'Black & white'], 1, 3, L.white, { sw: 500, sh: 380, footer: 130 }),
  gridT('t3-wide', 'Wide Triple', ['Minimalist', 'Travel'], 3, 1, L.minimal, { sw: 380, sh: 480, footer: 90 }),
  custom('t3-L', 'L Collage', ['Custom layouts', 'Scrapbook'], [[0, 0, 0.6, 1], [0.6, 0, 0.4, 0.5], [0.6, 0.5, 0.4, 0.5]], 900, 640, L.scrap, { footer: 120, fs: 52 }),
  gridT('t3-pastel', 'Three Cut Pastel', ['Korean four-cut', 'Cute & romantic'], 1, 3, L.pink4, { sw: 500, sh: 380, footer: 130, fs: 46 }),
  gridT('t3-trio', 'Best Trio', ['Friends', 'Birthday'], 3, 1, L.friends, { sw: 360, sh: 480, footer: 110, fs: 46 }),
  gridT('t3-neon', 'Neon Triple', ['Neon & cyber'], 1, 3, L.neon, { sw: 500, sh: 380, footer: 130, filter: 'cinematic' }),
  gridT('t3-y2k', 'Y2K Triple', ['Y2K', 'Purikura'], 1, 3, L.y2k, { sw: 500, sh: 380, footer: 130, fs: 46 }),
  custom('t3-hero', 'Hero & Pair', ['Custom layouts', 'Vintage'], [[0, 0, 1, 0.6], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]], 700, 760, L.vintage, { footer: 110, filter: 'vintage' }),

  // ---- 4 photos
  gridT('t4-classic', 'Classic Four Strip', ['Classic photo booth', 'Black & white'], 1, 4, L.white, { sw: 500, sh: 360, footer: 140 }),
  gridT('t4-classic-dark', 'Midnight Booth Strip', ['Classic photo booth', 'Black & white'], 1, 4, L.black, { sw: 500, sh: 360, footer: 140, filter: 'bw' }),
  gridT('t4-blush', 'Four-Cut Blush', ['Korean four-cut', 'Cute & romantic'], 1, 4, L.pink4, { sw: 500, sh: 370, footer: 140, fs: 46, pop: 99 }),
  gridT('t4-cream', 'Four-Cut Cream', ['Korean four-cut', 'Minimalist'], 1, 4, L.cream4, { sw: 500, sh: 370, footer: 130, fs: 44, pop: 94 }),
  gridT('t4-sky', 'Four-Cut Sky', ['Korean four-cut', 'Friends'], 1, 4, L.sky4, { sw: 500, sh: 370, footer: 140, fs: 46 }),
  gridT('t4-film', 'Film Roll Strip', ['Retro film'], 1, 4, L.film, { sw: 440, sh: 330, footer: 130, filter: 'retro', pop: 90 }),
  gridT('t4-vintage', 'Antique Strip', ['Vintage'], 1, 4, L.vintage, { sw: 500, sh: 360, footer: 130, filter: 'vintage' }),
  gridT('t4-grid', 'Quad Grid', ['Minimalist', 'Friends'], 2, 2, L.minimal, { sw: 420, sh: 420, footer: 100 }),
  gridT('t4-pola', 'Polaroid Quad', ['Polaroid'], 2, 2, L.polaroid, { sw: 400, sh: 400, footer: 120, fs: 52 }),
  custom('t4-feature', 'Feature + Three', ['Custom layouts', 'Travel'], [[0, 0, 1, 0.58], [0, 0.58, third, 0.42], [third, 0.58, third, 0.42], [2 * third, 0.58, third, 0.42]], 900, 780, L.travel, { footer: 110, fs: 52 }),
  gridT('t4-neon', 'Neon Four Strip', ['Neon & cyber'], 1, 4, L.neon, { sw: 500, sh: 360, footer: 140, filter: 'cinematic' }),
  gridT('t4-purikura', 'Sticker Booth Quad', ['Purikura', 'Y2K'], 2, 2, L.purikura, { sw: 420, sh: 420, footer: 120, fs: 50 }),
  gridT('t4-birthday', 'Party Strip', ['Birthday', 'Friends'], 1, 4, L.birthday, { sw: 500, sh: 360, footer: 140, fs: 52 }),
  gridT('t4-couple', 'Love Strip', ['Couple', 'Cute & romantic'], 1, 4, L.couple, { sw: 500, sh: 370, footer: 140, fs: 50 }),
  gridT('t4-winter', 'Winter Strip', ['Seasonal'], 1, 4, L.winter, { sw: 500, sh: 360, footer: 140, fs: 50, filter: 'cool' }),
  gridT('t4-autumn', 'Autumn Quad', ['Seasonal', 'Vintage'], 2, 2, L.autumn, { sw: 420, sh: 420, footer: 110, fs: 44, filter: 'warm' }),
  gridT('t4-scrap', 'Scrapbook Four', ['Scrapbook'], 2, 2, L.scrap, { sw: 400, sh: 400, footer: 130, fs: 50 }),
  gridT('t4-reel', 'Cinema Reel', ['Retro film', 'Travel'], 4, 1, L.film, { sw: 340, sh: 440, footer: 100, filter: 'retro' }),
  gridT('t4-noir', 'Noir Grid', ['Black & white'], 2, 2, L.bw, { sw: 420, sh: 420, footer: 110, filter: 'bw' }),
  gridT('t4-diner', 'Diner Strip', ['Classic photo booth', 'Vintage'], 1, 4, L.checker, { sw: 500, sh: 360, footer: 140 }),

  // ---- 5 photos
  custom('t5-two-three', 'Two over Three', ['Custom layouts', 'Friends'], [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, third, 0.5], [third, 0.5, third, 0.5], [2 * third, 0.5, third, 0.5]], 900, 640, L.friends, { footer: 110, fs: 46 }),
  custom('t5-hero', 'Hero + Four', ['Custom layouts', 'Travel', 'Scrapbook'], [[0, 0, 1, 0.5], [0, 0.5, 0.25, 0.5], [0.25, 0.5, 0.25, 0.5], [0.5, 0.5, 0.25, 0.5], [0.75, 0.5, 0.25, 0.5]], 960, 700, L.travel, { footer: 110, fs: 52 }),
  gridT('t5-strip', 'Long Five Strip', ['Classic photo booth', 'Minimalist'], 1, 5, L.white, { sw: 480, sh: 300, footer: 130 }),
  custom('t5-pastel', 'Five Cut Pastel', ['Korean four-cut', 'Cute & romantic'], [[0, 0, 0.5, third], [0.5, 0, 0.5, third], [0, third, 0.5, third], [0.5, third, 0.5, third], [0, 2 * third, 1, third]], 600, 900, L.pink4, { footer: 120, fs: 46 }),
  custom('t5-neon', 'Neon Five', ['Neon & cyber', 'Y2K'], [[0, 0, 1, 0.4], [0, 0.4, 0.5, 0.3], [0.5, 0.4, 0.5, 0.3], [0, 0.7, 0.5, 0.3], [0.5, 0.7, 0.5, 0.3]], 640, 900, L.neon, { filter: 'cinematic' }),

  // ---- 6 photos
  gridT('t6-strip', 'Long Six Strip', ['Classic photo booth'], 1, 6, L.white, { sw: 480, sh: 250, footer: 130 }),
  gridT('t6-23', 'Grid 2 x 3', ['Minimalist', 'Friends'], 2, 3, L.minimal, { sw: 400, sh: 340, footer: 100 }),
  gridT('t6-32', 'Grid 3 x 2', ['Travel', 'Minimalist'], 3, 2, L.travel, { sw: 340, sh: 400, footer: 110, fs: 52 }),
  gridT('t6-double', 'Double Four-Cut Strip', ['Korean four-cut', 'Cute & romantic'], 2, 3, L.pink4, { sw: 360, sh: 320, footer: 130, fs: 44, pop: 92 }),
  gridT('t6-film', 'Contact Sheet', ['Retro film', 'Black & white'], 2, 3, L.film, { sw: 380, sh: 290, footer: 110, filter: 'bw' }),
  gridT('t6-sticker', 'Sticker Sheet', ['Purikura', 'Y2K'], 2, 3, L.purikura, { sw: 380, sh: 340, footer: 120, fs: 48 }),
  gridT('t6-scrap', 'Scrapbook Six', ['Scrapbook', 'Vintage'], 2, 3, L.scrap, { sw: 360, sh: 300, footer: 120, fs: 48 }),
  gridT('t6-party', 'Party Six', ['Birthday', 'Friends'], 3, 2, L.birthday, { sw: 340, sh: 400, footer: 120, fs: 52 }),
  gridT('t6-couple', 'Love Story Six', ['Couple'], 2, 3, L.couple, { sw: 380, sh: 340, footer: 120, fs: 48 }),
  gridT('t6-snow', 'Snow Globe Six', ['Seasonal'], 3, 2, L.winter, { sw: 340, sh: 400, footer: 120, fs: 50, filter: 'cool' }),

  // ---- 8 photos
  gridT('t8-24', 'Double Strip Eight', ['Korean four-cut', 'Classic photo booth'], 2, 4, L.cream4, { sw: 360, sh: 280, footer: 120, fs: 44 }),
  gridT('t8-42', 'Grid 4 x 2', ['Minimalist', 'Travel'], 4, 2, L.minimal, { sw: 320, sh: 400, footer: 100 }),
  gridT('t8-neon', 'Neon Eight', ['Neon & cyber', 'Y2K'], 2, 4, L.neon, { sw: 360, sh: 280, footer: 120, filter: 'cinematic' }),
  gridT('t8-film', 'Film Rolls Eight', ['Retro film'], 2, 4, L.film, { sw: 340, sh: 260, footer: 110, filter: 'retro' }),
  gridT('t8-cute', 'Cute Collection Eight', ['Cute & romantic', 'Purikura'], 2, 4, L.cute, { sw: 360, sh: 280, footer: 120, fs: 46 }),
  gridT('t8-friends', 'Squad Eight', ['Friends', 'Birthday'], 4, 2, L.friends, { sw: 320, sh: 400, footer: 110, fs: 46 }),

  // ---- 9 photos
  gridT('t9-33', 'Grid 3 x 3', ['Minimalist', 'Friends'], 3, 3, L.minimal, { sw: 340, sh: 340, footer: 100 }),
  custom('t9-mosaic', 'Pyramid Mosaic', ['Custom layouts', 'Scrapbook'], [[0, 0, 0.6, third], [0.6, 0, 0.4, third], [0, third, third, third], [third, third, third, third], [2 * third, third, third, third], [0, 2 * third, 0.25, third], [0.25, 2 * third, 0.25, third], [0.5, 2 * third, 0.25, third], [0.75, 2 * third, 0.25, third]], 960, 900, L.scrap, { footer: 120, fs: 52 }),
  gridT('t9-pola', 'Polaroid Wall', ['Polaroid', 'Vintage'], 3, 3, L.polaroidWarm, { sw: 340, sh: 340, footer: 120, fs: 52 }),
  gridT('t9-y2k', 'Y2K Nine', ['Y2K', 'Purikura'], 3, 3, L.y2k, { sw: 340, sh: 340, footer: 120, fs: 48 }),
  gridT('t9-travel', 'Travel Diary Nine', ['Travel'], 3, 3, L.travel, { sw: 340, sh: 340, footer: 110, fs: 54 }),
  gridT('t9-noir', 'Noir Nine', ['Black & white'], 3, 3, L.bw, { sw: 340, sh: 340, footer: 100, filter: 'bw' }),
  gridT('t9-party', 'Party Nine', ['Birthday'], 3, 3, L.birthday, { sw: 340, sh: 340, footer: 120, fs: 52 }),
  gridT('t9-autumn', 'Autumn Nine', ['Seasonal', 'Vintage'], 3, 3, L.autumn, { sw: 340, sh: 340, footer: 110, fs: 44, filter: 'warm' }),
]

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id)

export const templatesForCount = (n: number) => TEMPLATES.filter((t) => t.count === n)

export const orientationOf = (t: Template): 'portrait' | 'landscape' | 'square' => {
  const r = t.w / t.h
  return r > 1.08 ? 'landscape' : r < 0.92 ? 'portrait' : 'square'
}

export function formatDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
