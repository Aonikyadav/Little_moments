import type { Adjustments } from "../types"

export type FilterPreset = {
  name: string
  category: string
  description: string
  values: Partial<Adjustments>
}

export const filterPresets: FilterPreset[] = [
  // 1. Natural & Original
  {
    name: "Original",
    category: "Natural & Clean",
    description: "Pure unmodified photo reproduction with neutral tone and clarity.",
    values: {},
  },
  {
    name: "Natural",
    category: "Natural & Clean",
    description: "Subtle skin smoothing with balanced micro-contrast and vivid neutrals.",
    values: { brightness: 102, contrast: 104, saturation: 103, sharpness: 10 },
  },
  {
    name: "Pure Light",
    category: "Natural & Clean",
    description: "Luminous airy glow with bright midtones and gentle lift.",
    values: { exposure: 0.15, brightness: 108, highlights: 10, shadows: 8, vibrance: 6 },
  },
  {
    name: "Studio Crisp",
    category: "Natural & Clean",
    description: "Commercial editorial lighting with sharp fine lines and punchy tones.",
    values: { contrast: 112, whites: 12, blacks: -8, sharpness: 28, saturation: 102 },
  },

  // 2. Black & White
  {
    name: "Mono",
    category: "Monochrome",
    description: "Timeless classic grayscale with deep blacks and rich silvery tones.",
    values: { saturation: 0, contrast: 118, brightness: 100, sharpness: 15 },
  },
  {
    name: "High Contrast Noir",
    category: "Monochrome",
    description: "Dramatic high-key shadow clipping reminiscent of 1940s cinema.",
    values: { saturation: 0, contrast: 145, brightness: 96, blacks: -25, whites: 20 },
  },
  {
    name: "Silver Gelatin",
    category: "Monochrome",
    description: "Subtle warm-toned darkroom emulsion with velvety shadow gradient.",
    values: { saturation: 0, contrast: 108, brightness: 102, warmth: 8, grain: 18 },
  },
  {
    name: "Newspaper Ink",
    category: "Monochrome",
    description: "Rough newsprint halftone feel with crushed tones and lifted blacks.",
    values: { saturation: 0, contrast: 130, fade: 24, grain: 40, sharpness: 22 },
  },
  {
    name: "Charcoal Sketch",
    category: "Monochrome",
    description: "Soft diffused matte monochrome with delicate charcoal gradients.",
    values: { saturation: 0, contrast: 92, fade: 35, blur: 0.4, brightness: 104 },
  },

  // 3. Vintage & Retro
  {
    name: "Vintage",
    category: "Retro & Film",
    description: "Aged warm nostalgic analog tones with amber highlights and soft vignetting.",
    values: { warmth: 28, tint: 8, saturation: 92, fade: 18, vignette: 22 },
  },
  {
    name: "Sepia",
    category: "Retro & Film",
    description: "Antique 19th-century photocard finish bathed in chestnut sepia hues.",
    values: { saturation: 35, warmth: 55, tint: 14, contrast: 105, fade: 26 },
  },
  {
    name: "Kodachrome 64",
    category: "Retro & Film",
    description: "Legendary warm reds and sunny yellows with distinct color separation.",
    values: { red: 14, yellow: 12, contrast: 114, saturation: 115, warmth: 16 } as unknown as Partial<Adjustments>,
  },
  {
    name: "Fuji Chrome",
    category: "Retro & Film",
    description: "Iconic emerald foliage tones with crisp cool shadows and cyan sky.",
    values: { green: 16, blue: 8, warmth: -10, vibrance: 18, contrast: 110 },
  },
  {
    name: "Polaroid 600",
    category: "Retro & Film",
    description: "Instant chemical emulsion look with soft turquoise cast and milky fade.",
    values: { fade: 28, warmth: 12, tint: -8, contrast: 94, exposure: 0.1 },
  },
  {
    name: "Grain",
    category: "Retro & Film",
    description: "Raw textured analog 35mm ISO 800 film grain with tactile grit.",
    values: { grain: 48, contrast: 108, sharpness: 18, fade: 12 },
  },
  {
    name: "Super 8",
    category: "Retro & Film",
    description: "Whimsical home-movie patina with golden lens bloom and dusty edges.",
    values: { warmth: 34, saturation: 110, lightLeak: 25, grain: 36, vignette: 28 },
  },

  // 4. Warm & Romantic
  {
    name: "Warm",
    category: "Warm & Romantic",
    description: "Gentle golden-hour sunbeams embracing skin with healthy honey glow.",
    values: { warmth: 32, saturation: 106, brightness: 104, red: 10 },
  },
  {
    name: "Coquette Rose",
    category: "Warm & Romantic",
    description: "Blushing pink pastels with delicate petal highlights and porcelain finish.",
    values: { red: 22, tint: 24, warmth: 14, brightness: 106, glow: 20 },
  },
  {
    name: "Sunset Kiss",
    category: "Warm & Romantic",
    description: "Deep apricot twilight radiance with passionate amber and magenta undertones.",
    values: { warmth: 45, red: 26, saturation: 120, contrast: 108, lightLeak: 15 },
  },
  {
    name: "Candlelight",
    category: "Warm & Romantic",
    description: "Intimate flickering hearth glow with deep golden shadows and soft contrast.",
    values: { warmth: 52, contrast: 96, brightness: 98, shadows: 14, red: 18 },
  },
  {
    name: "Honey Meadow",
    category: "Warm & Romantic",
    description: "Sun-drenched wildflowers with gentle warmth and soft creamy highlights.",
    values: { warmth: 26, green: 10, brightness: 107, vibrance: 14, fade: 10 },
  },

  // 5. Cool & Minimal
  {
    name: "Cool",
    category: "Cool & Modern",
    description: "Refreshing glacial breeze with tranquil cobalt and pristine whites.",
    values: { warmth: -32, blue: 18, contrast: 106, brightness: 103 },
  },
  {
    name: "Nordic Minimal",
    category: "Cool & Modern",
    description: "Scandinavian interior styling with neutral slate tones and restrained colors.",
    values: { warmth: -18, saturation: 82, contrast: 98, brightness: 105, whites: 16 },
  },
  {
    name: "Cyber Neon",
    category: "Cool & Modern",
    description: "Electric futuristic cyan and violet palette with punchy contrast.",
    values: { blue: 28, tint: 20, saturation: 135, contrast: 125, sharpness: 22 },
  },
  {
    name: "Midnight City",
    category: "Cool & Modern",
    description: "Moody metropolis night vibes with deep indigos and crisp lamp highlights.",
    values: { warmth: -40, blue: 22, blacks: -18, contrast: 122, brightness: 94 },
  },
  {
    name: "Tokyo Rain",
    category: "Cool & Modern",
    description: "Reflective puddle shimmer with cool blues and neon magenta accents.",
    values: { warmth: -24, tint: 16, saturation: 112, brightness: 101, glow: 18 },
  },

  // 6. Cinematic & Drama
  {
    name: "Cinematic",
    category: "Cinematic",
    description: "Blockbuster teal and orange grade with Hollywood shadow depth.",
    values: { warmth: 18, blue: 12, contrast: 124, saturation: 112, vignette: 25 },
  },
  {
    name: "Wong Kar-wai",
    category: "Cinematic",
    description: "Lush Hong Kong neon nostalgia with emerald shadows and amber glow.",
    values: { green: 22, red: 16, warmth: 20, saturation: 126, glow: 26 },
  },
  {
    name: "French New Wave",
    category: "Cinematic",
    description: "Café romance atmosphere with organic contrast and Parisian sunlight.",
    values: { contrast: 116, fade: 14, warmth: 12, grain: 24, saturation: 96 },
  },
  {
    name: "Indie Film",
    category: "Cinematic",
    description: "Sundance festival signature look with matte greens and warm skin tones.",
    values: { green: 14, warmth: 15, fade: 22, contrast: 102, saturation: 90 },
  },
  {
    name: "Night",
    category: "Cinematic",
    description: "Deep atmospheric twilight with controlled noise reduction and neon pop.",
    values: { brightness: 92, contrast: 118, saturation: 110, vignette: 32, warmth: -12 },
  },

  // 7. Soft & Dreamy
  {
    name: "Dreamy",
    category: "Soft & Dreamy",
    description: "Heavenly diffusion bloom with ethereal glow and feathery edges.",
    values: { brightness: 110, contrast: 90, glow: 42, blur: 0.6, saturation: 108 },
  },
  {
    name: "Pastel",
    category: "Soft & Dreamy",
    description: "Cotton candy daydream with lightened shadows and muted sherbet hues.",
    values: { brightness: 112, saturation: 85, contrast: 88, fade: 22, whites: 18 },
  },
  {
    name: "Angelic Mist",
    category: "Soft & Dreamy",
    description: "Silky pearlescent fog that diffuses bright highlights into luminous clouds.",
    values: { brightness: 115, contrast: 82, glow: 50, blur: 0.8, warmth: 6 },
  },
  {
    name: "Fade",
    category: "Soft & Dreamy",
    description: "Gently washed matte finish lifting the bottom end of the tone curve.",
    values: { fade: 38, contrast: 92, saturation: 94, brightness: 104 },
  },
  {
    name: "Marshmallow",
    category: "Soft & Dreamy",
    description: "Fluffy dessert aesthetic with cream whites and subtle confectionery tint.",
    values: { brightness: 114, warmth: 10, tint: 8, contrast: 86, saturation: 96 },
  },

  // 8. Playful & Vibrant
  {
    name: "Bright",
    category: "Playful & Pop",
    description: "Sunburst clarity with energized luminous midtones and vivid smile pop.",
    values: { brightness: 120, saturation: 118, contrast: 108, vibrance: 22 },
  },
  {
    name: "Contrast",
    category: "Playful & Pop",
    description: "Sharp graphic impact with punchy dynamic range and bold presence.",
    values: { contrast: 138, brightness: 102, saturation: 110, sharpness: 24 },
  },
  {
    name: "Y2K Glitz",
    category: "Playful & Pop",
    description: "Early 2000s digicam flash sparkle with high saturation and iridescent pop.",
    values: { saturation: 132, brightness: 110, contrast: 122, sharpness: 32, glow: 15 },
  },
  {
    name: "Candy Pop",
    category: "Playful & Pop",
    description: "Bubblegum sweetness with magnified color vitality and zesty saturation.",
    values: { saturation: 142, vibrance: 35, contrast: 115, red: 12, brightness: 106 },
  },
  {
    name: "Sunny Day",
    category: "Playful & Pop",
    description: "Picnic in the park ambiance with azure skies and bright golden grass.",
    values: { warmth: 22, saturation: 124, brightness: 109, vibrance: 20, contrast: 106 },
  },
  {
    name: "Lollipop",
    category: "Playful & Pop",
    description: "High-key candy shop colors with playful magenta and lime vibrancy.",
    values: { saturation: 148, tint: 14, contrast: 118, exposure: 0.2, whites: 14 },
  },

  // 9. Mood & Specialty
  {
    name: "Moody Forest",
    category: "Atmospheric",
    description: "Pine needles under evergreen canopy with deep shadowy mystique.",
    values: { green: 24, warmth: -16, saturation: 88, contrast: 114, vignette: 28 },
  },
  {
    name: "Velvet Plum",
    category: "Atmospheric",
    description: "Rich aristocratic burgundy and eggplant tones with theatrical lighting.",
    values: { red: 24, blue: 18, warmth: 8, contrast: 126, vignette: 30 },
  },
  {
    name: "Amber Light",
    category: "Atmospheric",
    description: "Sun flare prism leak dancing across the photograph with warm radiance.",
    values: { warmth: 38, lightLeak: 45, exposure: 0.12, brightness: 106, red: 16 },
  },
  {
    name: "Retro Vinyl",
    category: "Atmospheric",
    description: "Lofi record sleeve patina with vinyl scratches, warm hum, and cozy vibe.",
    values: { scratches: 35, grain: 30, warmth: 24, contrast: 104, fade: 16 },
  },
  {
    name: "Analog Dust",
    category: "Atmospheric",
    description: "Found attic photograph with light leaks, flecks of dust, and warm history.",
    values: { scratches: 42, lightLeak: 32, grain: 38, warmth: 26, fade: 20 },
  },
  {
    name: "Emerald Bloom",
    category: "Atmospheric",
    description: "Vibrant lush botanical green cast with elevated shadow luminance.",
    values: { green: 28, exposure: 0.08, saturation: 112, brightness: 105, contrast: 102 },
  },
]

export const filterValues: Record<string, Partial<Adjustments>> = Object.fromEntries(
  filterPresets.map((p) => [p.name, p.values]),
)
