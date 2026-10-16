import type { PhotoCount } from "../types"

export const frameCategories = [
  "Romantic scrapbook and lace",
  "Conceptual sketch and notebook",
  "Retro digital camera and film",
  "Korean photo booth and four-cut strips",
  "Cute pastel and doodles",
  "Newspaper, monochrome and torn paper",
  "Cinema tickets and theater booth",
  "Music, vinyl and moodboards",
  "Original comic and pop-art",
  "Freeform editorial and asymmetric collage",
] as const
export type FramePreset = {
  id: string
  name: string
  category: string
  tags: string[]
  supportedCounts: PhotoCount[]
  aspectRatios: string[]
  layoutCompatibility: "any"
  construction: number
  motif: number
  border: number
  spacing: number
  background: string
  color: string
  preview: string
  decorativeLayers: string[]
  textFields: string[]
  customization: string[]
}
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
export const svgUrl = (body: string, width = 100, height = 100) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`
const names = [
  "Ribbon study",
  "Margin notes",
  "Negative space",
  "Together cut",
  "Pocket doodles",
  "Sunday edition",
  "Admit a moment",
  "Side A memories",
  "Panel play",
  "Off-grid story",
]
const constructions = [
  "Fine rule",
  "Double edge",
  "Corner brackets",
  "Scallop edge",
  "Perforation",
  "Torn edge",
  "Stitched border",
  "Offset paper",
  "Washi corners",
  "Caption rail",
]
const motifs = [
  ["Bow", "Lace", "Heart chain", "Pressed petal", "Love letter"],
  ["Graph", "Crosshatch", "Pencil loop", "Notebook", "Ink stars"],
  ["Sprockets", "Viewfinder", "Date print", "Negative marks", "Focus ring"],
  [
    "Tiny hearts",
    "Cloud band",
    "Four-cut label",
    "Flower chain",
    "Memory stamp",
  ],
  ["Cherry pair", "Daisy field", "Star trail", "Smile parade", "Cloud notes"],
  [
    "Column rules",
    "Headline",
    "Torn columns",
    "Index marks",
    "Editorial masthead",
  ],
  [
    "Ticket numbers",
    "Curtain fold",
    "Seat stars",
    "Admission stamp",
    "Reel leader",
  ],
  ["Vinyl groove", "Waveform", "Track list", "Player card", "Music staff"],
  ["Halftone", "Speech cloud", "Lightning", "Action rays", "Comic panels"],
  [
    "Crop marks",
    "Asymmetric rules",
    "Circle studies",
    "Gallery label",
    "Diagonal tabs",
  ],
]
const palettes = [
  ["#f6e9e1", "#a55c68"],
  ["#f6f0df", "#575c4c"],
  ["#25262a", "#e4c78c"],
  ["#f7e7e8", "#b56c78"],
  ["#edf0df", "#7c916f"],
  ["#f0eddf", "#393c38"],
  ["#eedcba", "#914f3d"],
  ["#e8e5da", "#596778"],
  ["#f5e49f", "#494381"],
  ["#e5e7e0", "#4f655f"],
]
export const frames: FramePreset[] = frameCategories.flatMap((category, c) =>
  Array.from({ length: 50 }, (_, n) => {
    const construction = n % 10,
      motif = Math.floor(n / 10)
    const frame: FramePreset = {
      id: `frame-${c}-${n}`,
      name: `${motifs[c][motif]} · ${constructions[construction]}`,
      category,
      tags: [
        ...category.toLowerCase().split(/\W+/),
        motifs[c][motif].toLowerCase(),
        constructions[construction].toLowerCase(),
      ],
      supportedCounts: [1, 2, 3, 4, 5, 6, 8, 9],
      aspectRatios: ["portrait", "square", "landscape", "story"],
      layoutCompatibility: "any",
      construction,
      motif,
      border: 2 + (construction % 3),
      spacing: construction % 4,
      background: palettes[c][0],
      color: palettes[c][1],
      preview: "",
      decorativeLayers: [constructions[construction], motifs[c][motif]],
      textFields: ["Caption", "Date"],
      customization: ["color", "opacity", "background", "photo spacing"],
    }
    frame.preview = svgUrl(frameArtwork(frame, frame.color), 1000, 1400)
    return frame
  }),
)

// Every construction changes border geometry; category motifs are original vectors.
export function frameArtwork(frame: FramePreset, color: string) {
  const c = frameCategories.indexOf(
      frame.category as typeof frameCategories[number],
    ),
    m = frame.motif,
    k = frame.construction
  const ink = escape(color),
    unit = (s: string) =>
      `<g fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${s}</g>`
  let edge = ""
  if (k === 0) edge = '<rect x="18" y="18" width="964" height="1364" rx="9"/>'
  if (k === 1)
    edge =
      '<rect x="13" y="13" width="974" height="1374"/><rect x="25" y="27" width="950" height="1344"/>'
  if (k === 2)
    edge = [0, 1, 2, 3]
      .map(
        (i) =>
          `<path transform="translate(${i % 2 ? 1000 : 0} ${
            i > 1 ? 1400 : 0
          }) scale(${i % 2 ? -1 : 1} ${
            i > 1 ? -1 : 1
          })" d="M15 90V15H90M28 70V28H70"/>`,
      )
      .join("")
  if (k === 3)
    edge =
      Array.from(
        { length: 34 },
        (_, i) =>
          `<path d="M12 ${18 + i * 40}q22 20 0 38M988 ${18 + i * 40}q-22 20 0 38"/>`,
      ).join("") + '<path d="M20 15H980M20 1385H980"/>'
  if (k === 4)
    edge = Array.from(
      { length: 30 },
      (_, i) =>
        `<rect x="9" y="${25 + i * 45}" width="14" height="25" rx="3"/><rect x="977" y="${25 + i * 45}" width="14" height="25" rx="3"/>`,
    ).join("")
  if (k === 5)
    edge = `<path d="M12 20 ${Array.from({ length: 32 }, (_, i) => `L${30 + i * 30} ${12 + ((i * 7) % 13)}`).join(" ")} L985 1380 ${Array.from({ length: 32 }, (_, i) => `L${970 - i * 30} ${1380 + ((i * 11) % 15)}`).join(" ")}Z"/>`
  if (k === 6)
    edge =
      '<rect x="17" y="17" width="966" height="1366" rx="16" stroke-dasharray="8 9"/><path d="M12 32L30 13M967 1388l20-22"/>'
  if (k === 7)
    edge =
      '<path d="M12 22L978 12 989 1370 25 1388Z"/><path d="M22 12L988 28 978 1388 12 1375Z" opacity=".5"/>'
  if (k === 8)
    edge = [0, 1, 2, 3]
      .map(
        (i) =>
          `<g transform="translate(${i % 2 ? 935 : 65} ${
            i > 1 ? 1340 : 60
          }) rotate(${
            i % 2 ? -35 : 35
          })"><path fill="${ink}" fill-opacity=".22" d="M-55-15H55L50 15H-52Z"/><path d="M-50-4H50M-50 5H50" stroke-dasharray="3 5"/></g>`,
      )
      .join("")
  if (k === 9)
    edge =
      '<path d="M15 45H985M15 1300H985M15 1312H985"/><text x="45" y="1345" fill="currentColor" stroke="none" font-family="serif" font-size="19" letter-spacing="5">LITTLE MOMENTS / A PERSONAL ARCHIVE</text>'
  let motif = ""
  if (c === 0)
    motif =
      m === 0
        ? '<path d="M475 40Q420 5 430 55Q450 75 500 44Q550 10 570 40Q575 78 500 44L480 90M500 44l40 48"/>'
        : m === 1
          ? Array.from(
              { length: 23 },
              (_, i) =>
                `<circle cx="${40 + i * 42}" cy="35" r="13"/><circle cx="${40 + i * 42}" cy="35" r="5"/>`,
            ).join("")
          : m === 2
            ? Array.from(
                { length: 12 },
                (_, i) =>
                  `<path transform="translate(${40 + i * 80} 22)" d="M0 8C-14-8-25 12 0 28C25 12 14-8 0 8Z"/>`,
              ).join("")
            : m === 3
              ? '<path d="M50 80Q85 40 60 15M60 45q-30-30-40-7q5 25 40 7M63 35q35-20 38 5q-15 15-38-5"/>'
              : '<path d="M420 14H580V75H420ZM420 14l80 44 80-44M420 75l55-35M580 75l-55-35"/>'
  if (c === 1)
    motif =
      m === 0
        ? Array.from(
            { length: 18 },
            (_, i) =>
              `<path opacity=".4" d="M${35 + i * 55} 20v60M20 ${20 + i * 3}H980"/>`,
          ).join("")
        : m === 1
          ? Array.from(
              { length: 13 },
              (_, i) =>
                `<path d="M${15 + i * 6} 70l40-55M${920 + i * 5} 15l-35 55"/>`,
            ).join("")
          : m === 2
            ? '<path d="M30 50Q100 2 180 45T350 38T530 45T700 30T960 50M25 58Q140 20 225 57T480 50"/>'
            : m === 3
              ? Array.from(
                  { length: 12 },
                  (_, i) =>
                    `<ellipse cx="${40 + i * 83}" cy="20" rx="9" ry="16"/><path d="M${40 + i * 83} 6v30"/>`,
                ).join("")
              : starTrail(ink, 5 + m, 22, 25)
  if (c === 2)
    motif =
      m === 0
        ? '<path d="M40 12v65M960 12v65" stroke-width="12" stroke-dasharray="12 8"/>'
        : m === 1
          ? '<path d="M45 72V25H95M905 25h50v47M470 42h60M500 12v60"/>'
          : m === 2
            ? '<text x="700" y="46" font-family="monospace" font-size="25" stroke="none" fill="currentColor">09 / 24 / 2004</text>'
            : m === 3
              ? '<path d="M50 14v45M80 14v20M120 14v45M160 14v20M200 14v45M240 14v20M280 14v45"/><text x="820" y="46" font-size="24" fill="currentColor" stroke="none">ISO 400</text>'
              : '<circle cx="500" cy="42" r="28"/><circle cx="500" cy="42" r="17"/><path d="M460 42h80M500 3v78"/>'
  if (c === 3)
    motif =
      m === 0
        ? starTrail(ink, 9, 20, 30)
        : m === 1
          ? '<path d="M20 45q15-30 35-10q15-30 35 0q20-20 35 5h750"/>'
          : m === 2
            ? '<rect x="355" y="12" width="290" height="55" rx="27"/><text x="500" y="48" text-anchor="middle" font-family="sans-serif" font-size="22" fill="currentColor" stroke="none">OUR FOUR LITTLE TAKES</text>'
            : m === 3
              ? flowerTrail(6, 28)
              : '<circle cx="910" cy="45" r="30"/><path d="M884 45h52M910 20v50"/>'
  if (c === 4)
    motif =
      m === 0
        ? '<path d="M450 12q40 10 30 40M480 52q30-45 60-35"/><circle cx="467" cy="57" r="14"/><circle cx="493" cy="57" r="14"/>'
        : m === 1
          ? flowerTrail(10, 25)
          : m === 2
            ? starTrail(ink, 12, 20, 30)
            : m === 3
              ? Array.from(
                  { length: 9 },
                  (_, i) =>
                    `<g transform="translate(${65 + i * 110} 38)"><circle r="19"/><path d="M-9 3q9 13 18 0M-7-6v2M7-6v2"/></g>`,
                ).join("")
              : '<path d="M20 55q12-28 30-15q12-28 35-8q30-12 35 23Z M850 55q12-28 30-15q12-28 35-8q30-12 35 23Z"/>'
  if (c === 5)
    motif =
      m === 0
        ? '<path d="M30 12v66M42 12v66M500 12v66M958 12v66M970 12v66"/>'
        : m === 1
          ? '<text x="500" y="52" text-anchor="middle" font-family="serif" font-size="40" fill="currentColor" stroke="none">THE EVERYDAY EDITION</text>'
          : m === 2
            ? '<path d="M20 65L75 12 110 70 150 20 200 66 250 15 320 65 380 22 450 62 520 10 600 70 675 15 740 60 800 18 865 70 920 12 980 65"/>'
            : m === 3
              ? '<text x="40" y="45" font-family="monospace" font-size="23" fill="currentColor" stroke="none">VOL. 01</text><text x="825" y="45" font-family="monospace" font-size="23" fill="currentColor" stroke="none">ISSUE / 09</text>'
              : '<path d="M25 15H975M25 75H975"/><text x="500" y="57" text-anchor="middle" font-family="serif" font-size="32" fill="currentColor" stroke="none">A JOURNAL OF SMALL THINGS</text>'
  if (c === 6)
    motif =
      m === 0
        ? '<text x="500" y="48" text-anchor="middle" font-family="monospace" font-size="25" letter-spacing="12" fill="currentColor" stroke="none">Nº 001 / ADMIT TWO</text>'
        : m === 1
          ? Array.from(
              { length: 20 },
              (_, i) => `<path d="M${10 + i * 50} 15q25 75 50 0"/>`,
            ).join("")
          : m === 2
            ? starTrail(ink, 8, 18, 35)
            : m === 3
              ? '<ellipse cx="500" cy="42" rx="155" ry="32"/><text x="500" y="50" text-anchor="middle" font-size="23" fill="currentColor" stroke="none">ONE BEAUTIFUL MOMENT</text>'
              : '<circle cx="500" cy="42" r="34"/><path d="M463 42h74M500 5v74"/><text x="500" y="54" text-anchor="middle" font-size="35" fill="currentColor" stroke="none">3</text>'
  if (c === 7)
    motif =
      m === 0
        ? Array.from(
            { length: 5 },
            (_, i) =>
              `<ellipse cx="500" cy="40" rx="${40 + i * 12}" ry="${12 + i * 5}"/>`,
          ).join("")
        : m === 1
          ? Array.from(
              { length: 60 },
              (_, i) =>
                `<path d="M${30 + i * 16} ${40 - Math.sin(i * 2) * 22}v${20 + Math.sin(i * 2) * 22}"/>`,
            ).join("")
          : m === 2
            ? '<text x="45" y="36" font-family="monospace" font-size="20" fill="currentColor" stroke="none">01. A LITTLE LAUGHTER</text><text x="45" y="64" font-family="monospace" font-size="20" fill="currentColor" stroke="none">02. THE WAY WE WERE</text>'
            : m === 3
              ? '<rect x="340" y="10" width="320" height="70" rx="9"/><circle cx="380" cy="45" r="22"/><path d="M425 34h200M425 50h130M425 63h180"/>'
              : Array.from(
                  { length: 5 },
                  (_, i) => `<path d="M30 ${18 + i * 10}H970"/>`,
                ).join("") +
                '<path d="M450 14v40q-35-20-35 3q15 20 35-3M550 22v40q-35-20-35 3q15 20 35-3"/>'
  if (c === 8)
    motif =
      m === 0
        ? Array.from(
            { length: 60 },
            (_, i) =>
              `<circle cx="${25 + i * 16}" cy="${20 + (i % 3) * 17}" r="${2 + (i % 5)}" fill="${ink}"/>`,
          ).join("")
        : m === 1
          ? '<path d="M350 10H650V58H510L490 82 485 58H350Z"/>'
          : m === 2
            ? '<path d="M480 8l-25 40h35l-12 35 55-48h-36l20-27"/>'
            : m === 3
              ? Array.from(
                  { length: 12 },
                  (_, i) =>
                    `<path transform="translate(500 40) rotate(${i * 30})" d="M40 0h${20 + (i % 3) * 10}"/>`,
                ).join("")
              : '<path d="M20 14h290v55H20ZM355 14h290v55H355ZM690 14h290v55H690Z"/>'
  if (c === 9)
    motif =
      m === 0
        ? '<path d="M35 15v60M15 35h60M965 15v60M925 35h60M35 1325v60M15 1365h60M965 1325v60M925 1365h60"/>'
        : m === 1
          ? '<path d="M20 20h650M20 28h400M750 1360h230M850 1370h130"/>'
          : m === 2
            ? '<circle cx="70" cy="50" r="34"/><circle cx="100" cy="50" r="22"/><circle cx="925" cy="1350" r="26"/>'
            : m === 3
              ? '<rect x="35" y="1320" width="420" height="55"/><text x="50" y="1355" font-family="serif" font-size="23" fill="currentColor" stroke="none">FIG. 01 — LIFE, COLLECTED</text>'
              : '<path d="M20 15l160 60M20 35l105 40M830 1320l150 55M890 1320l90 30"/>'
  return `<g color="${ink}">${unit(edge + motif)}</g>`
}
function starTrail(_color: string, n: number, r: number, y: number) {
  return Array.from(
    { length: n },
    (_, i) =>
      `<path transform="translate(${40 + (i * 920) / Math.max(1, n - 1)} ${y + 15 * (i % 2)})" d="M0-${r}L${r * 0.25}-${r * 0.25} ${r} 0 ${r * 0.25} ${r * 0.25} 0 ${r} -${r * 0.25} ${r * 0.25} -${r} 0 -${r * 0.25}-${r * 0.25}Z"/>`,
  ).join("")
}
function flowerTrail(n: number, y: number) {
  return Array.from(
    { length: n },
    (_, i) =>
      `<g transform="translate(${60 + (i * 880) / Math.max(1, n - 1)} ${y + 12})">${Array.from({ length: 5 }, (_, p) => `<ellipse rx="7" ry="14" cy="-12" transform="rotate(${p * 72})"/>`).join("")}<circle r="5"/></g>`,
  ).join("")
}

export type StickerAsset = {
  id: string
  name: string
  pack: string
  tags: string[]
  svg: string
  recolorable: boolean
}
export const stickerPacks = [
  "Love notes",
  "Pencil garden",
  "Little creatures",
  "Paper desk",
  "Analog memories",
  "Words to keep",
  "Pop studio",
  "Celebrate",
]
const stickerNames = [
  ["Ribbon", "Heart", "Cherry", "Blossom", "Butterfly"],
  ["Star", "Arrow", "Leaf", "Sparkle", "Face"],
  ["Bear", "Cat", "Rabbit", "Ghost", "Bird"],
  ["Tape", "Lace", "Torn note", "Paper clip", "Label"],
  ["Camera", "Film", "Postage", "Calendar", "Ticket"],
  [
    "little moments",
    "stay curious",
    "you & me",
    "good things",
    "made of memories",
  ],
  ["Speech bubble", "Burst", "Lightning", "Thought cloud", "Action lines"],
  ["Birthday cake", "Graduation", "Travel tag", "Snowflake", "Party hat"],
]
const poses = ["Pocket", "Floating", "Double", "Dotted", "Framed"]
function stickerBody(pack: number, m: number, v: number) {
  const d = 4 + v * 2
  let body = ""
  if (pack === 0) {
    if (m === 0)
      body = `<path d="M48 48Q${8 + d} ${8 + d} 14 47Q20 73 48 48Q${86 - d} ${10 + d} 88 46Q77 72 48 48M48 48L${24 + d} 88M48 48L${80 - d} 88"/><circle cx="48" cy="48" r="6"/>`
    if (m === 1)
      body = `<path d="M50 85C${-15 + d} 42 15 ${3 + d} 50 34C85 ${3 + d} ${115 - d} 42 50 85Z"/>`
    if (m === 2)
      body = `<path d="M37 62Q${55 + d} 30 57 12Q70 28 78 34"/><circle cx="30" cy="67" r="${15 + v}"/><circle cx="66" cy="65" r="${17 - v}"/><path d="M31 59l-4 7M65 56l-4 7"/>`
    if (m === 3)
      body =
        Array.from(
          { length: 5 + v },
          (_, i) =>
            `<ellipse cx="50" cy="29" rx="${8 + v}" ry="18" transform="rotate(${(i * 360) / (5 + v)} 50 50)"/>`,
        ).join("") + '<circle cx="50" cy="50" r="9"/>'
    if (m === 4)
      body = `<path d="M50 35C${2 + d} 0 0 65 44 55C5 85 40 99 50 56C60 99 95 85 56 55C100 65 ${98 - d} 0 50 35ZM50 35v33M50 35L40 ${14 + d}M50 35L60 ${14 + d}"/>`
  } else if (pack === 1) {
    if (m === 0) {
      const points = 5 + v
      body = `<path d="${Array.from({ length: points * 2 }, (_, i) => {
        const a = (i * Math.PI) / points - Math.PI / 2,
          r = i % 2 ? 16 : 39
        return `${i ? "L" : "M"}${50 + Math.cos(a) * r} ${50 + Math.sin(a) * r}`
      }).join("")}Z"/>`
    }
    if (m === 1)
      body = `<path d="M12 ${78 - v * 8}Q${25 + v * 8} 10 86 28M65 ${15 + v * 2}L86 28 ${69 - v * 2} 48"/><path d="M15 ${83 - v * 8}Q35 20 69 28" opacity=".4"/>`
    if (m === 2)
      body = `<path d="M20 85Q${15 + v * 6} 20 83 12Q95 ${70 - v * 5} 20 85ZM20 85L83 12M35 65l-4-25M50 50l25 3M63 35l-3-15"/>`
    if (m === 3)
      body = starTrail("", 3 + v, 10, 45).replace(
        /translate\(([^ ]+) /g,
        (_: string, n: string) => `translate(${Number(n) / 10} `,
      )
    if (m === 4)
      body = `<circle cx="50" cy="50" r="${31 + v}"/><path d="M32 38v${3 + v}M68 38v${3 + v}M30 ${58 - v * 2}Q50 ${82 - v * 8} 70 58"/>`
  } else if (pack === 2) {
    const ears =
      m === 0
        ? '<circle cx="27" cy="25" r="15"/><circle cx="73" cy="25" r="15"/>'
        : m === 1
          ? '<path d="M20 40V10l26 20M54 30l26-20v30"/>'
          : m === 2
            ? `<ellipse cx="34" cy="20" rx="10" ry="${17 + v}"/><ellipse cx="65" cy="20" rx="10" ry="${17 - v}"/>`
            : ""
    body =
      m < 3
        ? `${ears}<ellipse cx="50" cy="56" rx="${33 - v}" ry="30"/><path d="M35 51v${2 + v}M65 51v${2 + v}M45 65q5 ${4 + v * 2} 10 0"/><ellipse cx="50" cy="59" rx="4" ry="3"/>`
        : m === 3
          ? `<path d="M18 85V45C18 3 82 3 82 45V85L${70 - v} 73 57 85 44 74 31 85 18 74ZM35 43v9M65 43v9M43 64q7 ${8 - v * 3} 14 0"/>`
          : `<path d="M20 64Q0 20 38 24Q65 10 76 45l18 8-18 8Q66 90 20 64ZM27 50Q50 ${34 + v * 5} 60 62M64 38v4M38 77l-5 13M56 78l5 12"/>`
  } else if (pack === 3) {
    if (m === 0)
      body = `<path fill="currentColor" fill-opacity=".17" d="M8 ${20 + v * 3}L90 14 87 70 12 85 17 69 9 58 15 45Z"/><path stroke-dasharray="${2 + v} 5" d="M18 35l60-8M17 51l60-8M18 67l60-8"/>`
    if (m === 1)
      body = Array.from(
        { length: 5 + v },
        (_, i) =>
          `<circle cx="${10 + (i * 80) / (4 + v)}" cy="40" r="${8 - v * 0.5}"/><path d="M${10 + (i * 80) / (4 + v)} 48v23"/>`,
      ).join("")
    if (m === 2)
      body = `<path d="M10 14L${30 + v} 20 42 13 55 20 70 13 90 17 86 84 69 80 55 88 42 81 30 87 12 82Z"/><path d="M25 36h50M25 48h${34 + v * 3}M25 60h45"/>`
    if (m === 3)
      body = `<path d="M${30 + v * 2} 68V25C30 0 72 2 72 27v42C72 98 21 96 21 69V31M42 29v37q0 17 17 0V30"/>`
    if (m === 4)
      body = `<path d="M7 25H${70 - v * 3}L95 50 ${70 - v * 3} 75H7Z"/><circle cx="77" cy="50" r="4"/><path d="M18 40h38M18 51h30M18 62h38"/>`
  } else if (pack === 4) {
    if (m === 0)
      body = `<path d="M10 30H30l${5 + v * 2}-13h30l8 13h17v48H10Z"/><circle cx="51" cy="53" r="${16 + v}"/><circle cx="51" cy="53" r="10"/><path d="M17 38h10M76 39h8"/>`
    if (m === 1)
      body = `<rect x="15" y="7" width="70" height="86" rx="4"/><path d="M29 8v84M71 8v84"/>${Array.from({ length: 4 }, (_, i) => `<rect x="19" y="${14 + i * 20}" width="5" height="7"/><rect x="76" y="${14 + i * 20}" width="5" height="7"/>`).join("")}<path d="M34 ${27 + v * 3}h32M34 ${60 + v * 2}h32"/>`
    if (m === 2)
      body = `<rect x="12" y="8" width="76" height="84" stroke-dasharray="${3 + v} 5"/><rect x="22" y="18" width="56" height="64"/><circle cx="50" cy="44" r="${13 + v}"/><path d="M27 71h46M40 42l10-14 11 14"/>`
    if (m === 3)
      body = `<rect x="12" y="20" width="76" height="66" rx="4"/><path d="M12 38h76M30 12v18M70 12v18"/><text x="50" y="70" text-anchor="middle" font-family="monospace" font-size="28" stroke="none" fill="currentColor">${12 + v * 3}</text>`
    if (m === 4)
      body = `<path d="M8 25H92V40Q76 50 92 60V75H8V60Q24 50 8 40Z"/><path stroke-dasharray="3 4" d="M68 27v46"/><text x="36" y="57" text-anchor="middle" font-size="16" stroke="none" fill="currentColor">0${v + 1}</text>`
  } else if (pack === 5) {
    const phrase = stickerNames[pack][m],
      words = phrase.split(" ")
    body = `<text x="50" y="${
      v === 2 ? 37 : 49
    }" text-anchor="middle" font-family="${
      v === 1 ? "serif" : v === 3 ? "monospace" : "cursive"
    }" font-style="${v === 0 ? "italic" : "normal"}" font-size="${
      v === 2 ? 15 : 12
    }" stroke="none" fill="currentColor" transform="rotate(${(v - 2) * 3} 50 50)">${
      v === 2 ? words[0] : escape(phrase)
    }</text>`
    if (v === 2)
      body += `<text x="50" y="60" text-anchor="middle" font-family="cursive" font-size="15" stroke="none" fill="currentColor">${escape(words.slice(1).join(" "))}</text>`
    body +=
      v === 0
        ? '<path d="M12 60q38 8 76-2"/>'
        : v === 1
          ? '<ellipse cx="50" cy="47" rx="47" ry="26"/>'
          : v === 2
            ? '<path d="M15 73h70M26 80h48"/>'
            : v === 3
              ? '<rect x="2" y="29" width="96" height="34" stroke-dasharray="3 3"/>'
              : '<path d="M5 29v-9h15M80 20h15v9M5 64v9h15M80 73h15v-9"/>'
  } else if (pack === 6) {
    if (m === 0)
      body = `<path d="M8 12H92V${62 + v * 3}H48L${20 + v * 4} 91 29 ${62 + v * 3}H8Z"/>`
    if (m === 1)
      body = `<path d="${Array.from({ length: 24 + v * 2 }, (_, i) => {
        const a = (i * Math.PI * 2) / (24 + v * 2),
          r = i % 2 ? 24 : 45
        return `${i ? "L" : "M"}${50 + Math.cos(a) * r} ${50 + Math.sin(a) * r}`
      }).join("")}Z"/>`
    if (m === 2)
      body = `<path d="M${54 + v * 3} 6L16 57h31L${34 - v * 2} 94 86 36H53Z"/>`
    if (m === 3)
      body = `<path d="M20 65C-8 46 10 17 30 23C40 0 71 9 72 26C103 19 105 62 76 64C55 83 33 78 20 65Z"/><circle cx="24" cy="81" r="${5 + v}"/><circle cx="14" cy="94" r="3"/>`
    if (m === 4)
      body = Array.from(
        { length: 7 + v },
        (_, i) =>
          `<path transform="rotate(${(i * 360) / (7 + v)} 50 50)" d="M${75 + v} 50h17M80 46h9"/>`,
      ).join("")
  } else {
    if (m === 0)
      body = `<path d="M18 58h64v30H18ZM25 40h50v18H25ZM${38 - v * 3} 40V25M50 40V21M${62 + v * 3} 40V25M18 69q8 12 16 0t16 0t16 0t16 0"/><path d="M50 17q-9-12 1-15q9 10-1 15"/>`
    if (m === 1)
      body = `<path d="M5 ${30 + v * 2}L50 9 95 ${30 + v * 2} 50 53ZM22 43v25q28 22 56 0V43M90 35v43l-5 10h10l-5-10"/>`
    if (m === 2)
      body = `<path d="M18 10H67L88 32V89H18ZM67 10v22h21"/><circle cx="50" cy="58" r="${17 + v}"/><path d="M25 58h50M50 35q-20 23 0 46q20-23 0-46"/>`
    if (m === 3)
      body = Array.from(
        { length: 6 + v },
        (_, i) =>
          `<path transform="rotate(${(i * 360) / (6 + v)} 50 50)" d="M50 50V8M50 25L37 16M50 25l13-9"/>`,
      ).join("")
    if (m === 4)
      body = `<path d="M50 12L${12 + v * 2} 86Q50 99 ${88 - v * 2} 86Z"/><circle cx="50" cy="10" r="7"/><path d="M28 59l45 10M22 75l36 10"/><circle cx="51" cy="44" r="4"/>`
  }
  return `<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}${
    v === 4 && pack !== 5
      ? '<path d="M5 22V5h17M78 5h17v17M5 78v17h17M78 95h17V78"/>'
      : ""
  }${
    v === 3 && pack !== 5
      ? '<path d="M5 8h1M89 9h1M8 91h1M91 89h1" stroke-width="5"/>'
      : ""
  }</g>`
}
export const stickers: StickerAsset[] = stickerPacks.flatMap((pack, p) =>
  Array.from({ length: 25 }, (_, i) => ({
    id: `sticker-${p}-${i}`,
    name: `${poses[i % 5]} ${stickerNames[p][Math.floor(i / 5)]}`,
    pack,
    tags: [
      pack.toLowerCase(),
      stickerNames[p][Math.floor(i / 5)].toLowerCase(),
      poses[i % 5].toLowerCase(),
    ],
    svg: stickerBody(p, Math.floor(i / 5), i % 5),
    recolorable: true,
  })),
)
export function stickerUrl(asset: StickerAsset, color = "#a45f59") {
  return svgUrl(`<g color="${escape(color)}">${asset.svg}</g>`)
}
export const backgroundPatterns = [
  "none",
  "Paper grain",
  "Graph paper",
  "Notebook lines",
  "Dots",
  "Gingham",
  "Denim",
  "Canvas weave",
  "Lace",
  "Newspaper",
  "Sunset gradient",
  "Sage gradient",
  "Retro waves",
]
