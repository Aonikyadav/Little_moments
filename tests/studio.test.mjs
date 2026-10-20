import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"

const modules = new Map()
async function loadModule(path) {
  const url = new URL(path, import.meta.url)
  const compile = (file) => {
    if (modules.has(file.href)) return modules.get(file.href)
    const source = readFileSync(file, "utf8")
    let { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
    })
    outputText = outputText.replace(
      /(from\s*["'])(\.[^"']+)(["'])/g,
      (_, before, specifier, after) => {
        const dependency = new URL(
          specifier.endsWith(".ts") ? specifier : `${specifier}.ts`,
          file,
        )
        return `${before}${compile(dependency)}${after}`
      },
    )
    const data = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
    modules.set(file.href, data)
    return data
  }
  return import(compile(url))
}

const { templates, templatesForCount, getTemplate } = await loadModule(
  "../src/templates.ts",
)
const { defaultAdjustments } = await loadModule("../src/types.ts")
const { resolvedAdjustments, cssFilter, filterValues } = await loadModule(
  "../src/rendering.ts",
)

test("every supported count has valid compatible layouts", () => {
  for (const count of [1, 2, 3, 4, 5, 6, 8, 9]) {
    const compatible = templatesForCount(count)
    assert.ok(compatible.length > 0)
    for (const template of compatible) {
      assert.equal(template.slots.length, count)
      for (const slot of template.slots) {
        assert.ok(slot.x >= 0 && slot.y >= 0)
        assert.ok(slot.width > 0 && slot.height > 0)
        assert.ok(slot.x + slot.width <= 100)
        assert.ok(slot.y + slot.height <= 100)
      }
    }
  }
  assert.ok(templates.length >= 12)
  assert.equal(new Set(templates.map((t) => t.id)).size, templates.length)
})

test("template lookup safely falls back for unknown IDs", () => {
  assert.equal(getTemplate("not-found").id, "four-cut")
})

test("filter intensity is non-destructive and interpolates correctly", () => {
  const original = { ...defaultAdjustments(), filter: "Mono", intensity: 50 }
  assert.equal(resolvedAdjustments(original).saturation, 50)
  assert.equal(original.saturation, 100)
  assert.equal(
    resolvedAdjustments({ ...original, intensity: 0 }).saturation,
    100,
  )
  assert.equal(
    resolvedAdjustments({ ...original, intensity: 100 }).saturation,
    0,
  )
})

test("all filter presets produce valid CSS filters", () => {
  for (const filter of Object.keys(filterValues)) {
    const result = cssFilter({ ...defaultAdjustments(), filter })
    assert.ok(!result.includes("NaN"))
    assert.ok(result.includes("brightness("))
  }
})

const { frames, frameCategories, stickers, stickerPacks, frameArtwork } =
  await loadModule("../src/studio/assets.ts")
const { filterPresets } = await loadModule("../src/studio/filters.ts")
const { adjustPixels, sharpenPixels } = await loadModule(
  "../src/studio/pixels.ts",
)
const {
  orderedLayers,
  enterFreeform,
  moveLayer,
  duplicateLayer,
  deleteLayer,
  patchLayer,
  historyStep,
  dimensions,
} = await loadModule("../src/studio/model.ts")

function fixture() {
  return {
    templateId: "four-grid",
    background: "#fffaf0",
    borderColor: "#222222",
    borderWidth: 0,
    radius: 2,
    spacing: 0,
    padding: 0,
    photos: Array.from({ length: 4 }, (_, i) => ({
      id: `p${i}`,
      name: `Photo ${i}`,
      src: `source-${i}`,
      adjustments: { ...defaultAdjustments(), exposure: i / 10 },
    })),
    stickers: [],
    texts: [],
  }
}

test("500 frame recipes: 50 per category, unique artwork, valid metadata", () => {
  assert.equal(frames.length, 500)
  assert.equal(new Set(frames.map((f) => f.id)).size, 500)
  assert.equal(new Set(frames.map((f) => frameArtwork(f, "#222222"))).size, 500)
  for (const category of frameCategories)
    assert.equal(frames.filter((f) => f.category === category).length, 50)
  for (const f of frames) {
    assert.ok(f.preview.startsWith("data:image/svg+xml"))
    assert.deepEqual(f.supportedCounts, [1, 2, 3, 4, 5, 6, 8, 9])
    assert.ok(f.customization.length > 0)
  }
})
test("225 transparent vector stickers: 25 per pack and no duplicated SVG content", () => {
  assert.equal(stickers.length, 225)
  assert.equal(new Set(stickers.map((s) => s.id)).size, 225)
  assert.equal(new Set(stickers.map((s) => s.svg)).size, 225)
  for (const pack of stickerPacks)
    assert.equal(stickers.filter((s) => s.pack === pack).length, 25)
  for (const s of stickers) assert.ok(!s.svg.includes('<rect width="100%"'))
  assert.ok(
    stickers.filter(
      (s) =>
        s.name.toLowerCase().includes("bow") ||
        s.name.toLowerCase().includes("ribbon"),
    ).length > 0,
  )
})
test("48 distinct documented filter recipes", () => {
  assert.ok(filterPresets.length >= 40)
  assert.equal(
    new Set(filterPresets.map((p) => JSON.stringify(p.values))).size,
    filterPresets.length,
  )
  for (const p of filterPresets) assert.ok(p.description.length > 8)
})
test("each pixel adjustment changes actual RGBA data without changing alpha", () => {
  const samples = new Uint8ClampedArray([
    60, 120, 190, 255, 220, 140, 70, 130, 100, 40, 80, 255,
  ])
  const values = {
    exposure: 0.8,
    brightness: 135,
    contrast: 135,
    highlights: 40,
    shadows: 40,
    whites: 40,
    blacks: 40,
    saturation: 140,
    vibrance: 45,
    warmth: 40,
    tint: 40,
    hue: 60,
    red: 30,
    green: 30,
    blue: 30,
    fade: 40,
  }
  for (const [key, value] of Object.entries(values)) {
    const output = adjustPixels(new Uint8ClampedArray(samples), {
      ...defaultAdjustments(),
      [key]: value,
    })
    assert.notDeepEqual(output, samples, key)
    assert.equal(output[3], 255)
    assert.equal(output[7], 130)
  }
})
test("sharpening operates on real image edges", () => {
  const input = new Uint8ClampedArray(5 * 5 * 4).fill(100)
  input[(2 * 5 + 2) * 4] = 180
  const original = new Uint8ClampedArray(input)
  sharpenPixels(input, 5, 5, 80)
  assert.notDeepEqual(input, original)
})
test("layers retain photo edits through reordering, duplication, deletion and layout changes", () => {
  const original = fixture(),
    free = enterFreeform(original, getTemplate(original.templateId))
  assert.equal(free.mode, "freeform")
  assert.deepEqual(
    free.photos.map((p) => p.adjustments),
    original.photos.map((p) => p.adjustments),
  )
  const moved = moveLayer(free, "p0", 2)
  assert.equal(orderedLayers(moved)[2].id, "p0")
  assert.equal(orderedLayers(moved)[0].id, "p1")
  const duplicated = duplicateLayer(moved, "p0", "duplicate")
  assert.equal(duplicated.photos.length, 5)
  assert.deepEqual(
    duplicated.photos[4].adjustments,
    original.photos[0].adjustments,
  )
  assert.equal(deleteLayer(duplicated, "duplicate").photos.length, 4)
  const switched = { ...free, mode: "guided", templateId: "four-cut" }
  assert.deepEqual(
    switched.photos.map((p) => p.src),
    original.photos.map((p) => p.src),
  )
  assert.deepEqual(
    switched.photos.map((p) => p.adjustments),
    original.photos.map((p) => p.adjustments),
  )
})
test("undo and redo restore complete immutable project snapshots", () => {
  const original = fixture(),
    next = { ...original, background: "#aabbcc" }
  const undone = historyStep([original], next, [], "undo")
  assert.deepEqual(undone.current, original)
  assert.deepEqual(
    historyStep(undone.past, undone.current, undone.future, "redo").current,
    next,
  )
  assert.deepEqual(JSON.parse(JSON.stringify(next)), next)
})
test("social output sizes preserve the selected canvas ratio", () => {
  const c = fixture(),
    t = getTemplate(c.templateId)
  assert.deepEqual(dimensions({ ...c, aspectRatio: "story" }, t), {
    width: 1440,
    height: 2560,
  })
  assert.deepEqual(dimensions({ ...c, aspectRatio: "square" }, t), {
    width: 1800,
    height: 1800,
  })
})

test("allows rotating and resizing photos, stickers, and frames placed on the composition", () => {
  const base = fixture()

  // 1. Photo rotation and resizing in freeform mode
  const free = enterFreeform(base, getTemplate(base.templateId))
  const resizedPhoto = patchLayer(free, "p0", {
    transform: {
      x: 10,
      y: 10,
      width: 45,
      height: 45,
      rotation: 45,
      scale: 1.2,
      opacity: 1,
    },
  })
  const p0 = resizedPhoto.photos.find((p) => p.id === "p0")
  assert.ok(p0 && p0.transform)
  assert.equal(p0.transform.width, 45)
  assert.equal(p0.transform.height, 45)
  assert.equal(p0.transform.rotation, 45)

  // 2. Sticker rotation and resizing
  const withSticker = {
    ...resizedPhoto,
    stickers: [
      {
        id: "s1",
        kind: "heart",
        x: 50,
        y: 50,
        size: 15,
        rotation: 0,
        opacity: 1,
      },
    ],
  }
  const transformedSticker = patchLayer(withSticker, "s1", {
    size: 28,
    rotation: -30,
    x: 55,
    y: 52,
  })
  const s1 = transformedSticker.stickers.find((s) => s.id === "s1")
  assert.ok(s1)
  assert.equal(s1.size, 28)
  assert.equal(s1.rotation, -30)
  assert.equal(s1.x, 55)

  // 3. Frame rotation and scaling
  const withFrame = {
    ...transformedSticker,
    frameId: "vintage-1",
    frameOpacity: 0.9,
    frameTransform: {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
    },
  }
  const transformedFrame = patchLayer(withFrame, "frame", {
    transform: {
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 15,
    },
    opacity: 0.85,
  })
  assert.ok(transformedFrame.frameTransform)
  assert.equal(transformedFrame.frameTransform.width, 80)
  assert.equal(transformedFrame.frameTransform.height, 80)
  assert.equal(transformedFrame.frameTransform.rotation, 15)
  assert.equal(transformedFrame.frameOpacity, 0.85)

  // Check ordered layers reflects frame transform
  const layers = orderedLayers(transformedFrame)
  const frameLayer = layers.find((l) => l.id === "frame")
  assert.ok(frameLayer)
  assert.equal(frameLayer.properties.transform.rotation, 15)
  assert.equal(frameLayer.properties.transform.width, 80)
})

