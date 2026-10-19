# Scrapbook Studio: Editable Memos, Themes & Washi Decoration

Upgrade the **Interactive Spiral-Bound Scrapbook Flipbook** into a full memory customization studio featuring:
1. **Editable Handwritten Memos & Sticky Notes**: Click-to-edit cursive memos, sticky note stickers, and location date stamps with automatic persistent local storage.
2. **Customizable Binder & Paper Themes**: Real-time switching between 4 tactile binder rings (silver wire-O, antique bronze, pastel lilac coil, vintage stitched leather) and 4 paper finishes (warm ivory laid, dark midnight noir, graph grid, recycled kraft).
3. **Interactive Page Decoration**: Clickable washi tape pattern cycler (glitter, strawberry, vintage newsprint, lace, gingham) and draggable botanical stamps, wax seals, and postmarks placed directly onto open book spreads.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX specifications were confirmed during Phase 1:
> - **Customization Toolbar**: A sleek floating toolbar docked right above the open scrapbook album offering quick popovers for Binder Style, Paper Finish, Sticky Note Additions, and Stamp Placement.
> - **Persistence Strategy**: All custom handwritten memos, sticky note colors, and sticker coordinates save automatically to browser storage (`localStorage`) keyed by photostrip ID, so every memory remains preserved across sessions and reloads.
> - **Interactive Washi Tape**: Clicking on any washi tape strip cycles through 8 distinct aesthetic patterns or opens a mini pattern picker.

- **Confirmed Decision 1**: Implement a lightweight local state store (`src/studio/scrapbookStore.ts`) that persists memo text, sticker placements, and page theme preferences with zero backend requirements.
- **Confirmed Decision 2**: Render realistic CSS/SVG textures for paper materials (e.g. dark midnight cardstock where typography automatically shifts to elegant chalk-white, graph grid paper, recycled kraft fibers) and metallic reflections for the binder rings.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Turns static scrapbook pages into a tactile, living memory journal.
  - Users can click on any caption under a photostrip to write their own inside jokes, anniversary dates, or heartfelt memories in authentic cursive handwriting (`Caveat`).
  - Users can pin colorful sticky notes (pastel yellow, baby pink, mint green, lavender) with checkmarks or doodles anywhere on the page spread.
  - Users can switch the physical notebook appearance—from a clean silver coil planner to a dark midnight artbook or vintage leather journal.
  - Users can swap washi tape tape textures and place vintage postmarks, wax seals, and dried flower stamps directly onto the open pages.
- **Target Audience**: Photobooth lovers, journaling enthusiasts, couples, and friends creating shared keepsakes.
- **Key Value**: Delivers the tactile, creative freedom of real physical scrapbooking on the web.

---

## 2. User Experience & Visual Design

### 1. Floating Customization Toolbar
- Docked gracefully above the scrapbook album with subtle frosted glass blur (`backdrop-blur-md bg-stone-900/90 text-white`).
- Quick interactive tool buttons:
  - **Binder Style**: `Silver Spiral` · `Antique Bronze` · `Pastel Lilac Coil` · `Vintage Stitched Leather`
  - **Paper Texture**: `Warm Ivory` · `Midnight Noir` · `Graph Grid` · `Recycled Kraft`
  - **+ Sticky Note**: Drops a pastel sticky memo onto the active page
  - **+ Stamp / Deco**: Postmark, dried daisy, red wax seal, coffee cup ring, star sparkle
  - **Reset Page**: Restores original layout if desired

### 2. In-Place Handwritten Memos
- Clicking the handwritten memo area switches from static text to a styled editable input (`font-caveat text-xl outline-none border-b border-dashed border-amber-600/50 bg-transparent`).
- Displays instant "Auto-saved" micro-indicator when typing pauses.
- Includes quick preset prompt chips: *"late night memories"*, *"date night in hongdae"*, *"laughing until 2am"*, *"forever & always ♡"*.

### 3. Washi Tape & Stamp Placement
- Clicking any washi tape header cycles through 8 authentic tape textures:
  1. *Candy Diagonal Stripe* (bubblegum pink & white)
  2. *Natural Kraft Tape* (warm fiber texture)
  3. *Pink Polka Dot* (scalloped border)
  4. *Lavender Gingham* (retro check)
  5. *Mint Green Foliage* (sage leaf pattern)
  6. *Vintage Newsprint* (botanical letterpress)
  7. *Gold Foil Glitter* (shimmering sparkle tape)
  8. *White Crochet Lace* (perforated lace trim)
- Placed stamps and sticky notes can be dragged, repositioned, or deleted with a subtle hover trash badge.

### 4. Dark Midnight & Kraft Optical Adjustments
- When `Midnight Noir` paper is selected:
  - Page surface shifts to deep charcoal slate (`#1c1a24`).
  - Memos and annotations automatically invert to luminous chalk-white (`#f8fafc`).
  - Gold and bronze binder rings gleam with metallic highlights.
- When `Recycled Kraft` is selected:
  - Page surface features warm cardboard fiber flecks (`#d7ba89`) with burnt umber ink.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct In-DOM Drag-and-Drop vs. Heavy Canvas Overlay**
  - *Chosen Approach*: Lightweight percentage-based CSS positioning (`left: x%`, `top: y%`) with pointer event drag handlers.
  - *Why*: Maintains responsive scaling across phone, tablet, and desktop viewports, preserves crisp text legibility, and allows keyboard navigation to remain 100% accessible.
- **Decision 2: Local Storage Auto-Sync**
  - *Chosen Approach*: Debounced `localStorage` serialization under `lm_scrapbook_data_v1`.
  - *Why*: Instant save with zero network overhead, persists across reloads, and works seamlessly offline.

---

## 4. Technical Architecture & System Layout

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ScrapbookAlbum Component                        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
            ┌───────▼────────┐               ┌───────▼────────┐
            │ Floating Tool  │               │ Open 2-Page    │
            │ Action Bar     │               │ Book Spread    │
            └───────┬────────┘               └───────┬────────┘
                    │                                │
        ┌───────────┴───────────┐            ┌───────┴────────┐
        │ Themes & Materials    │            │ Page Content:  │
        │ - 4 Binder Ring Styles│            │ - Photostrips  │
        │ - 4 Paper Finishes    │            │ - Editable Memo│
        │ - Sticky Note Spawner │            │ - Washi Cycler │
        │ - Deco Stamp Spawner  │            │ - Draggable Dec│
        └───────────┬───────────┘            └───────┬────────┘
                    │                                │
                    └───────────────┬────────────────┘
                                    │
                            ┌───────▼────────┐
                            │ scrapbookStore │
                            │ (localStorage) │
                            └────────────────┘
```

### Component Breakdown & File Roadmap

1. **`src/components/ScrapbookAlbum.tsx`**:
   - Incorporates the floating toolbar with theme pickers (Binder & Paper).
   - Dynamic CSS classes for paper materials and binder ring visuals.
   - Interactive washi tape click handler to cycle textures.
   - In-place memo editor with auto-save to `localStorage`.
   - Sticky note & stamp placement on left/right pages.

2. **`src/data/scrapbookDecos.ts`**:
   - SVG vector definitions for wax seals, postmarks, dried pressed flowers, coffee ring stains, and stamp decals.
   - Definitions for the 8 washi tape patterns.

3. **`src/studio/scrapbookStore.ts`**:
   - Helper utilities to get and set scrapbook page customizations per item ID.
