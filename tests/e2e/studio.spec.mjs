import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"

async function openStudio(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page
    .getByRole("button", { name: "Create from photos", exact: true })
    .click()
  await page.getByRole("button", { name: "Find my frame" }).click()
  await page.locator(".card-preview").first().click()
  await page.getByRole("button", { name: "Use this template" }).click()
  const buffer = readFileSync("public/photos/booth.jpg")
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(
      [0, 1, 2, 3].map((i) => ({
        name: `moment-${i}.jpg`,
        mimeType: "image/jpeg",
        buffer,
      })),
    )
  await page.getByRole("button", { name: "Customize my photos" }).click()
  await expect(page.locator(".touch-canvas canvas")).toBeVisible()
  await expect(page.locator(".save-state")).toHaveText("Saved on this device", {
    timeout: 15000,
  })
}

test("mobile editing, layers, independent looks, local recovery and export", async ({
  page,
}) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await openStudio(page)
  await page.getByRole("button", { name: "Adjust", exact: true }).click()
  await page.getByRole("slider", { name: "Exposure", exact: true }).fill("0.5")
  await page.getByRole("button", { name: "Copy look", exact: true }).click()
  await page.getByAltText("Select photo 2", { exact: true }).click()
  await expect(
    page.getByRole("slider", { name: "Exposure", exact: true }),
  ).toHaveValue("0")
  await page.getByRole("button", { name: "Paste look", exact: true }).click()
  await expect(
    page.getByRole("slider", { name: "Exposure", exact: true }),
  ).toHaveValue("0.5")
  await page.getByRole("button", { name: "Frames", exact: true }).click()
  await page.getByRole("textbox", { name: "Search frames" }).fill("lace")
  await page.locator(".frame-pick").first().click()
  await expect(page.getByText("PREVIEWING WITH YOUR PHOTOS")).toBeVisible()
  await page.getByRole("button", { name: "Apply frame" }).click()
  await page.getByRole("button", { name: "Stickers", exact: true }).click()
  await page.getByRole("textbox", { name: "Search stickers" }).fill("ribbon")
  await page.getByRole("button", { name: "Pocket Ribbon", exact: true }).click()
  await expect(page.locator(".canvas-hit")).toHaveCount(5)
  await page.getByRole("button", { name: "Duplicate selected layer" }).click()
  await expect(page.locator(".canvas-hit")).toHaveCount(6)
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(page.locator(".canvas-hit")).toHaveCount(5)
  await page.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(page.locator(".canvas-hit")).toHaveCount(6)
  await page.getByRole("button", { name: "Text", exact: true }).click()
  await page.getByRole("textbox", { name: "Your words" }).fill("Kept forever")
  await page.getByRole("button", { name: "Add to canvas" }).click()
  await expect(page.locator(".canvas-hit")).toHaveCount(7)
  await page.getByRole("button", { name: "Save project", exact: true }).click()
  await expect(page.locator(".toast")).toContainText("Editable project saved", {
    timeout: 15000,
  })
  await expect(page.locator(".save-state")).toHaveText("Saved on this device")
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Resume creating" }).click()
  await expect(page.locator(".canvas-hit")).toHaveCount(7)
  await page.getByRole("button", { name: "Export", exact: true }).click()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Save image", exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("little-moments.png")
  const path = await download.path()
  const png = readFileSync(path)
  expect(png.subarray(1, 4).toString()).toBe("PNG")
  expect(png.readUInt32BE(16)).toBe(1200)
  expect(png.readUInt32BE(20)).toBe(1800)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(errors).toEqual([])
})

test("real renderer changes image pixels and preserves transparent sticker backgrounds", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const result = await page.evaluate(async () => {
    const { renderComposition } = await import("/src/rendering.ts")
    const { defaultAdjustments } = await import("/src/types.ts")
    const { getTemplate } = await import("/src/templates.ts")
    const { stickers, stickerUrl } = await import("/src/studio/assets.ts")
    const source = document.createElement("canvas")
    source.width = 80
    source.height = 80
    const ctx = source.getContext("2d")
    const gradient = ctx.createLinearGradient(0, 0, 80, 80)
    gradient.addColorStop(0, "#1d4678")
    gradient.addColorStop(0.5, "#d39b65")
    gradient.addColorStop(1, "#6f4c81")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 80, 80)
    const c = {
      templateId: "solo-polaroid",
      background: "#ffffff",
      borderColor: "#222222",
      borderWidth: 0,
      radius: 0,
      spacing: 0,
      padding: 0,
      photos: [
        {
          id: "test",
          src: source.toDataURL(),
          name: "Test",
          adjustments: defaultAdjustments(),
        },
      ],
      stickers: [],
      texts: [],
    }
    const render = async (composition) => {
      const canvas = await renderComposition(
        document.createElement("canvas"),
        composition,
        getTemplate(c.templateId),
        0.1,
      )
      return canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data
    }
    const original = await render(c)
    const changed = {}
    for (const [key, value] of Object.entries({
      exposure: 1,
      highlights: 60,
      shadows: 60,
      whites: 60,
      blacks: 60,
      vibrance: 60,
      warmth: 60,
      tint: 60,
      hue: 70,
      red: 60,
      green: 60,
      blue: 60,
      fade: 60,
      grain: 70,
      vignette: 70,
      blur: 5,
      glow: 70,
      lightLeak: 70,
      scratches: 70,
      perspectiveX: 50,
      perspectiveY: 50,
    })) {
      const pixels = await render({
        ...c,
        photos: [
          {
            ...c.photos[0],
            adjustments: { ...defaultAdjustments(), [key]: value },
          },
        ],
      })
      changed[key] = pixels.some((v, i) => v !== original[i])
    }
    const image = new Image()
    image.src = stickerUrl(stickers[0])
    await image.decode()
    const transparent = document.createElement("canvas")
    transparent.width = 100
    transparent.height = 100
    const tc = transparent.getContext("2d")
    tc.drawImage(image, 0, 0)
    return { changed, cornerAlpha: tc.getImageData(0, 0, 1, 1).data[3] }
  })
  for (const [key, changed] of Object.entries(result.changed))
    expect(changed, `${key} changes rendered pixels`).toBe(true)
  expect(result.cornerAlpha).toBe(0)
})

test("camera sequence and individual retake remain functional with synthetic hardware", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page
    .getByRole("button", { name: "Start photo booth", exact: true })
    .click()
  await page.locator(".count-option").nth(1).click()
  await page.getByRole("button", { name: "No delay", exact: true }).click()
  await page.getByRole("button", { name: "Find my frame" }).click()
  await page.locator(".card-preview").first().click()
  await page.getByRole("button", { name: "Use this template" }).click()
  await page.getByRole("button", { name: "Allow camera access" }).click()
  await expect(
    page.getByRole("button", { name: "Start capture", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Start capture", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "2 of 2 moments" }),
  ).toBeVisible()
  const keptPhoto = await page
    .locator(".review-thumbs img")
    .nth(1)
    .getAttribute("src")
  await page
    .getByRole("button", { name: "Retake selected", exact: true })
    .click()
  await page.getByRole("button", { name: "Allow camera access" }).click()
  await expect(
    page.getByRole("button", { name: "Start capture", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Start capture", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "2 of 2 moments" }),
  ).toBeVisible()
  await expect(page.locator(".review-thumbs img").nth(1)).toHaveAttribute(
    "src",
    keptPhoto,
  )
  await page.getByRole("button", { name: "Customize my photos" }).click()
  await expect(page.locator(".dock-photos img")).toHaveCount(2)
})

test("editor adapts to wider viewports and drag gestures persist layer transforms", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openStudio(page)
  await page.getByRole("button", { name: "Freeform", exact: true }).click()
  const photo = page.locator(".canvas-hit").first()
  const before = await photo.getAttribute("style")
  const box = await photo.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    box.x + box.width / 2 + 28,
    box.y + box.height / 2 + 12,
    { steps: 5 },
  )
  await page.mouse.up()
  expect(await photo.getAttribute("style")).not.toBe(before)
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(photo).toHaveAttribute("style", before)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: "/tmp/little-moments-studio-desktop.png",
    fullPage: true,
  })
  await page.setViewportSize({ width: 393, height: 852 })
  await page.screenshot({
    path: "/tmp/little-moments-studio-mobile.png",
    fullPage: true,
  })
})

test("all registered original vector assets decode in the browser", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const failures = await page.evaluate(async () => {
    const { frames, stickers, stickerUrl } = await import(
      "/src/studio/assets.ts"
    )
    const assets = [
      ...frames.map((f) => ({ id: f.id, url: f.preview })),
      ...stickers.map((s) => ({ id: s.id, url: stickerUrl(s) })),
    ]
    const failed = []
    for (let start = 0; start < assets.length; start += 25)
      await Promise.all(assets.slice(start, start + 25).map(async (asset) => {
          const image = new Image()
          image.src = asset.url
          try {
            await image.decode()
          } catch {
            failed.push(asset.id)
          }
        }))
    return failed
  })
  expect(failures).toEqual([])
})
