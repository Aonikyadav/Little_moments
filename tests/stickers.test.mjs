import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, "..")

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

const { PNG_STICKER_PACKS, PNG_STICKERS } = await loadModule("../src/data/pngStickers.ts")
const { stickers, pngStickers, allStickers, findSticker, stickerUrl } = await loadModule("../src/studio/assets.ts")
const { duplicateLayer, deleteLayer, patchLayer } = await loadModule("../src/studio/model.ts")

test("extracted sticker archives: all 6 packs exist under /src/assets/stickers/ and public/stickers/", () => {
  const expectedPacks = [
    { slug: "anime-ninja", count: 20 },
    { slug: "coffee-scrapbook", count: 32 },
    { slug: "maroon-romance", count: 32 },
    { slug: "midnight-bloom", count: 24 },
    { slug: "midnight-bloom-vol2", count: 31 },
    { slug: "spider-hero", count: 26 },
  ]

  assert.equal(PNG_STICKER_PACKS.length, 6)

  let totalPngs = 0
  for (const pack of expectedPacks) {
    const assetDir = resolve(projectRoot, "src/assets/stickers", pack.slug)
    const publicDir = resolve(projectRoot, "public/stickers", pack.slug)
    assert.ok(existsSync(assetDir), `src/assets/stickers/${pack.slug} must exist`)
    assert.ok(existsSync(publicDir), `public/stickers/${pack.slug} must exist`)

    const packStickers = PNG_STICKERS.filter((s) => s.packSlug === pack.slug)
    assert.equal(packStickers.length, pack.count, `Pack ${pack.slug} should have ${pack.count} stickers`)

    for (const sticker of packStickers) {
      const publicFilePath = resolve(projectRoot, "public", sticker.src.replace(/^\//, ""))
      assert.ok(existsSync(publicFilePath), `Sticker file must exist: ${publicFilePath}`)

      // Validate PNG 8-byte magic header: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
      const buffer = readFileSync(publicFilePath)
      assert.ok(buffer.length > 8, `Sticker ${sticker.id} file is non-empty`)
      assert.equal(buffer[0], 0x89)
      assert.equal(buffer[1], 0x50) // P
      assert.equal(buffer[2], 0x4e) // N
      assert.equal(buffer[3], 0x47) // G
      assert.equal(buffer[4], 0x0d) // \r
      assert.equal(buffer[5], 0x0a) // \n
      assert.equal(buffer[6], 0x1a) // \x1a
      assert.equal(buffer[7], 0x0a) // \n

      // Verify dimensions recorded in metadata are positive
      assert.ok(sticker.width > 0, `Width of ${sticker.id} must be > 0`)
      assert.ok(sticker.height > 0, `Height of ${sticker.id} must be > 0`)
      assert.ok(sticker.aspectRatio > 0, `AspectRatio of ${sticker.id} must be > 0`)
      totalPngs++
    }
  }

  assert.equal(totalPngs, 165, "Total extracted PNG stickers must equal 165")
  assert.equal(PNG_STICKERS.length, 165, "PNG_STICKERS manifest must have exactly 165 entries")
})

test("sticker registries: backward compatibility with original 225 vector stickers and 390 total stickers", () => {
  // Preserves existing test constraint that stickers.length === 225
  assert.equal(stickers.length, 225, "Original stickers array must retain 225 vector stickers for backward compatibility")
  assert.equal(pngStickers.length, 165, "pngStickers must expose all 165 PNG stickers")
  assert.equal(allStickers.length, 390, "allStickers must combine 225 vectors + 165 PNGs = 390 total")

  // Verify findSticker retrieves both vector and PNG assets
  const vectorSticker = findSticker("sticker-0-0")
  assert.ok(vectorSticker, "Should find vector sticker by id")
  assert.ok(vectorSticker.svg, "Vector sticker should have svg")

  const pngSticker = findSticker(PNG_STICKERS[0].id)
  assert.ok(pngSticker, "Should find PNG sticker by id")
  assert.ok(pngSticker.src, "PNG sticker should have src")
  assert.equal(stickerUrl(pngSticker), pngSticker.src, "stickerUrl returns src for PNG stickers")
})

test("studio editor layer system: stickers can be added, moved, rotated, resized, duplicated, and deleted", () => {
  const pngAsset = PNG_STICKERS[0]
  assert.ok(pngAsset)

  let comp = {
    templateId: "four-grid",
    background: "#fffaf0",
    borderColor: "#222222",
    borderWidth: 0,
    radius: 2,
    spacing: 0,
    padding: 0,
    photos: [],
    stickers: [
      {
        id: "stk-initial",
        assetId: pngAsset.id,
        name: pngAsset.name,
        src: pngAsset.src,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
      },
    ],
    texts: [],
  }

  assert.equal(comp.stickers.length, 1)
  const initialLayer = comp.stickers[0]
  assert.equal(initialLayer.assetId, pngAsset.id)
  assert.equal(initialLayer.src, pngAsset.src)

  // 1. Move & Rotate & Scale via patchLayer
  comp = patchLayer(comp, "stk-initial", {
    x: 65,
    y: 75,
    rotation: 45,
    scale: 1.5,
  })

  const updated = comp.stickers.find((s) => s.id === "stk-initial")
  assert.equal(updated.x, 65)
  assert.equal(updated.y, 75)
  assert.equal(updated.rotation, 45)
  assert.equal(updated.scale, 1.5)

  // 2. Duplicate sticker layer
  comp = duplicateLayer(comp, "stk-initial", "stk-duplicated")
  assert.equal(comp.stickers.length, 2)
  const dup = comp.stickers.find((s) => s.id === "stk-duplicated")
  assert.ok(dup)
  assert.equal(dup.assetId, pngAsset.id)
  assert.equal(dup.src, pngAsset.src)
  assert.equal(dup.rotation, 45)

  // 3. Delete sticker layer
  comp = deleteLayer(comp, "stk-initial")
  assert.equal(comp.stickers.length, 1)
  assert.equal(comp.stickers[0].id, "stk-duplicated")
})
