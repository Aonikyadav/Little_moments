import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
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
      /(from\s*["'])([^"']+)(["'])/g,
      (_, before, specifier, after) => {
        if (specifier.startsWith(".")) {
          const dependency = new URL(
            specifier.endsWith(".ts") ? specifier : `${specifier}.ts`,
            file,
          )
          return `${before}${compile(dependency)}${after}`
        }
        return `${before}${import.meta.resolve(specifier)}${after}`
      },
    )
    const data = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
    modules.set(file.href, data)
    return data
  }
  return import(compile(url))
}

const { purikuraTemplates, getTemplate, templates } = await loadModule("../src/templates.ts")
const { stickers, stickerPacks, backgroundPatterns } = await loadModule("../src/studio/assets.ts")
const { generateQrMatrix, generateQrCodeSvg, generateQrCodeDataUrl } = await loadModule("../src/utils/qrCode.ts")

test("Purikura 90s: templates collection contains 3 authentic arcade photobooth strip layouts", () => {
  assert.equal(purikuraTemplates.length, 3)
  assert.ok(templates.some((t) => t.id === "tmpl-purikura-01"))
  assert.ok(templates.some((t) => t.id === "tmpl-purikura-02"))
  assert.ok(templates.some((t) => t.id === "tmpl-purikura-03"))

  const t1 = getTemplate("tmpl-purikura-01")
  assert.equal(t1.name, "Shibuya Arcade Twin Strip · プリクラ 90s")
  assert.equal(t1.count, 4)
  assert.equal(t1.backgroundPattern, "Purikura Shibuya Sparkle")
  assert.equal(t1.slots.length, 4)

  const t2 = getTemplate("tmpl-purikura-02")
  assert.equal(t2.name, "Harajuku Holographic 2-Cut · プリクラ 90s")
  assert.equal(t2.count, 2)
  assert.equal(t2.backgroundPattern, "Purikura Harajuku Hologram")
  assert.equal(t2.slots.length, 2)

  const t3 = getTemplate("tmpl-purikura-03")
  assert.equal(t3.name, "Retro Tokyo Neon 4-Cut · プリクラ 90s")
  assert.equal(t3.count, 4)
  assert.equal(t3.backgroundPattern, "Purikura Neon Arcade")
  assert.equal(t3.slots.length, 4)
})

test("Purikura Deco 90s: sticker pack provides authentic Kanji stamps and Japanese arcade doodles", () => {
  assert.ok(stickerPacks.includes("Purikura Deco 90s"))
  const purikuraStickers = stickers.filter((s) => s.pack === "Purikura Deco 90s")
  assert.equal(purikuraStickers.length, 25)

  // Verify authentic Kanji/Katakana stamps
  assert.ok(purikuraStickers.some((s) => s.svg.includes("ズッ友")), "ズッ友 sticker present")
  assert.ok(purikuraStickers.some((s) => s.svg.includes("スキ♡")), "スキ sticker present")
  assert.ok(purikuraStickers.some((s) => s.svg.includes("盛")), "盛 sticker present")
  assert.ok(purikuraStickers.some((s) => s.svg.includes("ピース")), "ピース sticker present")
  assert.ok(purikuraStickers.some((s) => s.svg.includes("大好き")), "大好き sticker present")

  // Verify Purikura background patterns are registered
  assert.ok(backgroundPatterns.includes("Purikura Shibuya Sparkle"))
  assert.ok(backgroundPatterns.includes("Purikura Harajuku Hologram"))
  assert.ok(backgroundPatterns.includes("Purikura Neon Arcade"))
})

test("Direct Mobile QR Export: client-side generator produces valid matrix and SVG without remote dependencies", () => {
  const url = "http://192.168.1.100:3000/?view=mobile&id=export_1234567890"
  const matrix = generateQrMatrix(url, "M")
  assert.ok(Array.isArray(matrix))
  assert.ok(matrix.length >= 21)
  assert.equal(matrix.length, matrix[0].length)

  // Finders should be dark at (0,0), (0, matrix.length - 1), (matrix.length - 1, 0)
  assert.equal(matrix[0][0], true)
  assert.equal(matrix[0][matrix.length - 1], true)
  assert.equal(matrix[matrix.length - 1][0], true)

  const svg = generateQrCodeSvg(url, { size: 300, darkColor: "#1c1917", lightColor: "#faf8f2" })
  assert.ok(svg.startsWith("<svg"))
  assert.ok(svg.includes('viewBox="0 0 300 300"'))
  assert.ok(svg.includes("#1c1917"))
  assert.ok(svg.includes("#faf8f2"))

  const dataUrl = generateQrCodeDataUrl(url)
  assert.ok(dataUrl.startsWith("data:image/svg+xml;charset=utf-8,"))
})
