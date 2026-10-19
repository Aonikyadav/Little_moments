export interface WashiPattern {
  id: string
  name: string
  background: string
  border?: string
  clipPath?: string
}

export const WASHI_PATTERNS: WashiPattern[] = [
  {
    id: "stripe",
    name: "Candy Stripe",
    background: "repeating-linear-gradient(45deg, #fbcfe8, #fbcfe8 6px, #f472b6 6px, #f472b6 12px)",
  },
  {
    id: "strawberry",
    name: "Strawberry Sweet",
    background: "radial-gradient(#fb7185 24%, transparent 26%) 0 0/14px 14px, radial-gradient(#e11d48 20%, transparent 22%) 7px 7px/14px 14px, #ffe4e6",
    border: "1px dashed #f43f5e",
  },
  {
    id: "gold-glitter",
    name: "Gold Foil Glitter",
    background: "linear-gradient(135deg, #fef08a 0%, #eab308 30%, #ca8a04 50%, #fef08a 70%, #eab308 100%)",
    border: "1px solid #a16207",
  },
  {
    id: "newsprint",
    name: "Vintage Newsprint",
    background: "#f5eee6 repeating-linear-gradient(0deg, rgba(60,40,20,0.1), rgba(60,40,20,0.1) 1px, transparent 1px, transparent 6px)",
    border: "1px solid #b59f84",
  },
  {
    id: "lace",
    name: "Crochet White Lace",
    background: "radial-gradient(circle, #ffffff 2.5px, transparent 2.5px) 0 0/8px 8px, #e2e8f0",
    border: "1px dashed #94a3b8",
  },
  {
    id: "kraft",
    name: "Natural Kraft Tape",
    background: "#d7ba89",
    border: "1px dashed rgba(0,0,0,0.18)",
  },
  {
    id: "pink-dot",
    name: "Pink Polka Dot",
    background: "radial-gradient(#f43f5e 16%, transparent 18%) 0 0/10px 10px, #fce7f3",
    border: "1px dashed #f43f5e",
  },
  {
    id: "lavender",
    name: "Lavender Gingham",
    background: "repeating-linear-gradient(0deg, #ede9fe, #ede9fe 10px, #ddd6fe 10px, #ddd6fe 20px), repeating-linear-gradient(90deg, #ede9fe, #ede9fe 10px, #ddd6fe 10px, #ddd6fe 20px)",
    border: "1px dashed #a855f7",
  },
  {
    id: "sage",
    name: "Sage Foliage",
    background: "#dcfce7",
    border: "1px dashed #16a34a",
  },
]

export interface DecoStamp {
  id: string
  name: string
  category: "seal" | "flower" | "postmark" | "coffee" | "sparkle" | "badge"
  svg: string
  defaultWidth: number
  viewBox: string
}

export const DECO_STAMPS: DecoStamp[] = [
  {
    id: "stamp-wax-seal",
    name: "Red Wax Seal",
    category: "seal",
    defaultWidth: 54,
    viewBox: "0 0 54 54",
    svg: `
      <g filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
        <circle cx="27" cy="27" r="25" fill="#be123c" />
        <circle cx="27" cy="27" r="20" fill="#9f1239" stroke="#fda4af" stroke-width="1.5" stroke-dasharray="3 2" />
        <path d="M27 16 C23 16 20 19 20 23 C20 28 27 34 27 34 C27 34 34 28 34 23 C34 19 31 16 27 16 Z" fill="#ffe4e6" />
        <text x="27" y="40" text-anchor="middle" font-family="'DM Sans', sans-serif" font-size="5.5" font-weight="bold" fill="#fda4af" letter-spacing="0.5">SEOUL 2026</text>
      </g>
    `,
  },
  {
    id: "stamp-pressed-daisy",
    name: "Pressed Daisy",
    category: "flower",
    defaultWidth: 62,
    viewBox: "0 0 54 68",
    svg: `
      <g filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))">
        <!-- Stem -->
        <path d="M27 38 Q24 52 26 64" fill="none" stroke="#65a30d" stroke-width="2.5" stroke-linecap="round" />
        <path d="M26 50 Q31 46 34 48" fill="none" stroke="#65a30d" stroke-width="2" stroke-linecap="round" />
        <!-- Petals -->
        <g transform="translate(27, 26)">
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(36)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(72)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(108)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(144)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(180)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(216)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(252)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(288)" />
          <ellipse cx="0" cy="-15" rx="3.5" ry="8" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8" transform="rotate(324)" />
          <circle cx="0" cy="0" r="6.5" fill="#eab308" stroke="#a16207" stroke-width="1.2" />
        </g>
      </g>
    `,
  },
  {
    id: "stamp-postmark",
    name: "Airmail Postmark",
    category: "postmark",
    defaultWidth: 84,
    viewBox: "0 0 94 56",
    svg: `
      <g transform="rotate(-6 45 28)" opacity="0.88">
        <!-- Double circle postmark -->
        <circle cx="27" cy="27" r="24" fill="none" stroke="#78350f" stroke-width="1.8" />
        <circle cx="27" cy="27" r="20" fill="none" stroke="#78350f" stroke-width="0.8" stroke-dasharray="3 2" />
        <text x="27" y="17" text-anchor="middle" font-family="monospace" font-size="5" font-weight="bold" fill="#78350f" letter-spacing="1">PHOTOBOOTH</text>
        <text x="27" y="28" text-anchor="middle" font-family="'Caveat', cursive" font-size="11" font-weight="bold" fill="#9a3412">19.OCT.26</text>
        <text x="27" y="38" text-anchor="middle" font-family="monospace" font-size="4.8" fill="#78350f">★ SEOUL AIRMAIL ★</text>
        <!-- Wavy cancel lines -->
        <path d="M53 18 Q62 14 71 18 T89 18 M53 27 Q62 23 71 27 T89 27 M53 36 Q62 32 71 36 T89 36" fill="none" stroke="#78350f" stroke-width="1.5" />
      </g>
    `,
  },
  {
    id: "stamp-coffee-ring",
    name: "Coffee Cup Ring",
    category: "coffee",
    defaultWidth: 64,
    viewBox: "0 0 58 58",
    svg: `
      <g opacity="0.5">
        <circle cx="29" cy="29" r="24" fill="none" stroke="#78350f" stroke-width="3" stroke-dasharray="14 4 22 6 8 3" />
        <circle cx="29" cy="29" r="21" fill="none" stroke="#9a3412" stroke-width="1.2" opacity="0.7" />
        <path d="M47 13 Q49 19 46 23" fill="none" stroke="#78350f" stroke-width="2.5" />
      </g>
    `,
  },
  {
    id: "stamp-gold-sparkle",
    name: "Twinkle Sparkle",
    category: "sparkle",
    defaultWidth: 50,
    viewBox: "0 0 50 50",
    svg: `
      <g filter="drop-shadow(0 2px 4px rgba(234,179,8,0.4))">
        <!-- 4-point star -->
        <path d="M25 5 Q25 25 5 25 Q25 25 25 45 Q25 25 45 25 Q25 25 25 5 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
        <circle cx="25" cy="25" r="3.5" fill="#ffffff" />
        <circle cx="10" cy="10" r="2" fill="#fde047" />
        <circle cx="40" cy="38" r="2.5" fill="#fde047" />
      </g>
    `,
  },
  {
    id: "stamp-hongdae-booth",
    name: "Hongdae 24hr Stamp",
    category: "badge",
    defaultWidth: 92,
    viewBox: "0 0 94 44",
    svg: `
      <g opacity="0.88">
        <rect x="2" y="2" width="90" height="40" rx="4" fill="none" stroke="#be123c" stroke-width="1.8" stroke-dasharray="4 2" />
        <rect x="5" y="5" width="84" height="34" rx="2" fill="none" stroke="#be123c" stroke-width="0.8" />
        <text x="47" y="18" text-anchor="middle" font-family="'DM Sans', sans-serif" font-size="6.5" font-weight="900" fill="#be123c" letter-spacing="1">HONGDAE 24HR BOOTH</text>
        <text x="47" y="28" text-anchor="middle" font-family="'Caveat', cursive" font-size="11" font-weight="bold" fill="#9f1239">11:45 PM · SEOUL</text>
        <text x="47" y="35" text-anchor="middle" font-family="monospace" font-size="4.5" fill="#be123c">★ SPECIAL EDITION ★</text>
      </g>
    `,
  },
]

export type BinderTheme = "silver" | "bronze" | "pink-coil" | "lilac" | "leather"
export type PaperTheme = "ivory" | "midnight" | "grid" | "kraft"

export interface BinderConfig {
  id: BinderTheme
  name: string
  ringGradient: string
  holeColor: string
  ringBorder: string
  doubleWire?: boolean
}

export const BINDER_THEMES: Record<BinderTheme, BinderConfig> = {
  silver: {
    id: "silver",
    name: "Silver Double-Wire",
    ringGradient: "linear-gradient(to right, #6b7280, #f3f4f6 30%, #9ca3af 60%, #4b5563)",
    holeColor: "rgba(24, 24, 27, 0.9)",
    ringBorder: "rgba(107, 114, 128, 0.7)",
    doubleWire: true,
  },
  bronze: {
    id: "bronze",
    name: "Antique Bronze Rings",
    ringGradient: "linear-gradient(to right, #451a03, #fbbf24 35%, #b45309 65%, #311302)",
    holeColor: "rgba(30, 20, 10, 0.92)",
    ringBorder: "rgba(180, 83, 9, 0.8)",
  },
  "pink-coil": {
    id: "pink-coil",
    name: "Cute Pastel Pink Coil",
    ringGradient: "linear-gradient(to right, #f43f5e, #ffe4e6 35%, #fb7185 65%, #e11d48)",
    holeColor: "rgba(76, 5, 25, 0.85)",
    ringBorder: "rgba(244, 63, 94, 0.7)",
  },
  lilac: {
    id: "lilac",
    name: "Pastel Lilac Coil",
    ringGradient: "linear-gradient(to right, #7e22ce, #faf5ff 35%, #c084fc 65%, #581c87)",
    holeColor: "rgba(46, 16, 77, 0.85)",
    ringBorder: "rgba(168, 85, 247, 0.7)",
  },
  leather: {
    id: "leather",
    name: "Stitched Vintage Leather",
    ringGradient: "linear-gradient(to right, #291003, #92400e 40%, #78350f 70%, #1c0a02)",
    holeColor: "rgba(20, 10, 5, 0.95)",
    ringBorder: "rgba(146, 64, 14, 0.85)",
  },
}

export interface PaperConfig {
  id: PaperTheme
  name: string
  bg: string
  textColor: string
  subtextColor: string
  cardBg: string
  cardBorder: string
  memoBg: string
  memoBorder: string
  memoText: string
  lineColor: string
}

export const PAPER_THEMES: Record<PaperTheme, PaperConfig> = {
  ivory: {
    id: "ivory",
    name: "Warm Ivory Laid",
    bg: "#fcf9f2",
    textColor: "#1c1917",
    subtextColor: "#78716c",
    cardBg: "#ffffff",
    cardBorder: "#e7e5e4",
    memoBg: "#faf5ea",
    memoBorder: "rgba(120, 53, 15, 0.12)",
    memoText: "#292524",
    lineColor: "rgba(0,0,0,0.04)",
  },
  midnight: {
    id: "midnight",
    name: "Midnight Noir",
    bg: "#18171d",
    textColor: "#fafaf9",
    subtextColor: "#a8a29e",
    cardBg: "#24232c",
    cardBorder: "#3f3c4d",
    memoBg: "#22202a",
    memoBorder: "rgba(255, 255, 255, 0.15)",
    memoText: "#f5f5f4",
    lineColor: "rgba(255,255,255,0.04)",
  },
  grid: {
    id: "grid",
    name: "Blueprint Grid",
    bg: "#f4f7f6",
    textColor: "#0f172a",
    subtextColor: "#64748b",
    cardBg: "#ffffff",
    cardBorder: "#cbd5e1",
    memoBg: "#e2e8f0",
    memoBorder: "rgba(71, 85, 105, 0.15)",
    memoText: "#0f172a",
    lineColor: "rgba(14, 116, 144, 0.08)",
  },
  kraft: {
    id: "kraft",
    name: "Recycled Kraft",
    bg: "#e4ceb0",
    textColor: "#2b1c11",
    subtextColor: "#6e533d",
    cardBg: "#fbf6ed",
    cardBorder: "#c5ab8d",
    memoBg: "#dbc1a0",
    memoBorder: "rgba(69, 39, 16, 0.18)",
    memoText: "#2b1c11",
    lineColor: "rgba(78, 48, 22, 0.08)",
  },
}
