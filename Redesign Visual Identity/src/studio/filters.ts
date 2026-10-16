import type { Adjustments } from "../types"

export type FilterPreset = {
  name: string
  category: string
  description: string
  values: Partial<Adjustments>
}
// Explicit recipes, not aliases: all presets have distinct parameter vectors.
const recipe = (
  name: string,
  category: string,
  description: string,
  values: Partial<Adjustments>,
): FilterPreset => ({ name, category, description, values })
export const filterPresets: FilterPreset[] = [
  recipe("Original", "Natural", "Unaltered source", {}),
  recipe("Natural", "Natural", "A little clarity", {
    contrast: 104,
    saturation: 106,
  }),
  recipe("Warm", "Warm film", "Golden everyday warmth", {
    warmth: 22,
    saturation: 108,
  }),
  recipe("Cool", "Cool film", "Clean blue undertones", {
    warmth: -22,
    saturation: 104,
  }),
  recipe("Vintage", "Vintage", "Quiet amber color", {
    contrast: 92,
    saturation: 78,
    warmth: 18,
  }),
  recipe("Mono", "Black & white", "Crisp silver tones", {
    saturation: 0,
    contrast: 112,
  }),
  recipe("Sepia", "Vintage", "A warm brown print", {
    saturation: 15,
    warmth: 65,
    contrast: 94,
  }),
  recipe("Cinematic", "Cinematic", "Cool, restrained drama", {
    contrast: 122,
    saturation: 82,
    warmth: -8,
  }),
  recipe("Pastel", "Pastel", "Soft, airy colors", {
    contrast: 86,
    saturation: 82,
    brightness: 108,
  }),
  recipe("Bright", "Natural", "A lift in the light", {
    brightness: 116,
    contrast: 102,
  }),
  recipe("Contrast", "Editorial", "Deep graphic contrast", {
    contrast: 138,
    saturation: 108,
  }),
  recipe("Dreamy", "Dreamy", "A gentle luminous haze", {
    brightness: 108,
    contrast: 88,
    glow: 25,
  }),
  recipe("Fade", "Matte", "Lifted ink and soft color", {
    brightness: 106,
    contrast: 80,
    saturation: 75,
    fade: 12,
  }),
  recipe("Night", "Night", "Cool shadows after hours", {
    brightness: 82,
    contrast: 128,
    saturation: 84,
    warmth: -14,
  }),
  recipe("Grain", "Analog", "Tactile film texture", {
    contrast: 108,
    saturation: 86,
    grain: 35,
  }),
  recipe("Petal", "Portrait", "Rosy highlights, soft skin tones", {
    tint: 12,
    warmth: 9,
    highlights: -12,
    contrast: 94,
  }),
  recipe("Sunday", "Portrait", "Warm skin and open shadows", {
    shadows: 18,
    warmth: 14,
    vibrance: 12,
    exposure: 0.12,
  }),
  recipe("Porcelain", "Portrait", "Cool, quiet, luminous", {
    brightness: 107,
    saturation: 90,
    warmth: -6,
    tint: 5,
  }),
  recipe("Honey 200", "Warm film", "Golden-hour negative", {
    warmth: 32,
    grain: 15,
    highlights: -18,
    blacks: 8,
  }),
  recipe("Terracotta", "Warm film", "Earthy red-brown grade", {
    red: 12,
    blue: -10,
    saturation: 88,
    contrast: 108,
  }),
  recipe("Blue Hour", "Cool film", "Cobalt shadows and soft light", {
    blue: 18,
    red: -5,
    shadows: 10,
    contrast: 97,
  }),
  recipe("Glacier", "Cool film", "Icy, clean cyan", {
    warmth: -30,
    tint: -8,
    highlights: 9,
    saturation: 92,
  }),
  recipe("Drugstore", "Analog", "Disposable-camera nostalgia", {
    grain: 30,
    warmth: 17,
    fade: 10,
    lightLeak: 15,
  }),
  recipe("Last Roll", "Analog", "Worn negatives", {
    grain: 42,
    scratches: 24,
    contrast: 117,
    saturation: 74,
  }),
  recipe("Dusty Rose", "Vintage", "Faded rose album", {
    tint: 20,
    saturation: 70,
    fade: 22,
    warmth: 8,
  }),
  recipe("Archive", "Vintage", "A sun-worn paper print", {
    warmth: 27,
    whites: -20,
    blacks: 18,
    grain: 12,
  }),
  recipe("Teal Room", "Cinematic", "Blue-green cinema grade", {
    red: -8,
    green: 10,
    blue: 12,
    contrast: 116,
  }),
  recipe("Amber Scene", "Cinematic", "Warm light, deep blacks", {
    warmth: 24,
    blacks: -22,
    highlights: -14,
    saturation: 83,
  }),
  recipe("Lilac Milk", "Pastel", "Muted lavender wash", {
    tint: 17,
    blue: 10,
    contrast: 84,
    brightness: 110,
  }),
  recipe("Peach Soda", "Pastel", "Bright, peachy color", {
    warmth: 20,
    red: 8,
    saturation: 86,
    shadows: 20,
  }),
  recipe("Cloud Nine", "Dreamy", "Glowing soft light", {
    glow: 48,
    exposure: 0.2,
    contrast: 87,
    saturation: 90,
  }),
  recipe("Moonbeam", "Dreamy", "Cool silver diffusion", {
    glow: 32,
    warmth: -16,
    saturation: 68,
    highlights: 18,
  }),
  recipe("Silver", "Black & white", "Fine-grained monochrome", {
    saturation: 0,
    grain: 18,
    shadows: 12,
    contrast: 105,
  }),
  recipe("Noir", "Black & white", "Hard light and deep ink", {
    saturation: 0,
    contrast: 148,
    blacks: -25,
    vignette: 30,
  }),
  recipe("Newsprint", "Sketch", "Coarse ink on paper", {
    saturation: 0,
    contrast: 165,
    grain: 55,
    sharpness: 30,
  }),
  recipe("Pencil Study", "Sketch", "Pale graphite-inspired tones", {
    saturation: 0,
    brightness: 118,
    contrast: 125,
    fade: 10,
  }),
  recipe("Velvet", "Matte", "Soft matte editorial", {
    fade: 28,
    contrast: 112,
    saturation: 82,
    blacks: 12,
  }),
  recipe("Oat", "Matte", "Warm neutral matte", {
    fade: 18,
    warmth: 16,
    saturation: 64,
    whites: -12,
  }),
  recipe("Neon Cherry", "Neon", "Electric red and violet", {
    tint: 32,
    vibrance: 40,
    contrast: 122,
    blue: 12,
  }),
  recipe("Electric Mint", "Neon", "Cool green-blue glow", {
    green: 18,
    blue: 20,
    contrast: 125,
    glow: 15,
  }),
  recipe("Soft Flash", "Flash", "Bright highlights, lifted faces", {
    exposure: 0.3,
    shadows: 27,
    whites: 15,
    contrast: 109,
  }),
  recipe("Party Flash", "Flash", "Punchy disposable flash", {
    exposure: 0.18,
    contrast: 128,
    vibrance: 25,
    vignette: 24,
  }),
  recipe("Instant Cream", "Instant", "Creamy instant-film border light", {
    warmth: 12,
    fade: 14,
    shadows: 14,
    saturation: 80,
  }),
  recipe("Instant Blue", "Instant", "Cool instant-film chemistry", {
    blue: 14,
    contrast: 92,
    whites: -15,
    fade: 8,
  }),
  recipe("Studio", "Editorial", "Neutral, precise magazine color", {
    contrast: 114,
    sharpness: 25,
    saturation: 94,
    highlights: -10,
  }),
  recipe("Cover Story", "Editorial", "Bold warm print", {
    vibrance: 20,
    contrast: 122,
    warmth: 10,
    blacks: -12,
  }),
  recipe("Midnight Taxi", "Night", "Amber lights, dark streets", {
    exposure: -0.2,
    warmth: 18,
    contrast: 132,
    lightLeak: 10,
  }),
  recipe("Blue Velvet", "Night", "Velvety blue shadows", {
    blue: 22,
    brightness: 90,
    fade: 8,
    contrast: 118,
  }),
]
export const filterValues = Object.fromEntries(
  filterPresets.map((p) => [p.name, p.values]),
)
