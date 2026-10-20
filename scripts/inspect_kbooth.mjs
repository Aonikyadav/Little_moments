import fs from "fs"
import path from "path"
import jpeg from "jpeg-js"

const dir = "public/kbooth"
const files = fs.readdirSync(dir).filter(f => f.startsWith("kbooth-") && f.endsWith(".png"))

for (const file of files) {
  const filePath = path.join(dir, file)
  const buf = fs.readFileSync(filePath)
  try {
    const decoded = jpeg.decode(buf)
    console.log(`${file}: ${decoded.width}x${decoded.height}, size: ${buf.length} bytes`)
  } catch (e) {
    console.error(`Error decoding ${file}:`, e.message)
  }
}
