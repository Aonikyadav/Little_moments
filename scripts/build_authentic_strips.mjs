import fs from "fs"
import path from "path"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"

const RAW_DIR = "src/assets/raw_photos"
const photoFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith(".jpg"))

console.log(`Found ${photoFiles.length} real photo assets in ${RAW_DIR}`)

// Pre-load all photos into base64 strings
const photos = {}
for (const pf of photoFiles) {
  const buf = fs.readFileSync(path.join(RAW_DIR, pf))
  const key = path.basename(pf, ".jpg")
  photos[key] = `data:image/jpeg;base64,${buf.toString("base64")}`
}

const photoKeys = Object.keys(photos)

// Helper to get photo by priority or index
function getPhoto(preferredList, fallbackIdx = 0) {
  for (const name of preferredList) {
    if (photos[name]) return photos[name]
  }
  return photos[photoKeys[fallbackIdx % photoKeys.length]]
}

const subFolders = [
  "#cool #animated #romantic",
  "#propose #love #greeting #years #birthday",
  "#romantic #love #kisspose #asthetic"
]

let totalCreated = 0

for (const folder of subFolders) {
  const srcDir = path.join("Images", folder)
  const publicDir = path.join("public/images", folder)
  fs.mkdirSync(publicDir, { recursive: true })

  const files = fs.readdirSync(srcDir)
  console.log(`\nProcessing folder "${folder}" (${files.length} files)...`)

  for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
    const filename = files[fileIdx]
    const lower = filename.toLowerCase()

    // Determine strip cut count
    const cutMatch = filename.match(/^#(\d+)/)
    const count = cutMatch ? parseInt(cutMatch[1], 10) : 4

    let width = 500
    let height = 1200

    // Theme & palette
    let bgColor = "#141416"
    let frameColor = "#ffffff"
    let footerText = "PHOTO BOOTH · MEMORIES"
    let selectedPhotos = []

    // 1. Minions couple (#4 animated fun)
    if (lower.includes("animated") && lower.includes("fun") && folder.includes("romantic")) {
      bgColor = "#141416"
      frameColor = "#ffffff"
      footerText = "MINIONS ♡ BOOTH · 2026"
      selectedPhotos = [
        getPhoto(["couple_1", "kiss_1"], fileIdx),
        getPhoto(["couple_2", "kiss_2"], fileIdx + 1),
        getPhoto(["couple_3", "kiss_3"], fileIdx + 2),
        getPhoto(["couple_4", "kiss_4"], fileIdx + 3)
      ]
    }
    // 2. Zootopia couple (#4 zootopia pink)
    else if (lower.includes("zootopia")) {
      bgColor = "#fdf2f8"
      frameColor = "#f43f5e"
      footerText = "ZOOTOPIA 🐰🦊 NICK & JUDY"
      selectedPhotos = [
        getPhoto(["couple_2", "kiss_2"], fileIdx),
        getPhoto(["couple_4", "kiss_3"], fileIdx + 1),
        getPhoto(["couple_1", "kiss_1"], fileIdx + 2),
        getPhoto(["cheek_kiss", "hug"], fileIdx + 3)
      ]
    }
    // 3. Dark white-border couple (#4 dark fun)
    else if (lower.includes("dark")) {
      bgColor = "#ffffff"
      frameColor = "#18181b"
      footerText = "MIDNIGHT BOOTH · SEOUL"
      selectedPhotos = [
        getPhoto(["dark_night", "kiss_4"], fileIdx),
        getPhoto(["couple_3", "hug"], fileIdx + 1),
        getPhoto(["couple_1", "kiss_2"], fileIdx + 2),
        getPhoto(["kiss_3", "couple_4"], fileIdx + 3)
      ]
    }
    // 4. Red thread couple (#4 blur fun)
    else if (lower.includes("blur #fun") || lower.includes("fun.jpg")) {
      bgColor = "#18181b"
      frameColor = "#fafaf9"
      footerText = "RED THREAD OF FATE ♡"
      selectedPhotos = [
        getPhoto(["kiss_1", "couple_1"], fileIdx),
        getPhoto(["cheek_kiss", "couple_2"], fileIdx + 1),
        getPhoto(["kiss_3", "couple_3"], fileIdx + 2),
        getPhoto(["hug", "couple_4"], fileIdx + 3)
      ]
    }
    // 5. Sunlit bright couple (#4 bright fun)
    else if (lower.includes("bright")) {
      bgColor = "#fdfbf7"
      frameColor = "#e4e4e7"
      footerText = "SUNLIT MOMENTS · 4-CUT"
      selectedPhotos = [
        getPhoto(["couple_2", "fun"], fileIdx),
        getPhoto(["couple_4", "besties"], fileIdx + 1),
        getPhoto(["kiss_2", "cheek_kiss"], fileIdx + 2),
        getPhoto(["bday_smile", "hug"], fileIdx + 3)
      ]
    }
    // Folder 2: Propose & Birthday
    else if (folder.includes("propose") || folder.includes("birthday")) {
      if (lower.includes("propose")) {
        bgColor = "#faf5ff"
        frameColor = "#c084fc"
        footerText = "WILL YOU MARRY ME? 💍"
        selectedPhotos = [
          getPhoto(["propose_1", "propose_moment"], fileIdx),
          getPhoto(["propose_hands", "couple_1"], fileIdx + 1),
          getPhoto(["hug", "kiss_1"], fileIdx + 2),
          getPhoto(["kiss_4", "couple_4"], fileIdx + 3)
        ]
      } else {
        bgColor = "#fffbeb"
        frameColor = "#f59e0b"
        footerText = "HAPPY BIRTHDAY 🎂 CELEBRATE"
        selectedPhotos = [
          getPhoto(["bday_1", "bday_party"], fileIdx),
          getPhoto(["bday_smile", "fun"], fileIdx + 1),
          getPhoto(["anniv_couple", "couple_2"], fileIdx + 2),
          getPhoto(["besties", "cheek_kiss"], fileIdx + 3)
        ]
      }
    }
    // Folder 1: Cool & Spider
    else if (folder.includes("cool")) {
      bgColor = "#0f172a"
      frameColor = "#38bdf8"
      footerText = "COOL VIBES 🕸️ PHOTO STRIP"
      selectedPhotos = [
        getPhoto(["cool_1", "cool_peace"], fileIdx),
        getPhoto(["cool_duo", "cool_pink"], fileIdx + 1),
        getPhoto(["purple_vibe", "fun"], fileIdx + 2),
        getPhoto(["dark_night", "besties"], fileIdx + 3)
      ]
    }
    // General Romantic & Kiss
    else {
      bgColor = "#141416"
      frameColor = "#ffffff"
      footerText = "LITTLE MOMENTS ♡ KOREAN STRIP"
      selectedPhotos = [
        getPhoto(["kiss_1", "couple_1"], fileIdx),
        getPhoto(["kiss_2", "couple_2"], fileIdx + 1),
        getPhoto(["kiss_3", "couple_3"], fileIdx + 2),
        getPhoto(["kiss_4", "couple_4"], fileIdx + 3),
        getPhoto(["cheek_kiss", "hug"], fileIdx + 4),
        getPhoto(["soft_blur", "fun"], fileIdx + 5),
        getPhoto(["besties", "purple_vibe"], fileIdx + 6),
        getPhoto(["anniv_couple", "bday_smile"], fileIdx + 7)
      ]
    }

    // Generate slots based on cut count
    let slotsSvg = ""
    const isSplitMinions = lower.includes("animated") && lower.includes("fun") && folder.includes("romantic")
    const isSplitZootopia = lower.includes("zootopia")

    if (count === 1) {
      width = 500
      height = 700
      slotsSvg = `
        <rect x="25" y="25" width="450" height="560" rx="4" fill="#000" />
        <image xlink:href="${selectedPhotos[0]}" x="25" y="25" width="450" height="560" preserveAspectRatio="xMidYMid slice" clip-path="url(#r1)" />
      `
    } else if (count === 2) {
      width = 500
      height = 1000
      slotsSvg = `
        <image xlink:href="${selectedPhotos[0]}" x="25" y="25" width="450" height="420" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[1]}" x="25" y="475" width="450" height="420" preserveAspectRatio="xMidYMid slice" />
      `
    } else if (count === 3) {
      width = 500
      height = 1200
      slotsSvg = `
        <image xlink:href="${selectedPhotos[0]}" x="25" y="25" width="450" height="340" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[1]}" x="25" y="385" width="450" height="340" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[2]}" x="25" y="745" width="450" height="340" preserveAspectRatio="xMidYMid slice" />
      `
    } else if (count === 6) {
      width = 600
      height = 1000
      slotsSvg = `
        <image xlink:href="${selectedPhotos[0]}" x="20" y="20" width="270" height="280" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[1]}" x="310" y="20" width="270" height="280" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[2]}" x="20" y="320" width="270" height="280" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[3]}" x="310" y="320" width="270" height="280" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[4] || selectedPhotos[0]}" x="20" y="620" width="270" height="280" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[5] || selectedPhotos[1]}" x="310" y="620" width="270" height="280" preserveAspectRatio="xMidYMid slice" />
      `
    } else if (count === 8) {
      width = 600
      height = 1200
      slotsSvg = `
        <image xlink:href="${selectedPhotos[0]}" x="20" y="20" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[1]}" x="310" y="20" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[2]}" x="20" y="285" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[3]}" x="310" y="285" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[4]}" x="20" y="550" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[5]}" x="310" y="550" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[6]}" x="20" y="815" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
        <image xlink:href="${selectedPhotos[7]}" x="310" y="815" width="270" height="250" preserveAspectRatio="xMidYMid slice" />
      `
    } else if (isSplitMinions) {
      // 4-cut split dual column (Couple on left, Minions on right) like screenshot #1
      width = 500
      height = 1200
      slotsSvg = `
        <!-- Cut 1 -->
        <image xlink:href="${selectedPhotos[0]}" x="20" y="20" width="220" height="255" preserveAspectRatio="xMidYMid slice" />
        <rect x="250" y="20" width="230" height="255" fill="#fde047" />
        <text x="365" y="140" font-family="sans-serif" font-weight="900" font-size="34" fill="#0284c7" text-anchor="middle">MINIONS</text>
        <text x="365" y="175" font-family="sans-serif" font-weight="bold" font-size="18" fill="#1e293b" text-anchor="middle">BELLO! ♡</text>

        <!-- Cut 2 -->
        <image xlink:href="${selectedPhotos[1]}" x="20" y="290" width="220" height="255" preserveAspectRatio="xMidYMid slice" />
        <rect x="250" y="290" width="230" height="255" fill="#fde047" />
        <circle cx="365" cy="400" r="45" fill="#0284c7" />
        <circle cx="365" cy="400" r="30" fill="#ffffff" />
        <circle cx="365" cy="400" r="14" fill="#64748b" />
        <text x="365" y="485" font-family="sans-serif" font-weight="bold" font-size="20" fill="#0f172a" text-anchor="middle">BANANA!</text>

        <!-- Cut 3 -->
        <image xlink:href="${selectedPhotos[2]}" x="20" y="560" width="220" height="255" preserveAspectRatio="xMidYMid slice" />
        <rect x="250" y="560" width="230" height="255" fill="#fde047" />
        <text x="365" y="680" font-family="sans-serif" font-weight="900" font-size="28" fill="#0284c7" text-anchor="middle">BESTIES</text>
        <text x="365" y="715" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b" text-anchor="middle">POOPAYE! ♡</text>

        <!-- Cut 4 -->
        <image xlink:href="${selectedPhotos[3]}" x="20" y="830" width="220" height="255" preserveAspectRatio="xMidYMid slice" />
        <rect x="250" y="830" width="230" height="255" fill="#0284c7" />
        <text x="365" y="945" font-family="sans-serif" font-weight="900" font-size="30" fill="#fde047" text-anchor="middle">KISS POSE</text>
        <text x="365" y="980" font-family="sans-serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">FOREVER ♡</text>
      `
    } else if (isSplitZootopia) {
      // 4-cut split dual column (Nick & Judy on left, Couple on right) like screenshot #2
      width = 500
      height = 1200
      slotsSvg = `
        <!-- Cut 1 -->
        <rect x="20" y="20" width="220" height="255" fill="#ea580c" />
        <text x="130" y="140" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">NICK 🦊</text>
        <text x="130" y="175" font-family="sans-serif" font-weight="bold" font-size="16" fill="#fed7aa" text-anchor="middle">&amp; JUDY 🐰</text>
        <image xlink:href="${selectedPhotos[0]}" x="250" y="20" width="230" height="255" preserveAspectRatio="xMidYMid slice" />

        <!-- Cut 2 -->
        <rect x="20" y="290" width="220" height="255" fill="#f43f5e" />
        <text x="130" y="410" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">TRY</text>
        <text x="130" y="445" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffe4e6" text-anchor="middle">EVERYTHING ♡</text>
        <image xlink:href="${selectedPhotos[1]}" x="250" y="290" width="230" height="255" preserveAspectRatio="xMidYMid slice" />

        <!-- Cut 3 -->
        <rect x="20" y="560" width="220" height="255" fill="#ea580c" />
        <text x="130" y="680" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">PARTNERS</text>
        <text x="130" y="715" font-family="sans-serif" font-weight="bold" font-size="16" fill="#fed7aa" text-anchor="middle">IN CRIME 🐾</text>
        <image xlink:href="${selectedPhotos[2]}" x="250" y="560" width="230" height="255" preserveAspectRatio="xMidYMid slice" />

        <!-- Cut 4 -->
        <rect x="20" y="830" width="220" height="255" fill="#a855f7" />
        <text x="130" y="950" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">ZOOTOPIA</text>
        <text x="130" y="985" font-family="sans-serif" font-weight="bold" font-size="16" fill="#f3e8ff" text-anchor="middle">LOVE ♡</text>
        <image xlink:href="${selectedPhotos[3]}" x="250" y="830" width="230" height="255" preserveAspectRatio="xMidYMid slice" />
      `
    } else {
      // Classic 4-cut vertical strip (Screenshots #3, #4, #5)
      width = 500
      height = 1200

      // Add red thread overlay if thread strip
      const redThreadSvg = lower.includes("blur #fun") || lower.includes("fun.jpg") ? `
        <path d="M 250 200 Q 320 300 230 450 T 280 750 T 250 1000" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" opacity="0.9" />
        <circle cx="250" cy="200" r="6" fill="#ef4444" />
        <circle cx="250" cy="1000" r="6" fill="#ef4444" />
      ` : ""

      slotsSvg = `
        <!-- Cut 1 -->
        <image xlink:href="${selectedPhotos[0]}" x="25" y="25" width="450" height="255" preserveAspectRatio="xMidYMid slice" />
        <!-- Cut 2 -->
        <image xlink:href="${selectedPhotos[1]}" x="25" y="295" width="450" height="255" preserveAspectRatio="xMidYMid slice" />
        <!-- Cut 3 -->
        <image xlink:href="${selectedPhotos[2]}" x="25" y="565" width="450" height="255" preserveAspectRatio="xMidYMid slice" />
        <!-- Cut 4 -->
        <image xlink:href="${selectedPhotos[3]}" x="25" y="835" width="450" height="255" preserveAspectRatio="xMidYMid slice" />
        ${redThreadSvg}
      `
    }

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <!-- Background Cardstock -->
        <rect width="100%" height="100%" fill="${bgColor}" />
        
        <!-- Slot Photos -->
        ${slotsSvg}

        <!-- Footer Keepsake Label -->
        <text x="${width / 2}" y="${height - 35}" font-family="monospace" font-size="14" font-weight="bold" fill="${bgColor === '#ffffff' ? '#18181b' : '#fafaf9'}" letter-spacing="3" text-anchor="middle" opacity="0.85">${footerText}</text>
        <text x="${width / 2}" y="${height - 18}" font-family="monospace" font-size="10" fill="${bgColor === '#ffffff' ? '#52525b' : '#a1a1aa'}" letter-spacing="2" text-anchor="middle">LITTLE MOMENTS · STUDIO</text>
      </svg>
    `

    try {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: width },
        font: { loadSystemFonts: true }
      })
      const rendered = resvg.render()
      const jpegBuffer = jpeg.encode(
        {
          data: rendered.pixels,
          width: rendered.width,
          height: rendered.height
        },
        90
      ).data

      // Save to Images/
      fs.writeFileSync(path.join(srcDir, filename), jpegBuffer)

      // Save to public/images/
      fs.writeFileSync(path.join(publicDir, filename), jpegBuffer)

      totalCreated++
    } catch (err) {
      console.error(`Failed to render ${filename}:`, err)
    }
  }
}

console.log(`\nDONE! Successfully created ${totalCreated} REAL photobooth strips in Images/ and public/images/!`)
