import type { PhotoCount, PhotoTemplate, Slot } from "./types"

const grid = (count: number, cols: number, gap = 3, margin = 6): Slot[] => {
  const rows = Math.ceil(count / cols)
  const width = (100 - margin * 2 - gap * (cols - 1)) / cols
  const height = (100 - margin * 2 - gap * (rows - 1)) / rows
  return Array.from({ length: count }, (_, index) => ({
    x: margin + (index % cols) * (width + gap),
    y: margin + Math.floor(index / cols) * (height + gap),
    width,
    height,
    radius: 1.5,
  }))
}

const strip = (count: number): Slot[] =>
  Array.from({ length: count }, (_, index) => ({
    x: 8,
    y: 5 + index * (88 / count),
    width: 84,
    height: 82 / count,
    radius: 1,
  }))

const make = (
  id: string,
  name: string,
  count: PhotoCount,
  category: string,
  orientation: PhotoTemplate["orientation"],
  background: string,
  accent: string,
  slots: Slot[],
  note: string,
): PhotoTemplate => ({
  id,
  name,
  count,
  category,
  orientation,
  background,
  accent,
  slots,
  note,
  width:
    orientation === "portrait"
      ? 1200
      : orientation === "landscape"
        ? 1800
        : 1400,
  height:
    orientation === "portrait"
      ? 1800
      : orientation === "landscape"
        ? 1200
        : 1400,
})

export const templates: PhotoTemplate[] = [
  make(
    "solo-polaroid",
    "Solo study",
    1,
    "Polaroid",
    "portrait",
    "#f8f2e6",
    "#c35f4b",
    [{ x: 8, y: 6, width: 84, height: 72 }],
    "Room for a handwritten thought.",
  ),
  make(
    "duo-strip",
    "Two of us",
    2,
    "Classic",
    "portrait",
    "#f6efdf",
    "#325d7d",
    strip(2),
    "A timeless vertical double.",
  ),
  make(
    "duo-wide",
    "Side by side",
    2,
    "Minimal",
    "landscape",
    "#ebe5d6",
    "#b75d48",
    grid(2, 2, 4, 6),
    "A cinematic diptych.",
  ),
  make(
    "three-strip",
    "Three takes",
    3,
    "Classic",
    "portrait",
    "#1f2322",
    "#e9dfc9",
    strip(3),
    "Darkroom-style three-shot strip.",
  ),
  make(
    "three-story",
    "Little story",
    3,
    "Scrapbook",
    "landscape",
    "#f7f0e3",
    "#9a6b48",
    grid(3, 3, 3, 5),
    "Three frames in a row.",
  ),
  make(
    "four-cut",
    "Seoul four-cut",
    4,
    "Korean four-cut",
    "portrait",
    "#f3ead9",
    "#c95f5f",
    strip(4),
    "The modern booth classic.",
  ),
  make(
    "four-grid",
    "Contact sheet",
    4,
    "Minimal",
    "square",
    "#e8e4da",
    "#536b55",
    grid(4, 2, 3, 6),
    "A neat two-by-two study.",
  ),
  make(
    "four-night",
    "After dark",
    4,
    "Neon",
    "portrait",
    "#25252b",
    "#b9d0bd",
    strip(4),
    "Inky paper with a quiet glow.",
  ),
  make(
    "five-notes",
    "Five moments",
    5,
    "Scrapbook",
    "portrait",
    "#f6edda",
    "#ba664d",
    grid(5, 2, 3, 6),
    "An intentionally uneven journal page.",
  ),
  make(
    "six-strip",
    "Six-frame roll",
    6,
    "Retro film",
    "portrait",
    "#252321",
    "#dbcda8",
    grid(6, 2, 3, 6),
    "A film-roll contact sheet.",
  ),
  make(
    "six-grid",
    "Weekend six",
    6,
    "Friends",
    "landscape",
    "#eee6d4",
    "#536e72",
    grid(6, 3, 3, 5),
    "A roomy group collage.",
  ),
  make(
    "eight-sheet",
    "Eight-frame sheet",
    8,
    "Vintage",
    "landscape",
    "#f2e9d7",
    "#a14e42",
    grid(8, 4, 2, 5),
    "Tiny moments, collected.",
  ),
  make(
    "nine-grid",
    "Nine tiny stories",
    9,
    "Minimal",
    "square",
    "#eee9dc",
    "#59634d",
    grid(9, 3, 2, 5),
    "A classic three-by-three.",
  ),
  make(
    "nine-film",
    "Contact roll 09",
    9,
    "Retro film",
    "landscape",
    "#272725",
    "#d6c89f",
    grid(9, 3, 2, 5),
    "For a complete little narrative.",
  ),
]

// Layouts are geometry only; the separate frame registry decorates any of these.
for (const count of [1, 2, 3, 4, 5, 6, 8, 9] as PhotoCount[]) {
  const specs: {
    id: string
    name: string
    cols: number
    orientation: PhotoTemplate["orientation"]
    gap: number
    margin: number
  }[] = [
    {
      id: "horizontal",
      name: "Wide story",
      cols: count,
      orientation: "landscape",
      gap: 2,
      margin: 5,
    },
    {
      id: "vertical",
      name: "Long little story",
      cols: 1,
      orientation: "portrait",
      gap: 2,
      margin: 6,
    },
    {
      id: "square",
      name: "Square study",
      cols: Math.ceil(Math.sqrt(count)),
      orientation: "square",
      gap: 3,
      margin: 7,
    },
    {
      id: "editorial",
      name: "Editorial margin",
      cols: Math.ceil(count / 2),
      orientation: "portrait",
      gap: 5,
      margin: 10,
    },
    {
      id: "contact",
      name: "Wide contact sheet",
      cols: Math.min(count, 3),
      orientation: "landscape",
      gap: 2,
      margin: 4,
    },
    {
      id: "instant",
      name: "Instant keepsakes",
      cols: Math.ceil(Math.sqrt(count)),
      orientation: "portrait",
      gap: 6,
      margin: 9,
    },
  ]
  for (const spec of specs)
    templates.push(
      make(
        `layout-${count}-${spec.id}`,
        `${spec.name} ${count}`,
        count,
        "Creative layouts",
        spec.orientation,
        "#f8f2e6",
        "#7e856c",
        grid(count, spec.cols, spec.gap, spec.margin),
        "Original photos and edits stay with you.",
      ),
    )
  const slots = grid(count, Math.ceil(Math.sqrt(count)), 4, 10).map(
    (slot, i) => ({
      ...slot,
      x: Math.max(2, slot.x + (i % 2 ? 3 : -3)),
      y: Math.max(2, slot.y + (i % 2 ? -3 : 3)),
      width: slot.width * 0.94,
      height: slot.height * 0.94,
    }),
  )
  templates.push(
    make(
      `layout-${count}-asymmetric`,
      `Off-grid ${count}`,
      count,
      "Creative layouts",
      "square",
      "#f8f2e6",
      "#7e856c",
      slots,
      "A little asymmetric, entirely intentional.",
    ),
  )
}

export const templatesForCount = (count: PhotoCount) =>
  templates.filter((template) => template.count === count)

export const getTemplate = (id: string) =>
  templates.find((template) => template.id === id) ?? templates[5]
