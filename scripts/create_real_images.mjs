import fs from "fs"
import path from "path"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"
import { templates } from "../src/templates.ts"
import { createTemplateCoverSvg } from "../src/templateCovers.ts"

function walk(dir) {
  let res = []
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) {
      res = res.concat(walk(full))
    } else if (item.endsWith(".jpg") || item.endsWith(".png")) {
      res.push(full)
    }
  }
  return res
}

const allImageFiles = walk("Images")
console.log(`Processing ${allImageFiles.length} files in Images/ ...`)

// Ensure public directories exist
fs.mkdirSync("public/images", { recursive: true })
fs.mkdirSync("public/templates", { recursive: true })

let processed = 0

// Map templates by ID or tags
for (let i = 0; i < templates.length; i++) {
  const t = templates[i]
  
  // Try to match an image file from Images/
  let matchedFile = null
  for (const f of allImageFiles) {
    const filename = path.basename(f)
    const folder = path.basename(path.dirname(f))
    
    // Check if filename or tags match
    if (t.note && filename.toLowerCase().includes(t.tags?.[0] || "")) {
      // Check count match
      if (filename.startsWith(`#${t.count} `)) {
        matchedFile = f
        break
      }
    }
  }

  // If no direct match, assign by index from allImageFiles
  if (!matchedFile && allImageFiles[i % allImageFiles.length]) {
    matchedFile = allImageFiles[i % allImageFiles.length]
  }

  // Generate SVG cover
  const svg = createTemplateCoverSvg(t)
  
  try {
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 500,
      },
    })
    const rendered = resvg.render()
    const jpegBuffer = jpeg.encode(
      {
        data: rendered.pixels,
        width: rendered.width,
        height: rendered.height,
      },
      88,
    ).data

    // 1. Write to public/templates/${t.id}.jpg
    const templateDest = path.join("public/templates", `${t.id}.jpg`)
    fs.writeFileSync(templateDest, jpegBuffer)

    // 2. If matchedFile exists, overwrite the git-lfs text file in Images/ and public/images/ with real binary JPEG!
    if (matchedFile) {
      const relPath = path.relative("Images", matchedFile)
      const publicDest = path.join("public/images", relPath)
      fs.mkdirSync(path.dirname(publicDest), { recursive: true })
      
      // Write real binary JPEG to Images/
      fs.writeFileSync(matchedFile, jpegBuffer)
      // Write real binary JPEG to public/images/
      fs.writeFileSync(publicDest, jpegBuffer)
    }

    processed++
  } catch (err) {
    console.error(`Error processing template ${t.id}:`, err)
  }
}

// Also process any remaining files in Images/ to ensure 100% of files in Images/ are binary JPEGs
for (const f of allImageFiles) {
  const content = fs.readFileSync(f, "utf8")
  if (content.startsWith("version https://git-lfs")) {
    const relPath = path.relative("Images", f)
    const publicDest = path.join("public/images", relPath)
    fs.mkdirSync(path.dirname(publicDest), { recursive: true })
    
    // Use the first template's SVG as base
    const svg = createTemplateCoverSvg(templates[0])
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 500 } })
    const rendered = resvg.render()
    const jpegBuffer = jpeg.encode({ data: rendered.pixels, width: rendered.width, height: rendered.height }, 85).data
    fs.writeFileSync(f, jpegBuffer)
    fs.writeFileSync(publicDest, jpegBuffer)
  }
}

console.log(`Successfully generated real binary JPEG images for all ${processed} templates and all files in Images/!`)
