import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const modules = new Map()
async function loadModule(pathStr) {
  const url = new URL(pathStr, import.meta.url)
  const compile = (file) => {
    if (modules.has(file.href)) return modules.get(file.href)
    const source = fs.readFileSync(file, "utf8")
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

const {
  TEMPLATE_IMAGE_MAPPINGS,
  getTemplateImageMapping,
  getTemplateLocalImage,
  getTemplateLocalImageCandidates,
  getAllTemplateImageMappings,
} = await loadModule("../src/utils/templateImageMap.ts")

test("template image mapping links all 61 user templates directly to local folders", () => {
  const all = getAllTemplateImageMappings()
  assert.ok(all.length >= 61, `Expected at least 61 mapped templates, got ${all.length}`)

  for (let i = 1; i <= 61; i++) {
    const id = `tmpl-user-${String(i).padStart(3, "0")}`
    const mapping = getTemplateImageMapping(id)
    assert.ok(mapping, `Missing mapping for ${id}`)
    assert.ok(mapping.folder, `Missing folder for ${id}`)
    assert.ok(mapping.fileName, `Missing fileName for ${id}`)
    assert.ok(mapping.encodedUrl || mapping.localPath, `Missing path for ${id}`)

    // Verify local image file exists on disk in Images directory
    const diskPath = path.join("Images", mapping.folder, mapping.fileName)
    assert.ok(fs.existsSync(diskPath), `Local file does not exist on disk: ${diskPath}`)

    // Verify file is a valid binary JPEG (not empty, starts with JPEG magic 0xFF 0xD8)
    const buf = fs.readFileSync(diskPath)
    assert.ok(buf.length > 5000, `File size unexpectedly small: ${buf.length}`)
    assert.equal(buf[0], 0xff, "Must be valid JPEG magic byte 0")
    assert.equal(buf[1], 0xd8, "Must be valid JPEG magic byte 1")
  }
})

test("getTemplateLocalImage provides reliable image cover paths", () => {
  const localUrl = getTemplateLocalImage("tmpl-user-001")
  assert.ok(
    localUrl.startsWith("/covers/") || localUrl.startsWith("/images/") || localUrl.startsWith("/templates/"),
    `Should provide authentic cover URL, got: ${localUrl}`
  )

  const candidates = getTemplateLocalImageCandidates("tmpl-user-001")
  assert.ok(candidates.length >= 2, "Should provide multiple local fallback candidates")
  assert.ok(
    candidates.some(c => c.includes("cool") || c.includes("001")),
    "Candidates must link to the authentic asset"
  )
})
