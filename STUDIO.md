# Little Moments — creative studio

This extends the existing React 19 / Vite / strict TypeScript application. It is
not a native Android package or a generated Figma document. The running application
is the interactive UI specification; the same screens adapt to Android-sized
viewports without replacing the original camera flow.

## Running and verification

The Figma Make development server is host-managed; do not start a second server
inside Make. Source changes hot-reload in the preview.

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests connect to the **existing** server at `http://localhost:3000`.
Set `STUDIO_TEST_URL` if your preview runs elsewhere. They do not start a server.
Camera tests use Chromium's synthetic camera, not a physical phone camera.

## Architecture

| Module | Responsibility |
| --- | --- |
| `src/types.ts` | Backward-compatible, non-destructive project model |
| `src/templates.ts` | Photo layouts: original booth templates plus 56 additional geometries |
| `src/studio/assets.ts` | Original frame/sticker registries, vector generators, background catalog |
| `src/studio/filters.ts` | 48 explicit, documented filter parameter recipes |
| `src/studio/pixels.ts` | Pure RGBA light/color operations and edge sharpening |
| `src/studio/perspective.ts` | Local mesh-based horizontal/vertical keystone correction |
| `src/rendering.ts` | Shared Canvas compositor for previews and exports |
| `src/studio/model.ts` | Layer order, transforms, grouping properties, duplication, distribution, history |
| `src/studio/storage.ts` | IndexedDB projects, including the recoverable `draft` record |
| `src/studio/Studio.tsx` | Touch canvas, contextual tools, inspector sheets, asset browsing |
| `src/studio/studio.css` | Sketchbook studio components and phone layout |

### Photo processing

New imports retain their original image data URL rather than being re-encoded to
JPG on import. Adjustments remain separate parameters. Captured camera frames use
the original booth's first JPEG encoding; subsequent edits never overwrite it.

The renderer resolves preset offsets against neutral values, then combines manual
adjustments. Manual sliders therefore still work when a filter is active.
The color pipeline includes exposure, light-range masks, channel offsets,
temperature/tint, saturation/vibrance, hue, contrast, brightness, fade, and edge
sharpening. Blur, glow, grain, vignette, light leaks, and scratches are separate
rendering operations. Geometry includes rotation, fit/fill, crop zoom/offset,
both flips, and keystone warping. These are local operations, not subject-aware AI.

Decoded images and prepared canvases use bounded caches. Prepared rasters have a
4096-pixel processing ceiling to limit memory use on phones. Exporting a larger
canvas does not invent source detail; quality depends on the original images.
Preview and export share the same pipeline, although sampling/blur/sharpening can
differ slightly at different resolutions.

### Frames are not layouts

The 500 frame recipes cover the **ten categories in the user's final brief**, 50
per category. They are procedural original SVG designs: ten border constructions
combined with five category-specific motifs. Constructions change geometry
(double edges, perforations, torn edges, stitches, washi corners, etc.), not just
colors. Tests verify unique SVG artwork even when every frame uses the same ink.

These are **500 composable decorative frame recipes, not 500 individually
art-directed photo-slot compositions**. Layouts are intentionally separate.
Their artistic diversity still needs human curation; a passing uniqueness test
does not certify 500 equally polished bespoke artworks.

Registry entries include unique IDs, original names, searchable tags, counts,
aspect ratios, layout compatibility, border/spacing defaults, decorative
construction metadata, text-field suggestions, preview SVGs, palettes, and
customization capabilities. All current frames are count/layout independent and
support the booth's 1–6, 8, and 9-photo choices.

The frame browser searches, filters category/light-dark palette, sorts, saves
favorites, and remembers recent choices. The main canvas previews the selected
frame with the user's actual layout and photos before Apply. Miniature cards
use representative arrangements of the user's photos, not an exact layout preview.
Switching a frame never changes photo sources, adjustments, or transforms.

Some vector motifs contain fixed graphic labels. These are frame artwork, not
independently editable text objects. Add a text layer for editable captions/dates.

### Stickers

There are 200 original transparent vector recipes: eight packs, 25 each.
Each pack consists of five motifs with five different vector treatments/poses.
The registry exposes the actual SVG, searchable tags, pack, and recolorability.
These are reusable procedural illustrations, not 200 externally sourced PNGs.
Search, favorites, recently used, recoloring, transform, duplicate, flip, opacity,
shadow, ordering, and image import are implemented. Imported PNG transparency is
retained. Plain-background removal is **not** implemented.

### Canvas and layers

- Guided mode: dragging a photo changes its crop, without moving its slot.
- Freeform mode: dragging changes independent photo position. Photo adjustments
  remain separate from layer geometry.
- Pinch an element to scale; drag the corner handle to resize; use the rotation
  handle or numerical sliders to rotate.
- Pinch/drag blank canvas space to navigate. Zoom-to-fit resets zoom and pan.
- Center snapping guides and optional social safe-area guides are editor-only.
- Layers support selection, naming, stacking, hiding, locking, opacity, shadow,
  normal/multiply/screen blending, duplication, deletion, and internal copy/paste.
- Grouping links element movement. It is not a nested group rasterization system.
- Three or more selected unlocked photos can be evenly distributed.
- Guided layout switching is limited to layouts that retain every current photo.
- Undo/redo retains up to 50 in-session snapshots. A canvas drag is one history
  action; slider steps currently create individual history entries.

### Saving and recovery

Projects are stored in IndexedDB, with original photo data, editable parameters,
decorations, transforms, order, and thumbnails. Autosave debounces for 650 ms and
shows unsaved/saving/saved/error states. An interrupted session can be resumed
from the Home banner. Save Project also flushes the draft before reporting
success. Saved project snapshots appear in My creations and can be edited again.
Legacy localStorage creations remain readable.

Browser storage is not a backup: clearing site data removes local projects.
Storage failures are reported; downloaded originals are never overwritten.
Undo history itself is not persisted across browser restarts.

### Export

PNG and adjustable-quality JPG export use the shared renderer and omit selection
handles, toolbars, guides, and navigation. Choose canvas dimensions, or a 3600/
5400-pixel long edge with the same aspect ratio. JPEG is flattened against the
chosen composition background. These pixel dimensions can be printed, but files
do not embed a specified print DPI or CMYK profile. PDF is not implemented.

Sharing uses the Web Share API with files on compatible Android browsers.
Unavailable file sharing falls back to download with an explanation.
This is not a native Android `Intent` implementation.

## UI/component specification

The interface retains the existing ivory paper, graphite, sage, coral, Caveat
annotations, DM Sans labels, and Lucide functional icon system. The new studio
adds restrained burgundy selection/action accents.

- **Project bar:** editable-project save status, Save Project, Export.
- **Workbench:** guided/freeform switch, safe-area toggle, separate photo canvas,
  zoom controls, photo dock, and selection-only contextual actions.
- **Touch selection:** ink outline, layer label, resize and rotation handles.
- **Tool rail:** Frames, Layout, Adjust, Filters, Stickers, Text, Background, Layers.
- **Phone inspector:** compact tool tabs with scrollable contextual settings;
  canvas stays sticky while browsing controls.
- **Frame picker:** collection chips, search, saved/recent filters, sorting,
  paginated vector cards, actual-composition preview, Apply/Cancel.
- **Adjustment sheet:** selected-photo scope, current values, per-slider reset,
  copy/paste look, apply-to-all, before/after, and reversible quick-light preset.
- **Layer sheet:** thumbnails, selected state, visibility/lock states, grouping,
  stacking/context actions, and selected-layer properties.
- **Export:** dimensions, format, JPG quality, saving feedback, download/share.

The React components/CSS are reusable implementation components, **not** Figma
Auto Layout components or a connected `.fig` prototype.

## Acceptance checklist

Automated checks cover:

- [x] Every supported photo count has valid compatible layouts.
- [x] 50 unique frame artworks in each final-brief category (500 total).
- [x] At least 40 distinct filter recipes (48 provided).
- [x] 200 unique SVG sticker recipes, 25 per pack.
- [x] Real RGBA changes for all exposed color/effect operations.
- [x] Non-destructive independent adjustments and copy/paste between photos.
- [x] Layer ordering, duplicate/delete, history snapshots, and layout preservation.
- [x] Dragging updates transforms and Undo restores the original bounds.
- [x] Saved projects recover layers after reload.
- [x] PNG output signature and expected composition dimensions.
- [x] Sticker transparency and real Canvas rendering.
- [x] Phone/wide-view overflow checks.
- [x] Capture and individual retake with synthetic browser camera hardware.

Manual/device follow-up:

- [ ] Physical front/rear cameras, permission denial/disconnection, multiple cameras.
- [ ] Multi-touch and keyboard behavior across Android browser/device combinations.
- [ ] Native file-share sheet on a physical Android phone.
- [ ] Very large photo collections, low-memory devices, storage eviction/quota.
- [ ] Visual curation of every generated frame and sticker variant.
- [ ] Print output, accessibility audit, and cross-browser color consistency.

Not implemented: native APK/Compose screens, generated Figma files, custom saved
frame presets, arbitrary slot masks, curved text, selective HSL/blur, automatic
face fitting/background removal/straightening, nested group transforms, full
offline font packaging/service worker, or PDF/CMYK/DPI-metadata export. No
placeholder controls are exposed for these operations.
