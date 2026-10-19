import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
  TEMPLATE_IMAGE_MAPPINGS,
  getTemplateImageMapping,
  getTemplateLocalImage,
  getTemplateLocalImageCandidates,
  getAllTemplateImageMappings,
} from "../src/utils/templateImageMap.ts"

test("template image mapping links all 61 user templates directly to local folders", () => {
  const all = getAllTemplateImageMappings()
  assert.ok(all.length >= 61, `Expected at least 61 mapped templates, got ${all.length}`)

  for (let i = 1; i <= 61; i++) {
    const id = `tmpl-user-${String(i).padStart(3, "0")}`
    const mapping = getTemplateImageMapping(id)
    assert.ok(mapping, `Missing mapping for ${id}`)
    assert.ok(mapping.folder, `Missing folder for ${id}`)
    assert.ok(mapping.fileName, `Missing fileName for ${id}`)
    assert.ok(mapping.url.startsWith("/images/"), `URL must prioritize local /images/ path: ${mapping.url}`)

    // Verify local image file exists on disk
    const diskPath = path.join("Images", mapping.folder, mapping.fileName)
    assert.ok(fs.existsSync(diskPath), `Local file does not exist on disk: ${diskPath}`)

    // Verify file is a valid binary JPEG (not empty, starts with JPEG magic 0xFF 0xD8)
    const buf = fs.readFileSync(diskPath)
    assert.ok(buf.length > 5000, `File size unexpectedly small: ${buf.length}`)
    assert.equal(buf[0], 0xff, "Must be valid JPEG magic byte 0")
    assert.equal(buf[1], 0xd8, "Must be valid JPEG magic byte 1")
  }
})

test("getTemplateLocalImage prioritizes local image folder path", () => {
  const localUrl = getTemplateLocalImage("tmpl-user-001")
  assert.ok(localUrl.startsWith("/images/"), `Should prioritize local /images/ folder, got: ${localUrl}`)

  const candidates = getTemplateLocalImageCandidates("tmpl-user-001")
  assert.ok(candidates.length >= 2, "Should provide multiple local fallback candidates")
  assert.ok(candidates[0].startsWith("/images/"), "Top candidate must be local image folder URL")
})
