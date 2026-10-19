# Authentic Photobooth Thumbnail & Dark Film Strip Showcase

A comprehensive implementation plan to showcase authentic photobooth strip covers from the local `/images` folder, prioritizing popular 4-cut couple strips and styling template cards as dark film strip keepsakes with authentic hashtag captions.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 clarification:
> - **Template Ordering**: Feature popular 4-cut couple strips first (including the Minions, Zootopia, dark white-border, red-thread, and bright warm booth strips from the uploaded reference screenshot), followed by the remaining authentic keepsakes.
> - **Visual Card Aesthetic**: Dark film strip cards with raw hashtag typography (`#4 #love #romantic #kiss #pose #couple ♡...`), matching the exact look and aspect ratios in the user's screenshot.
> - **Zero Synthetic/Dummy Assets**: All covers, thumbnails, and preview cards exclusively use the authentic physical photos in `Images/` (`#cool #animated #romantic`, `#propose #love #greeting #years #birthday`, `#romantic #love #kisspose #asthetic`).

- **Confirmed Decision 1**: Prioritize 4-cut romantic & animated photo strips at the top of the homepage hero, featured layouts row, and default catalog sorting.
- **Confirmed Decision 2**: Dark cinematic film strip card presentation with exact hashtag titles, high-contrast borders, and authentic photobooth strip proportions.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the template gallery, hero showcase, and Studio layout selector from artificial illustration placeholders into a showcase of real photobooth strips directly loaded from the project's local `images` folders.
- **Target Audience**: Photobooth visitors, couples, and friends looking for authentic Korean-style 4-cut and multi-cut inspiration for their photos.
- **Key Value**: Delivers immediate realism and visual appeal by displaying actual printed photobooth strips with real poses, props, animated characters (Zootopia, Minions), and aesthetics.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Homepage Hero Strip**: Displays the popular 4-cut couple keepsake strip (`#4 #love #romantic #kiss #pose #couple ♡ #blur #fun` with red thread or Minions/Zootopia) framed in a crisp photobooth strip container.
2. **Featured Layouts Row**: Displays a horizontal carousel and grid of dark film strip cards, leading directly with the 5 reference strips from the user's screenshot:
   - `#4 #love #romantic #kiss #pose #couple ♡ #blur #animated #fun` (Couple + Minions)
   - `#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #zootopia🍄#fun` (Couple + Zootopia)
   - `#4 #love #romantic #kiss #pose #couple ♡ #blur #dark #fun` (White-border couple strip)
   - `#4 #love #romantic #kiss #pose #couple ♡ #blur #fun` (Red thread couple strip)
   - `#4 #love #romantic #kiss #pose #couple ♡ #bright #fun` (Bright warm booth strip)
3. **Template Card Typography**: Each card features:
   - Deep charcoal/black frame (`#18181b` / `#121212`)
   - Tall photobooth aspect ratio (~1:2.4)
   - Clean, unboxed hashtag caption below the strip in monospace/grotesque typography (`text-xs text-stone-300 font-mono tracking-tight leading-relaxed`)
   - Direct "Use Template" action to launch the camera booth or editor with matching slot geometry.
4. **Studio Layout Picker**: Mini thumbnails in the studio sidebar show the authentic photo strips with clear active highlight borders.

### Visual Identity & Theme
- **Background Atmosphere**: Rich dark gallery canvas (`bg-stone-950` / `bg-[#141416]`) for the strip gallery section with warm paper accents (`#faf8f0`) across vintage editorial sections.
- **Card Framing**: Crisp dark borders (`border-stone-800`), subtle drop shadow (`shadow-lg`), and 2px border radius mimicking real printed photo cardstock.
- **Typography**: Clean monospace text for hashtags (`font-mono text-[11px] leading-snug text-stone-300`), eliminating static candy-colored badge pills in accordance with the design guidelines.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Curated 4-Cut Priority Ordering in `src/templates.ts`**
  - *Chosen Approach*: Reorder the template catalog so the featured 4-cut couple strips shown in the reference screenshot appear at index 0–4, ensuring first-time visitors and default sorting immediately see the most realistic strips.
  - *Why*: Directly aligns with the user's screenshot and confirmed preference, maximizing initial engagement and realism.
  - *Alternatives Considered*: Pure alphanumeric ordering by folder name (rejected because it places single-cut solo photos ahead of popular 4-cut strips).

- **Decision 2: Dark Film Strip Card Design Pattern**
  - *Chosen Approach*: Implement a dedicated dark photobooth card styling with authentic strip margins, vertical aspect ratios, and clean multi-line hashtag captions.
  - *Why*: Recreates the authentic photobooth display board aesthetic shown in the user's uploaded screenshot.

- **Decision 3: Zero Remote / Zero Synthetic Policy**
  - *Chosen Approach*: Enforce that `TemplateThumbnail` and template definitions only reference `/images/...` paths decoded through the Vite middleware.
  - *Why*: Guarantees that neither SVG fallbacks nor external URLs will replace the user's local photography assets.

---

## 4. Technical Architecture & Data Strategy

### Component Hierarchy & Asset Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                      Physical Assets                         │
│  /images/#cool #animated #romantic/ (16 JPEGs)              │
│  /images/#propose #love #greeting #years #birthday/ (14 JPEGs)│
│  /images/#romantic #love #kisspose #asthetic/ (31 JPEGs)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vite Local Images Plugin                     │
│  - Decodes URL fragments (%23, spaces, symbols)             │
│  - Streams exact local JPEGs with Cache-Control & headers   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           templateImageMap.ts & templates.ts Registry       │
│  - Priority index 0–4: 5 reference 4-cut strips from screenshot│
│  - Total 61 curated authentic photobooth templates          │
│  - resolveTemplateLocalAsset maps IDs to local /images/ paths│
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│     TemplateThumbnail.tsx    │    │      FilmStripCard.tsx       │
│ - Strict local /images/ URL  │    │ - Dark cardstock container   │
│ - Shimmer loading skeleton   │    │ - Photobooth aspect ratio    │
│ - Zero generated fallbacks   │    │ - Hashtag caption below      │
└──────────────┬───────────────┘    └──────────────┬───────────────┘
               │                                   │
               ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│              App.tsx Views & Studio.tsx Picker              │
│  - Hero approved keepsake strip                             │
│  - Featured Layouts row (popular 4-cuts leading)            │
│  - Browse All 61 templates catalog                          │
│  - Interactive Studio layout switcher                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Execution Steps
1. **Template Catalog Ordering (`src/templates.ts`)**:
   - Position the 5 flagship 4-cut couple strips from the user's screenshot at indices 0–4.
   - Maintain the full collection of 61 authentic templates.
2. **Template Card Presentation (`src/App.tsx` & `src/components/TemplateThumbnail.tsx`)**:
   - Refactor featured and catalog card layouts to render the dark film strip aesthetic with full vertical strip framing and raw hashtag typography.
3. **Studio Layout Picker Integration (`src/studio/Studio.tsx`)**:
   - Enhance the layout switcher buttons to display photobooth strip miniatures with sharp selection indicators.
4. **Verification**:
   - Run compilation and verify that all 61 covers load properly with HTTP 200 from `/images/...`.
