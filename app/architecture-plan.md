# Little Moments — Android Application Architectural Blueprint

**Version:** 1.0.0-PROPOSAL  
**Target Platform:** Android 10+ (API Level 29–35), Optimized for Mobile Phones, Foldables, and Android Tablets.  
**Design System Origin:** Stitch AI Project `13210122587548409148` (`Little Moments Creative Studio`)

---

## 1. Executive Summary & Intent
The Little Moments Android Application brings the authentic charm of modern Korean self-photo kiosks (Life Four Cuts / 인생네컷, Haru Film, Photoism) and Japanese 90s Purikura arcades into a native mobile & tablet experience. 

It preserves the **exact tactile paper & scrapbook theme** of Little Moments while leveraging native Android capabilities (CameraX hardware acceleration, ultra-wide selfie sensors, pressure/gesture stylus input, offline image processing, and direct offline QR code sharing).

---

## 2. Core Theme & Design System (Strictly Enforced)

> [!IMPORTANT]
> The visual theme strictly adheres to the Little Moments design system established in Stitch AI. No generic Material blue/purple defaults or flat sterilizations are permitted.

### 2.1 Color Palette
| Token | Hex Value | Semantic Role in Android UI |
|---|---|---|
| **Base Canvas** | `#f8f6f0` | Warm textured ivory paper background across all screens |
| **Surface Card** | `#faf8f2` | Pressed cream cardstock for photo cards, modals, and sheets |
| **Surface Recessed** | `#efece4` | Muted cardboard wells, slider troughs, and inactive segments |
| **Primary Accent** | `#42131b` | Rich Maroon for arcade shutter, primary buttons, and focal borders |
| **Secondary Accent** | `#d97762` | Soft Coral for heart tags, favorite badges, and sticker highlights |
| **Tertiary Accent** | `#f59e0b` | Warm Amber for countdown timer, stars, and active filter halos |
| **Ink Stroke** | `#1f1d1a` | Carbon ink line replacing digital black (1.5px–2px crisp borders) |
| **Ink Muted** | `#6e695f` | Secondary metadata labels, timestamps, and camera parameters |

### 2.2 Tactile Skeuomorphic Elevation & Shadows
- **Level 1 (Cards & Mounted Prints):** `border: 1.5dp solid #1f1d1a`, mechanical hard offset `2dp 2dp 0dp rgba(31, 29, 26, 0.15)`.
- **Level 2 (Interactive Floating Actions & Shutter):** `border: 2dp solid #1f1d1a`, drop offset `0dp 4dp 0dp #1f1d1a`. Mechanical press animation translates `(0dp, 2dp)` with tactile haptic tick.
- **Accents:** Perforated tear lines between strip frames, washi-tape banners tilted at `-4°` to `+6°`, and scalloped kiosk date stamps.

### 2.3 Typography Hierarchy
- **Display & Section Titles:** `Epilogue` / `Playfair Display` (Bold, ink-trapped, editorial punch).
- **Body & Controls:** `Plus Jakarta Sans` / `DM Sans` (Clean, highly legible on handhelds).
- **Metadata & Technical:** `Space Grotesk` / `JetBrains Mono` (Camera readouts, ISO, barcodes, timestamps).
- **Handwritten Accents:** `Caveat` / `Gochi Hand` (Authentic doodles, personal signatures, scrapbook notes).

---

## 3. Stitch AI Screen Designs

The following 3 comprehensive screens have been generated in Stitch AI for your direct review:

### Screen 1: Home & Keepsake Studio (`MOBILE`)
- **Stitch Screen ID:** `376d00e7c85444ce8a0835c51434d314`
- **Features:**
  1. **Top Bar:** Warm cursive logo, saved count badge (`12 Saved`), settings gear.
  2. **Hero Photobooth Launcher:** Live viewfinder preview card, `Take 4-Cut Strip` glowing CTA, timer selector pill (`3s Timer • 4 Continuous Takes`), ultra-wide camera toggle.
  3. **Tactile Quick Action Row:** Open Camera Booth, Import Gallery Photos, Purikura Arcade 90s, Templates Catalog (61+).
  4. **Trending 4-Cut Strips Carousel:** Horizontal cards for *K-Booth Classic Noir*, *Haru Cloud Mist*, *Y2K Denim & Lace*, *Purikura Sparkle*.
  5. **Recent Keepsakes Strip:** Realistic printed 4-cut vertical strip with organic paper tilt, serial `#LM-8832`, and instant `Scan to Save` QR code modal.
  6. **Tactile Bottom Navigation:** Home, Photobooth, Studio Editor, My Keepsakes.

### Screen 2: Live Photobooth & 4-Cut Burst (`MOBILE`)
- **Stitch Screen ID:** `5560a5d4a8cc49b1a9e17f39ef69ec28`
- **Features:**
  1. **Arcade Controls Header:** Countdown timer pills (`3s`, `5s`, `10s`), audio beeps toggle (`ON`), multi-state flash toggle, 3x3 grid toggle.
  2. **Live Viewfinder (4:5 / 1:1):** Corner crosshair crop reticles, live camera stream with subtle vintage film grade preview, `🔴 LIVE SENSOR READY • TAKE 2 OF 4`.
  3. **Floating 4-Cut Live Assembly Rail:** Docked vertical strip showing real-time slot filling (Frame 1 captured with deco stamp, Frame 2 active live, Frames 3 & 4 pending dotted slots).
  4. **Film Preset Quick Strip:** Horizontal scrollable preset swatches (*Original Clean*, *Haru Film Cool*, *Retro 90s Grain*, *Studio Warm Peach*, *Mono High-Contrast*).
  5. **Tactile Arcade Shutter Area:** Large circular maroon `#42131b` push button with concentric gold `#f59e0b` ring and mechanical physical depression. Camera flip button (`0.5x / 1x`) on left, Voice trigger (`"Kimchi!"`) on right.

### Screen 3: Studio Workbench & Strip Customizer (`TABLET` / Foldable)
- **Stitch Screen ID:** `68519ef38b0e4bb98e537a7db5efe573`
- **Features:**
  1. **Dual-Pane Tablet Workbench:**
     - **Left/Center:** Textured paper desk with multi-cut photobooth strip, transform handles (rotation pin, 4 corner resize handles, quick actions pill: Swap Cut, Crop, Filter). Floating canvas tools: Zoom, Undo, Redo, Safe Margin guide, Layout switcher (4-Cut Classic, Wide 2x2, Grid 6-Cut, Square 1:1).
     - **Right:** Docked Inspector toolbelt with 6 tabs: *Templates (61+)*, *Frames (500+)*, *Filters (48+)*, *Stickers (390+)*, *Text & Doodles*, *Background*.
  2. **Direct Offline QR Transfer & High-Res Print Modal:**
     - Instant high-contrast QR code generation allowing any nearby phone to tap/scan and download the 4K strip image and 8-second animated burst clip (`.mp4`) offline without cloud server dependency.
     - 300 DPI print-ready PDF export and Bluetooth kiosk transfer.

---

## 4. Technical Architecture for `app/`

### 4.1 Technology Stack
- **Language:** Kotlin 2.1+
- **UI Toolkit:** Jetpack Compose with Material 3 customized to Little Moments Design System.
- **Camera Subsystem:** Jetpack CameraX (ImageCapture, Preview, VideoCapture for boomerang live burst).
- **Graphics & Rendering Engine:** Custom Skia/Canvas engine (`androidx.compose.ui.graphics.Canvas`) mirroring `src/rendering.ts` with 100% pixel-parity.
- **Image Processing & Filtering:** RenderScript / Vulkan shader acceleration for the 48 authentic vintage & Korean film recipes.
- **Local Persistence:** Room Database for saved projects, strip drafts, and user stickers.
- **Barcode & QR Subsystem:** Embedded lightweight QR matrix engine for offline zero-latency transfer.

### 4.2 Module Organization
```
app/
├── build.gradle.kts
├── architecture-plan.md
├── README.md
└── src/
    └── main/
        ├── AndroidManifest.xml
        ├── java/com/littlemoments/app/
        │   ├── MainActivity.kt
        │   ├── LittleMomentsApp.kt
        │   ├── camera/
        │   │   ├── CameraManager.kt          // CameraX viewfinder & sensor switching
        │   │   ├── BurstController.kt        // Multi-shot countdown, audio beeps, flash
        │   │   └── AudioCuePlayer.kt         // Authentic Korean kiosk sound beeps
        │   ├── canvas/
        │   │   ├── StripRenderer.kt          // Port of src/rendering.ts to Skia/Compose
        │   │   ├── FilterPipeline.kt         // 48 non-destructive film filters
        │   │   └── TransformGestureEngine.kt // Rotation, pinch-to-zoom, pan, snap
        │   ├── data/
        │   │   ├── TemplateRepository.kt     // 61+ templates (15 K-Booth, Purikura, 500 frames)
        │   │   ├── StickerRegistry.kt        // 390 authentic vector & doodle stickers
        │   │   └── ProjectDao.kt             // Local draft & keepsake storage
        │   ├── ui/
        │   │   ├── home/HomeScreen.kt
        │   │   ├── booth/PhotoboothScreen.kt
        │   │   ├── studio/StudioWorkbenchScreen.kt
        │   │   ├── export/QrExportDialog.kt
        │   │   └── components/
        │   │       ├── ArcadeShutterButton.kt
        │   │       ├── TactilePaperCard.kt
        │   │       ├── MiniStripTrack.kt
        │   │       └── WashiTapeHeader.kt
        │   └── theme/
        │       ├── Color.kt                  // Little Moments paper & ink tokens
        │       ├── Type.kt                   // Epilogue, Plus Jakarta Sans, Space Grotesk
        │       ├── Shape.kt                  // Tactile corner radiuses & stamps
        │       └── Theme.kt                  // LittleMomentsTheme composable
        └── res/
            ├── drawable/                     // Paper textures, stamp vector masks
            ├── font/                         // Epilogue, Caveat, Space Grotesk, DM Sans
            └── values/
                ├── strings.xml
                └── styles.xml
```

---

## 5. Next Steps (Awaiting User Review & Confirmation)

As requested, **no implementation code will be written until you have reviewed and confirmed this plan and the Stitch AI designs**.

Please review the following:
1. Does the **Tactile Editorial Skeuomorphism** aesthetic (Warm Ivory `#f8f6f0`, Crisp Ink `#1f1d1a`, Rich Maroon `#42131b`, Warm Amber `#f59e0b`) meet your vision?
2. Are the 3 planned screens (Home Discovery, Live Photobooth with 4-Cut Burst Rail, and Tablet/Mobile Studio Workbench with Offline QR Transfer) aligned with your expectations?
3. Once you give your confirmation, we will proceed to scaffold and implement the complete Android application inside `app/`.
