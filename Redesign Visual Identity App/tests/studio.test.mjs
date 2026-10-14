import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"

async function loadModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`)
}

const { templates, templatesForCount, getTemplate } = await loadModule("../src/templates.ts")
const { defaultAdjustments } = await loadModule("../src/types.ts")
const { resolvedAdjustments, cssFilter, filterValues } = await loadModule("../src/rendering.ts")

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
  assert.equal(new Set(templates.map(t => t.id)).size, templates.length)
})

test("template lookup safely falls back for unknown IDs", () => {
  assert.equal(getTemplate("not-found").id, "four-cut")
})

test("filter intensity is non-destructive and interpolates correctly", () => {
  const original = { ...defaultAdjustments(), filter: "Mono", intensity: 50 }
  assert.equal(resolvedAdjustments(original).saturation, 50)
  assert.equal(original.saturation, 100)
  assert.equal(resolvedAdjustments({ ...original, intensity: 0 }).saturation, 100)
  assert.equal(resolvedAdjustments({ ...original, intensity: 100 }).saturation, 0)
})

test("all filter presets produce valid CSS filters", () => {
  for (const filter of Object.keys(filterValues)) {
    const result = cssFilter({ ...defaultAdjustments(), filter })
    assert.ok(!result.includes("NaN"))
    assert.ok(result.includes("brightness("))
  }
})
