import type { Slot } from "../types"

export type AspectRatioId =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9"
  | "2:3"
  | "3:4"
  | "3:2"
  | "original"

export type AspectRatioInfo = {
  id: AspectRatioId
  label: string
  sublabel: string
  width: number
  height: number
  ratio: number // width / height
  iconType: "square" | "tall" | "story" | "wide"
}

export const ASPECT_RATIOS: AspectRatioInfo[] = [
  { id: "1:1", label: "1:1", sublabel: "Square · Feed", width: 1800, height: 1800, ratio: 1, iconType: "square" },
  { id: "4:5", label: "4:5", sublabel: "Portrait · IG", width: 1600, height: 2000, ratio: 0.8, iconType: "tall" },
  { id: "9:16", label: "9:16", sublabel: "Story · Reels", width: 1440, height: 2560, ratio: 9 / 16, iconType: "story" },
  { id: "16:9", label: "16:9", sublabel: "Landscape", width: 2560, height: 1440, ratio: 16 / 9, iconType: "wide" },
  { id: "2:3", label: "2:3", sublabel: "Classic Print", width: 1600, height: 2400, ratio: 2 / 3, iconType: "tall" },
  { id: "3:4", label: "3:4", sublabel: "Retro · Tablet", width: 1800, height: 2400, ratio: 3 / 4, iconType: "tall" },
  { id: "3:2", label: "3:2", sublabel: "Wide 6×4", width: 2400, height: 1600, ratio: 3 / 2, iconType: "wide" },
]

export type GridWireframeRect = {
  x: number
  y: number
  w: number
  h: number
}

export type GridLayout = {
  id: string
  name: string
  count: number
  description: string
  wireframe: GridWireframeRect[]
  getSlots: (spacing: number, padding: number) => Slot[]
}

// Helper to compute grid slots with variable spacing & padding
function computeEqualGrid(cols: number, rows: number, count: number, spacing: number, padding: number): Slot[] {
  const pad = Math.max(0, padding)
  const gap = Math.max(0, spacing)
  const availW = Math.max(10, 100 - pad * 2 - gap * (cols - 1))
  const slotW = availW / cols
  const availH = Math.max(10, 100 - pad * 2 - gap * (rows - 1))
  const slotH = availH / rows

  return Array.from({ length: count }, (_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    return {
      x: Number((pad + c * (slotW + gap)).toFixed(2)),
      y: Number((pad + r * (slotH + gap)).toFixed(2)),
      width: Number(slotW.toFixed(2)),
      height: Number(slotH.toFixed(2)),
      radius: 1.5,
    }
  })
}

export const GRID_LAYOUTS: GridLayout[] = [
  // --- 1 Photo ---
  {
    id: "grid-1-full",
    name: "Full Bleed",
    count: 1,
    description: "Seamless single photo spanning full canvas",
    wireframe: [{ x: 4, y: 4, w: 92, h: 92 }],
    getSlots: (_spacing, padding) => [
      {
        x: padding,
        y: padding,
        width: 100 - padding * 2,
        height: 100 - padding * 2,
        radius: 1,
      },
    ],
  },
  {
    id: "grid-1-framed",
    name: "Framed Center",
    count: 1,
    description: "Single photo with elegant white paper border",
    wireframe: [{ x: 14, y: 14, w: 72, h: 72 }],
    getSlots: (_spacing, padding) => [
      {
        x: Math.max(8, padding + 6),
        y: Math.max(8, padding + 6),
        width: 100 - Math.max(8, padding + 6) * 2,
        height: 100 - Math.max(8, padding + 6) * 2,
        radius: 2,
      },
    ],
  },

  // --- 2 Photos ---
  {
    id: "grid-2-cols",
    name: "2 Columns (Split)",
    count: 2,
    description: "Side-by-side vertical pair",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 92 },
      { x: 52, y: 4, w: 44, h: 92 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(2, 1, 2, spacing, padding),
  },
  {
    id: "grid-2-rows",
    name: "2 Rows (Stacked)",
    count: 2,
    description: "Top and bottom horizontal pair",
    wireframe: [
      { x: 4, y: 4, w: 92, h: 44 },
      { x: 4, y: 52, w: 92, h: 44 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(1, 2, 2, spacing, padding),
  },
  {
    id: "grid-2-hero-left",
    name: "Hero Left + Column",
    count: 2,
    description: "65% wide hero on left, 35% on right",
    wireframe: [
      { x: 4, y: 4, w: 58, h: 92 },
      { x: 66, y: 4, w: 30, h: 92 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availW = 100 - pad * 2 - gap
      const leftW = availW * 0.65
      const rightW = availW * 0.35
      const h = 100 - pad * 2
      return [
        { x: pad, y: pad, width: Number(leftW.toFixed(2)), height: h, radius: 1.5 },
        { x: pad + leftW + gap, y: pad, width: Number(rightW.toFixed(2)), height: h, radius: 1.5 },
      ]
    },
  },

  // --- 3 Photos ---
  {
    id: "grid-3-hero-left",
    name: "Hero Left (1 + 2)",
    count: 3,
    description: "1 large hero left, 2 stacked right",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 92 },
      { x: 52, y: 4, w: 44, h: 44 },
      { x: 52, y: 52, w: 44, h: 44 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availW = 100 - pad * 2 - gap
      const w = availW / 2
      const availH = 100 - pad * 2 - gap
      const h = availH / 2
      return [
        { x: pad, y: pad, width: Number(w.toFixed(2)), height: 100 - pad * 2, radius: 1.5 },
        { x: pad + w + gap, y: pad, width: Number(w.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad + w + gap, y: pad + h + gap, width: Number(w.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
      ]
    },
  },
  {
    id: "grid-3-hero-top",
    name: "Hero Top (1 + 2)",
    count: 3,
    description: "1 large wide top, 2 side-by-side bottom",
    wireframe: [
      { x: 4, y: 4, w: 92, h: 44 },
      { x: 4, y: 52, w: 44, h: 44 },
      { x: 52, y: 52, w: 44, h: 44 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availH = 100 - pad * 2 - gap
      const h = availH / 2
      const availW = 100 - pad * 2 - gap
      const w = availW / 2
      return [
        { x: pad, y: pad, width: 100 - pad * 2, height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad, y: pad + h + gap, width: Number(w.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad + w + gap, y: pad + h + gap, width: Number(w.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
      ]
    },
  },
  {
    id: "grid-3-cols",
    name: "3 Slices (Columns)",
    count: 3,
    description: "3 equal vertical photo strips",
    wireframe: [
      { x: 4, y: 4, w: 28, h: 92 },
      { x: 36, y: 4, w: 28, h: 92 },
      { x: 68, y: 4, w: 28, h: 92 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(3, 1, 3, spacing, padding),
  },

  // --- 4 Photos ---
  {
    id: "grid-4-equal",
    name: "2×2 Equal Quad",
    count: 4,
    description: "Classic balanced 4-cut quad layout",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 44 },
      { x: 52, y: 4, w: 44, h: 44 },
      { x: 4, y: 52, w: 44, h: 44 },
      { x: 52, y: 52, w: 44, h: 44 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(2, 2, 4, spacing, padding),
  },
  {
    id: "grid-4-hero-left",
    name: "1 Hero + 3 Stacked Right",
    count: 4,
    description: "Prominent left hero with 3 stacked photos (PicCollage favorite)",
    wireframe: [
      { x: 4, y: 4, w: 56, h: 92 },
      { x: 64, y: 4, w: 32, h: 28 },
      { x: 64, y: 36, w: 32, h: 28 },
      { x: 64, y: 68, w: 32, h: 28 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availW = 100 - pad * 2 - gap
      const leftW = availW * 0.58
      const rightW = availW * 0.42
      const availH = 100 - pad * 2 - gap * 2
      const rightH = availH / 3
      return [
        { x: pad, y: pad, width: Number(leftW.toFixed(2)), height: 100 - pad * 2, radius: 1.5 },
        { x: pad + leftW + gap, y: pad, width: Number(rightW.toFixed(2)), height: Number(rightH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap, y: pad + rightH + gap, width: Number(rightW.toFixed(2)), height: Number(rightH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap, y: pad + (rightH + gap) * 2, width: Number(rightW.toFixed(2)), height: Number(rightH.toFixed(2)), radius: 1.5 },
      ]
    },
  },
  {
    id: "grid-4-hero-top",
    name: "1 Hero Top + 3 Columns",
    count: 4,
    description: "Wide top landscape hero with 3 vertical cuts below",
    wireframe: [
      { x: 4, y: 4, w: 92, h: 56 },
      { x: 4, y: 64, w: 28, h: 32 },
      { x: 36, y: 64, w: 28, h: 32 },
      { x: 68, y: 64, w: 28, h: 32 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availH = 100 - pad * 2 - gap
      const topH = availH * 0.58
      const botH = availH * 0.42
      const availW = 100 - pad * 2 - gap * 2
      const colW = availW / 3
      return [
        { x: pad, y: pad, width: 100 - pad * 2, height: Number(topH.toFixed(2)), radius: 1.5 },
        { x: pad, y: pad + topH + gap, width: Number(colW.toFixed(2)), height: Number(botH.toFixed(2)), radius: 1.5 },
        { x: pad + colW + gap, y: pad + topH + gap, width: Number(colW.toFixed(2)), height: Number(botH.toFixed(2)), radius: 1.5 },
        { x: pad + (colW + gap) * 2, y: pad + topH + gap, width: Number(colW.toFixed(2)), height: Number(botH.toFixed(2)), radius: 1.5 },
      ]
    },
  },
  {
    id: "grid-4-strip",
    name: "4-Cut Photo Strip",
    count: 4,
    description: "Authentic vertical booth film strip",
    wireframe: [
      { x: 10, y: 4, w: 80, h: 20 },
      { x: 10, y: 28, w: 80, h: 20 },
      { x: 10, y: 52, w: 80, h: 20 },
      { x: 10, y: 76, w: 80, h: 20 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(1, 4, 4, spacing, padding),
  },

  // --- 5 Photos ---
  {
    id: "grid-5-hero-left",
    name: "Hero Left + 4 Quad Right",
    count: 5,
    description: "1 large left photo + 4 grid photos on right",
    wireframe: [
      { x: 4, y: 4, w: 46, h: 92 },
      { x: 54, y: 4, w: 20, h: 44 },
      { x: 76, y: 4, w: 20, h: 44 },
      { x: 54, y: 52, w: 20, h: 44 },
      { x: 76, y: 52, w: 20, h: 44 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availW = 100 - pad * 2 - gap
      const leftW = availW * 0.5
      const rightColW = (availW * 0.5 - gap) / 2
      const availH = 100 - pad * 2 - gap
      const rowH = availH / 2
      return [
        { x: pad, y: pad, width: Number(leftW.toFixed(2)), height: 100 - pad * 2, radius: 1.5 },
        { x: pad + leftW + gap, y: pad, width: Number(rightColW.toFixed(2)), height: Number(rowH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap + rightColW + gap, y: pad, width: Number(rightColW.toFixed(2)), height: Number(rowH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap, y: pad + rowH + gap, width: Number(rightColW.toFixed(2)), height: Number(rowH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap + rightColW + gap, y: pad + rowH + gap, width: Number(rightColW.toFixed(2)), height: Number(rowH.toFixed(2)), radius: 1.5 },
      ]
    },
  },
  {
    id: "grid-5-split-2-3",
    name: "2 Top + 3 Bottom",
    count: 5,
    description: "2 duo landscape photos on top, 3 cuts below",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 44 },
      { x: 52, y: 4, w: 44, h: 44 },
      { x: 4, y: 52, w: 28, h: 44 },
      { x: 36, y: 52, w: 28, h: 44 },
      { x: 68, y: 52, w: 28, h: 44 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availH = 100 - pad * 2 - gap
      const h = availH / 2
      const availWTop = 100 - pad * 2 - gap
      const wTop = availWTop / 2
      const availWBot = 100 - pad * 2 - gap * 2
      const wBot = availWBot / 3
      return [
        { x: pad, y: pad, width: Number(wTop.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad + wTop + gap, y: pad, width: Number(wTop.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad, y: pad + h + gap, width: Number(wBot.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad + wBot + gap, y: pad + h + gap, width: Number(wBot.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
        { x: pad + (wBot + gap) * 2, y: pad + h + gap, width: Number(wBot.toFixed(2)), height: Number(h.toFixed(2)), radius: 1.5 },
      ]
    },
  },

  // --- 6 Photos (PicCollage Highlight!) ---
  {
    id: "grid-6-equal-2x3",
    name: "2×3 Grid (Classic 6)",
    count: 6,
    description: "2 columns × 3 rows clean symmetrical grid (PicCollage featured)",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 28 },
      { x: 52, y: 4, w: 44, h: 28 },
      { x: 4, y: 36, w: 44, h: 28 },
      { x: 52, y: 36, w: 44, h: 28 },
      { x: 4, y: 68, w: 44, h: 28 },
      { x: 52, y: 68, w: 44, h: 28 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(2, 3, 6, spacing, padding),
  },
  {
    id: "grid-6-equal-3x2",
    name: "3×2 Grid (Wide 6)",
    count: 6,
    description: "3 columns × 2 rows balanced grid",
    wireframe: [
      { x: 4, y: 4, w: 28, h: 44 },
      { x: 36, y: 4, w: 28, h: 44 },
      { x: 68, y: 4, w: 28, h: 44 },
      { x: 4, y: 52, w: 28, h: 44 },
      { x: 36, y: 52, w: 28, h: 44 },
      { x: 68, y: 52, w: 28, h: 44 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(3, 2, 6, spacing, padding),
  },
  {
    id: "grid-6-hero-left",
    name: "Hero Left + 5 Mosaic",
    count: 6,
    description: "1 large hero left spanning 2 rows + 5 surrounding slots",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 60 },
      { x: 52, y: 4, w: 20, h: 28 },
      { x: 76, y: 4, w: 20, h: 28 },
      { x: 52, y: 36, w: 20, h: 28 },
      { x: 76, y: 36, w: 20, h: 28 },
      { x: 4, y: 68, w: 92, h: 28 },
    ],
    getSlots: (spacing, padding) => {
      const pad = padding
      const gap = spacing
      const availH = 100 - pad * 2 - gap * 2
      const topH = availH * 0.68
      const botH = availH * 0.32
      const availW = 100 - pad * 2 - gap
      const leftW = availW * 0.48
      const rightColW = (availW * 0.52 - gap) / 2
      const rowTopH = (topH - gap) / 2
      const botColW = (100 - pad * 2 - gap) / 2
      return [
        { x: pad, y: pad, width: Number(leftW.toFixed(2)), height: Number(topH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap, y: pad, width: Number(rightColW.toFixed(2)), height: Number(rowTopH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap + rightColW + gap, y: pad, width: Number(rightColW.toFixed(2)), height: Number(rowTopH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap, y: pad + rowTopH + gap, width: Number(rightColW.toFixed(2)), height: Number(rowTopH.toFixed(2)), radius: 1.5 },
        { x: pad + leftW + gap + rightColW + gap, y: pad + rowTopH + gap, width: Number(rightColW.toFixed(2)), height: Number(rowTopH.toFixed(2)), radius: 1.5 },
        { x: pad, y: pad + topH + gap, width: 100 - pad * 2, height: Number(botH.toFixed(2)), radius: 1.5 },
      ]
    },
  },
  {
    id: "grid-6-strip",
    name: "6-Cut Vertical Strip",
    count: 6,
    description: "6 vertical photobooth strip cuts",
    wireframe: [
      { x: 12, y: 2, w: 76, h: 14 },
      { x: 12, y: 18, w: 76, h: 14 },
      { x: 12, y: 34, w: 76, h: 14 },
      { x: 12, y: 50, w: 76, h: 14 },
      { x: 12, y: 66, w: 76, h: 14 },
      { x: 12, y: 82, w: 76, h: 14 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(1, 6, 6, spacing, padding),
  },

  // --- 8 & 9 Photos ---
  {
    id: "grid-8-equal",
    name: "2×4 Quad Duo (8 Cuts)",
    count: 8,
    description: "2 columns × 4 rows structured grid",
    wireframe: [
      { x: 4, y: 4, w: 44, h: 20 },
      { x: 52, y: 4, w: 44, h: 20 },
      { x: 4, y: 28, w: 44, h: 20 },
      { x: 52, y: 28, w: 44, h: 20 },
      { x: 4, y: 52, w: 44, h: 20 },
      { x: 52, y: 52, w: 44, h: 20 },
      { x: 4, y: 76, w: 44, h: 20 },
      { x: 52, y: 76, w: 44, h: 20 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(2, 4, 8, spacing, padding),
  },
  {
    id: "grid-9-equal",
    name: "3×3 Instagram Grid (9 Cuts)",
    count: 9,
    description: "9 equal tiles in a pristine 3×3 matrix",
    wireframe: [
      { x: 4, y: 4, w: 28, h: 28 },
      { x: 36, y: 4, w: 28, h: 28 },
      { x: 68, y: 4, w: 28, h: 28 },
      { x: 4, y: 36, w: 28, h: 28 },
      { x: 36, y: 36, w: 28, h: 28 },
      { x: 68, y: 36, w: 28, h: 28 },
      { x: 4, y: 68, w: 28, h: 28 },
      { x: 36, y: 68, w: 28, h: 28 },
      { x: 68, y: 68, w: 28, h: 28 },
    ],
    getSlots: (spacing, padding) => computeEqualGrid(3, 3, 9, spacing, padding),
  },
]

export function getLayoutsForCount(count: number): GridLayout[] {
  const exact = GRID_LAYOUTS.filter((l) => l.count === count)
  if (exact.length > 0) return exact
  // Return closest or all layouts sorted by count closeness
  return [...GRID_LAYOUTS].sort((a, b) => Math.abs(a.count - count) - Math.abs(b.count - count))
}

export function findGridLayout(id: string): GridLayout | undefined {
  return GRID_LAYOUTS.find((l) => l.id === id)
}
