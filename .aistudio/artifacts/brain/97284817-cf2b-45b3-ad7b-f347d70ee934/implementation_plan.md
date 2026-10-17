# Virtual Photo Booth UI/UX Redesign & Template Engine

A comprehensive redesign of the Virtual Photo Booth application transforming it into an adaptive, tactile creative studio inspired by modern aesthetic photobooth web experiences. This plan establishes a unified design system, organizes and maps all 86 reference images into high-fidelity editable templates, and delivers an intuitive 7-step template selection and photo customization workflow.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions have been confirmed through Phase 1 clarification:

- **Confirmed Decision 1 (CodePen Reference)**: The user will paste the CodePen HTML/CSS/JS or styling details into chat. The initial visual architecture integrates a playful pastel retro-booth aesthetic (creamy paper background `#faf8f2`, tactile cards, soft warm borders, vintage typography pairings, camera viewfinder accents, and smooth interactive states). Once pasted, any additional specific micro-interactions or tokens from the CodePen will be seamlessly integrated.
- **Confirmed Decision 2 (Device Experience)**: Adaptive responsive design. The UI is built touch-first with 44px+ hitboxes and bottom sheets for mobile smartphones (375px–430px), while expanding naturally to a multi-column desktop studio layout (1200px–1440px) without cramped mobile-only containers.
- **Confirmed Decision 3 (Template Discovery)**: A grid gallery featuring dual-axis multi-attribute filtering (Vibes/Styles: *Romantic, Retro Film, Cute & K-Pop, Y2K Nostalgia, Scrapbook, Minimalist Monochrome*; and Photo Counts: *1, 2, 3, 4, 5, 6, 8, 9 photos*), instant keyword search, and favorites.

---

### 1. Overview & Core Concept

- **What It Does**: A creative virtual photobooth and scrapbooking studio where users can capture live camera snapshots or upload personal photos, browse a gallery of curated photo-strip and collage templates derived from actual visual references, assign photos to individual slots, customize borders, backgrounds, stickers, and text, and export print-ready high-resolution memories.
- **Target Audience / Persona**: Friends, couples, and creative individuals creating aesthetic photo strips, digital scrapbooks, and memorable keepsakes for social sharing and printing.
- **Key Value**: Bridges the gap between realistic photo booth hardware and flexible digital customization—delivering instant gratification with authentic paper textures, vintage film filters, and precise per-slot photo editing.

---

### 2. User Experience & Visual Design

#### The 7-Step Template-to-Creation Workflow

```
[ Step 1: Browse ] ────────> [ Step 2: Preview ] ────────> [ Step 3: Insert Photos ]
   Dual-filter grid            Large template card            Live camera burst or
   86 curated styles           Slot count & preview           file gallery upload
          │
          ▼
[ Step 4: Assign Slots ] ──> [ Step 5: Edit Photos ] ────> [ Step 6: Customize ] ──> [ Step 7: Export ]
   Drag / tap to map           Independent zoom, pan,         Stickers, washi tape,    PNG / JPEG
   photos to exact slots       crop, rotate & flip            custom text & borders    Hi-res print
```

1. **Step 1 — Browse Templates**: Users navigate a rich visual gallery showing authentic template compositions with live thumbnails, photo count badges (e.g. `4 CUTS`, `DUO`, `GRID 9`), aspect ratio indicators, and vibe tags.
2. **Step 2 — Select & Preview Modal**: Tapping any card opens a high-resolution preview modal revealing slot geometries, suggested photo themes, aspect ratio, and a primary `Use This Template` CTA.
3. **Step 3 — Insert Personal Photos**: Seamlessly choose between taking live bursts with the photobooth camera (with 3s countdown, mirror mode, flash toggle, and filters) or batch uploading from the device.
4. **Step 4 — Match Photos to Template**: Visual slot-matching interface showing the template layout alongside captured/uploaded photo drawer. Users tap or drag photos directly into target slots (Slot 1, 2, 3, etc.).
5. **Step 5 — Independent Photo Editing**: Selecting any slot opens targeted contextual controls:
   - Pan/reposition (drag inside clipping mask)
   - Zoom & crop scale slider (1.0x to 3.0x)
   - Rotate in 90° increments or fine-angle tilt
   - Horizontal and vertical flip
   - Replace single photo without resetting other slots
6. **Step 6 — Customize the Composition**:
   - Background colors, paper textures (kraft, newsprint, vintage grain, pastel grid, dreamy gradient)
   - Decorative borders (rounded corners, Polaroid frames, film perfs, dashed stitch)
   - Sticker library (cherries, bows, stars, sparkles, vintage timestamps, doodle hearts, tape strips)
   - Editable typography and custom anniversary/date captions
7. **Step 7 — Preview & Export**: Final rendering preview at 100% scale with format options (PNG / JPEG), quality settings, and one-tap download or direct share.

#### Visual Identity & Theme

- **Aesthetic Direction**: Nostalgic pastel photobooth meets modern tactile Japanese/Korean purikura studio. Warm paper textures, refined rounded geometry, subtle drop shadows, and clean metadata.
- **Color Palette**:
  - Canvas Paper: `#fbf9f4` / `#f4f1e8`
  - Text & Ink: `#2e2f2b` (Deep warm charcoal)
  - Muted Metadata: `#7a7d73`
  - Warm Accent (Coral / Persimmon): `#d97762`
  - Sage Olive Accent: `#8c9c77`
  - Soft Butter Yellow: `#fef3c7`
  - Subtle Dividing Lines: `#e2e4d8`
- **Typography**:
  - Display & Headings: `DM Sans` (500–600 weight) with tight letter-spacing.
  - Handwritten Accents & Stickers: `Caveat` cursive for authentic booth signatures and doodles.
  - Body & UI: `DM Sans` with legible 14px/16px baseline and WCAG AA contrast.
- **Ergonomics & Layout Density**:
  - Touch targets $\ge 44\text{px}$ on all buttons, tabs, and swatch selectors.
  - Mobile bottom navigation bar within the natural thumb zone (<15% total screen height).
  - Desktop responsive view featuring a persistent left preview canvas and right inspector dock.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Template Gallery Inventory & Editable Construction
- *Chosen Approach*: Inventory all 86 reference images in `Images/` into structured template presets. Each template specifies exact proportional slot coordinates (`x`, `y`, `width`, `height` in normalized percentage values), aspect ratio, default background, border styling, and initial decorative elements. The actual high-res reference images serve as authentic gallery preview thumbnails, while the canvas renderer generates pristine, sharp vector clipping masks and layered compositions.
- *Why*: The user emphasized that thumbnails and editable templates are separate; placing a flattened reference behind black rectangles is unacceptable. Constructing real mathematical slot layouts ensures pixel-perfect clipping and sharp exports regardless of photo resolution.

#### Decision 2: Independent Per-Photo Transformations
- *Chosen Approach*: Enhance `Composition` and `Photo` data structures to store per-photo adjustments (`cropOffset: {x, y}`, `zoom: number`, `rotation: number`, `flipHorizontal: boolean`, `flipVertical: boolean`, `filter: FilterName`).
- *Why*: In a 4-cut strip or 9-photo collage, each shot requires different framing, zoom, or centering without altering neighboring slots.

#### Decision 3: Adaptive Viewport Architecture
- *Chosen Approach*: Single unified React application with Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`) and CSS Grid. On screens $<768\text{px}$, the editor uses swipeable bottom sheets and a sticky bottom toolbar. On screens $\ge 1024\text{px}$, it expands into a two-column desktop studio with live side-by-side canvas and tool tabs.
- *Alternatives Considered*: Separate mobile and desktop pages were rejected because maintaining dual state machines risks synchronization bugs and bloated bundle size.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App Root (src/App.tsx)                        │
│   Active Page State: 'home' | 'templates' | 'camera' | 'editor' | etc. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│       Template Gallery       │              │        Capture Engine        │
│  - Multi-category filter     │              │  - MediaDevices camera burst │
│  - Photo count pills (1-9)   │              │  - Countdown timer & sound   │
│  - Search & Favorites        │              │  - Gallery file drop/picker  │
│  - Preview & Select modal    │              │  - Captured photo reel       │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      ▼
               ┌─────────────────────────────────────────────┐
               │         Studio Editor (src/studio/)         │
               │  - Template slot layout & clipping engine   │
               │  - Independent per-photo zoom/pan/rotate    │
               │  - Color filters & tone adjustments         │
               │  - Sticker & doodle overlay management      │
               │  - IndexedDB draft saving & undo/redo       │
               └──────────────────────┬──────────────────────┘
                                      ▼
               ┌─────────────────────────────────────────────┐
               │    Canvas 2D Compositor (src/rendering.ts)   │
               │  - Multi-layer composition render pipeline  │
               │  - High-DPI export generator (PNG / JPEG)   │
               └─────────────────────────────────────────────┘
```

#### Core Data Entities

- **`PhotoTemplate`**: Unique ID, localized name, vibe category, aspect ratio (`width`, `height`), slot definitions array `SlotDef[]`, default background, border radius, frame inset, and preview thumbnail URL.
- **`SlotDef`**: `x`, `y`, `width`, `height`, `borderRadius`, `rotation` (for playful tilted polaroids).
- **`PhotoSlot`**: Slot index, assigned photo URL/data, zoom scale (`1.0`–`3.0`), pan offset `{ x, y }`, rotation (`0`, `90`, `180`, `270`), flip state, and applied filter.
- **`StickerItem` & `TextItem`**: Position `{ x, y }`, scale, rotation, layer z-index, and content.
- **`Composition`**: Complete reproducible JSON blueprint saved in IndexedDB and localStorage for instant session recovery.
