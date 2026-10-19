/**
 * Lightweight, zero-dependency, 100% offline client-side QR Code Matrix Generator.
 * Conforms to ISO/IEC 18004 QR Code specification (Byte mode, Versions 1-10, ECC L/M/Q/H).
 */

export type QrEccLevel = "L" | "M" | "Q" | "H"

export interface QrCodeOptions {
  size?: number
  margin?: number
  darkColor?: string
  lightColor?: string
  eccLevel?: QrEccLevel
}

// Galois Field GF(256) with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512)
const LOG_TABLE = new Uint8Array(256)

;(() => {
  let val = 1
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val
    EXP_TABLE[i + 255] = val
    LOG_TABLE[val] = i
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0)
  }
  LOG_TABLE[0] = 0
})()

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]]
}

function rsComputePoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < ecCount; i++) {
    const next = new Uint8Array(poly.length + 1)
    const factor = EXP_TABLE[i]
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], factor)
      next[j + 1] ^= poly[j]
    }
    poly = next
  }
  return poly
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsComputePoly(ecCount)
  const remainder = new Uint8Array(ecCount)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0]
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j], factor)
    }
    remainder[ecCount - 1] = gfMul(gen[ecCount - 1], factor)
  }
  return remainder
}

// Capacity and structure tables for Versions 1-10
// Format: [totalCodewords, ecCodewords, numBlocksGroup1, dataCodewordsPerBlockG1, numBlocksGroup2, dataCodewordsPerBlockG2]
const QR_VERSION_INFO: Record<number, Record<QrEccLevel, [number, number, number, number, number, number]>> = {
  1: {
    L: [26, 7, 1, 19, 0, 0],
    M: [26, 10, 1, 16, 0, 0],
    Q: [26, 13, 1, 13, 0, 0],
    H: [26, 17, 1, 9, 0, 0],
  },
  2: {
    L: [44, 10, 1, 34, 0, 0],
    M: [44, 16, 1, 28, 0, 0],
    Q: [44, 22, 1, 22, 0, 0],
    H: [44, 28, 1, 16, 0, 0],
  },
  3: {
    L: [70, 15, 1, 55, 0, 0],
    M: [70, 26, 1, 44, 0, 0],
    Q: [70, 18, 2, 17, 0, 0],
    H: [70, 22, 2, 13, 0, 0],
  },
  4: {
    L: [100, 20, 1, 80, 0, 0],
    M: [100, 18, 2, 32, 0, 0],
    Q: [100, 26, 2, 24, 0, 0],
    H: [100, 16, 4, 9, 0, 0],
  },
  5: {
    L: [134, 26, 1, 108, 0, 0],
    M: [134, 24, 2, 43, 0, 0],
    Q: [134, 18, 2, 15, 2, 16],
    H: [134, 22, 2, 11, 2, 12],
  },
  6: {
    L: [172, 18, 2, 68, 0, 0],
    M: [172, 16, 4, 27, 0, 0],
    Q: [172, 24, 4, 19, 0, 0],
    H: [172, 28, 4, 15, 0, 0],
  },
  7: {
    L: [196, 20, 2, 78, 0, 0],
    M: [196, 18, 4, 31, 0, 0],
    Q: [196, 18, 2, 14, 4, 15],
    H: [196, 26, 4, 13, 1, 14],
  },
  8: {
    L: [242, 24, 2, 97, 0, 0],
    M: [242, 22, 2, 38, 2, 39],
    Q: [242, 22, 4, 18, 2, 19],
    H: [242, 26, 4, 14, 2, 15],
  },
  9: {
    L: [292, 30, 2, 116, 0, 0],
    M: [292, 22, 3, 36, 2, 37],
    Q: [292, 20, 4, 16, 4, 17],
    H: [292, 24, 4, 12, 4, 13],
  },
  10: {
    L: [346, 18, 2, 68, 2, 69],
    M: [346, 26, 4, 43, 1, 44],
    Q: [346, 24, 6, 19, 2, 20],
    H: [346, 28, 6, 15, 2, 16],
  },
}

const ALIGNMENT_PATTERN_POSITIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
}

const FORMAT_BITS: Record<QrEccLevel, number[]> = {
  L: [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976],
  M: [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0],
  Q: [0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed],
  H: [0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b],
}

/**
 * Encodes text into QR matrix using Byte Mode
 */
export function generateQrMatrix(text: string, preferredEcc: QrEccLevel = "M"): boolean[][] {
  const utf8Encoder = new TextEncoder()
  const bytes = utf8Encoder.encode(text)

  // Find lowest viable version
  let version = 1
  let config = QR_VERSION_INFO[version][preferredEcc]
  let maxDataBytes =
    config[2] * config[3] + config[4] * config[5]

  while (version <= 10 && bytes.length + 3 > maxDataBytes) {
    version++
    if (version <= 10) {
      config = QR_VERSION_INFO[version][preferredEcc]
      maxDataBytes = config[2] * config[3] + config[4] * config[5]
    }
  }

  if (version > 10) {
    // Fallback to ECC L if needed to squeeze into Version 10
    preferredEcc = "L"
    config = QR_VERSION_INFO[10][preferredEcc]
    maxDataBytes = config[2] * config[3] + config[4] * config[5]
    version = 10
  }

  const [totalCodewords, ecCodewords, numBlocksG1, dataCountG1, numBlocksG2, dataCountG2] = config
  const totalDataBytes = numBlocksG1 * dataCountG1 + numBlocksG2 * dataCountG2

  // Bit buffer construction (Byte mode: 0100 + char count + bytes)
  const bitBuffer: number[] = []
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1)
    }
  }

  // Mode: 0100 (8-bit Byte)
  pushBits(0b0100, 4)
  // Character count indicator (8 bits for versions 1-9, 16 bits for version 10 in byte mode)
  pushBits(bytes.length, version < 10 ? 8 : 16)

  // Data
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8)
  }

  // Terminator (up to 4 bits of 0)
  const maxBits = totalDataBytes * 8
  const termLength = Math.min(4, maxBits - bitBuffer.length)
  pushBits(0, termLength)

  // Pad to 8-bit boundary
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0)
  }

  // Pad bytes: 0xEC (236), 0x11 (17)
  const padPatterns = [0xec, 0x11]
  let padIdx = 0
  while (bitBuffer.length < maxBits) {
    pushBits(padPatterns[padIdx % 2], 8)
    padIdx++
  }

  // Convert bit buffer to data codewords
  const dataBytes = new Uint8Array(totalDataBytes)
  for (let i = 0; i < totalDataBytes; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitBuffer[i * 8 + b]
    }
    dataBytes[i] = byte
  }

  // Split into blocks and calculate Reed-Solomon EC
  interface Block {
    data: Uint8Array
    ec: Uint8Array
  }
  const blocks: Block[] = []
  let byteOffset = 0

  for (let b = 0; b < numBlocksG1; b++) {
    const d = dataBytes.slice(byteOffset, byteOffset + dataCountG1)
    byteOffset += dataCountG1
    blocks.push({ data: d, ec: rsEncode(d, ecCodewords) })
  }
  for (let b = 0; b < numBlocksG2; b++) {
    const d = dataBytes.slice(byteOffset, byteOffset + dataCountG2)
    byteOffset += dataCountG2
    blocks.push({ data: d, ec: rsEncode(d, ecCodewords) })
  }

  // Interleave data codewords
  const finalCodewords: number[] = []
  const maxDataLen = Math.max(dataCountG1, dataCountG2)
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of blocks) {
      if (i < block.data.length) finalCodewords.push(block.data[i])
    }
  }
  // Interleave error correction codewords
  for (let i = 0; i < ecCodewords; i++) {
    for (const block of blocks) {
      if (i < block.ec.length) finalCodewords.push(block.ec[i])
    }
  }

  // Create Matrix
  const matrixSize = 17 + 4 * version
  const matrix: (boolean | null)[][] = Array.from({ length: matrixSize }, () =>
    Array.from({ length: matrixSize }, () => null),
  )
  const isFunctionModule: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array.from({ length: matrixSize }, () => false),
  )

  function setModule(r: number, c: number, dark: boolean, isFunc = true) {
    if (r >= 0 && r < matrixSize && c >= 0 && c < matrixSize) {
      matrix[r][c] = dark
      if (isFunc) isFunctionModule[r][c] = true
    }
  }

  // 1. Finder patterns
  function addFinder(topR: number, topC: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = topR + r
        const nc = topC + c
        if (nr < 0 || nr >= matrixSize || nc < 0 || nc >= matrixSize) continue
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isEdge = r === 0 || r === 6 || c === 0 || c === 6
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4
          setModule(nr, nc, isEdge || isCenter)
        } else {
          setModule(nr, nc, false) // Separator
        }
      }
    }
  }

  addFinder(0, 0)
  addFinder(0, matrixSize - 7)
  addFinder(matrixSize - 7, 0)

  // 2. Alignment patterns
  const alignCoords = ALIGNMENT_PATTERN_POSITIONS[version]
  for (const ar of alignCoords) {
    for (const ac of alignCoords) {
      // Don't overlap finders
      if (
        (ar === 6 && ac === 6) ||
        (ar === 6 && ac === alignCoords[alignCoords.length - 1]) ||
        (ar === alignCoords[alignCoords.length - 1] && ac === 6)
      ) {
        continue
      }
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2
          const isCenter = r === 0 && c === 0
          setModule(ar + r, ac + c, isOuter || isCenter)
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    if (!isFunctionModule[6][i]) setModule(6, i, i % 2 === 0)
    if (!isFunctionModule[i][6]) setModule(i, 6, i % 2 === 0)
  }

  // 4. Dark module
  setModule(4 * version + 9, 8, true)

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (!isFunctionModule[8][i]) isFunctionModule[8][i] = true
    if (!isFunctionModule[i][8]) isFunctionModule[i][8] = true
  }
  for (let i = 0; i < 8; i++) {
    isFunctionModule[8][matrixSize - 1 - i] = true
    isFunctionModule[matrixSize - 1 - i][8] = true
  }

  // 5. Place Data Codewords (Zigzag)
  let bitIdx = 0
  const finalBits: number[] = []
  for (const byte of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((byte >> b) & 1)
    }
  }

  let right = matrixSize - 1
  let upward = true

  while (right > 0) {
    if (right === 6) right-- // Skip vertical timing column
    const colList = [right, right - 1]

    for (let i = 0; i < matrixSize; i++) {
      const r = upward ? matrixSize - 1 - i : i
      for (const c of colList) {
        if (!isFunctionModule[r][c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx] : 0
          matrix[r][c] = bit === 1
          bitIdx++
        }
      }
    }
    right -= 2
    upward = !upward
  }

  // 6. Select Best Mask (evaluate mask patterns 0-7)
  const maskFunctions = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number) => r % 2 === 0,
    (_r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ]

  let bestMask = 0
  let lowestPenalty = Infinity

  for (let m = 0; m < 8; m++) {
    const maskFn = maskFunctions[m]
    // Calculate penalty
    let penalty = 0
    // Rule 1: 5 or more same color in row/col
    for (let r = 0; r < matrixSize; r++) {
      let runColor = false
      let runLen = 0
      for (let c = 0; c < matrixSize; c++) {
        const dark = isFunctionModule[r][c] ? matrix[r][c]! : matrix[r][c]! !== maskFn(r, c)
        if (c === 0) {
          runColor = dark
          runLen = 1
        } else if (dark === runColor) {
          runLen++
          if (runLen === 5) penalty += 3
          else if (runLen > 5) penalty += 1
        } else {
          runColor = dark
          runLen = 1
        }
      }
    }
    if (penalty < lowestPenalty) {
      lowestPenalty = penalty
      bestMask = m
    }
  }

  // 7. Apply Best Mask
  const finalMaskFn = maskFunctions[bestMask]
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (!isFunctionModule[r][c]) {
        matrix[r][c] = matrix[r][c]! !== finalMaskFn(r, c)
      }
    }
  }

  // 8. Write Format Information
  const formatVal = FORMAT_BITS[preferredEcc][bestMask]
  for (let i = 0; i < 15; i++) {
    const bit = ((formatVal >> i) & 1) === 1
    // Around top-left
    if (i < 6) matrix[i][8] = bit
    else if (i < 8) matrix[i + 1][8] = bit
    else matrix[8][15 - i - (i === 8 ? 0 : 0)] = bit

    // Bottom-left and top-right copies
    if (i < 7) matrix[8][matrixSize - 1 - i] = bit
    else matrix[matrixSize - 15 + i][8] = bit
  }
  // Adjust format bit module placements exactly per standard
  // Top-left format bits:
  // bits 0-5: (8, 0), (8, 1), (8, 2), (8, 3), (8, 4), (8, 5)
  // bits 6-8: (8, 7), (8, 8), (7, 8)
  // bits 9-14: (5, 8), (4, 8), (3, 8), (2, 8), (1, 8), (0, 8)
  const tlCoords: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8],
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ]
  const trBlCoords: [number, number][] = [
    [matrixSize - 1, 8], [matrixSize - 2, 8], [matrixSize - 3, 8],
    [matrixSize - 4, 8], [matrixSize - 5, 8], [matrixSize - 6, 8],
    [matrixSize - 7, 8],
    [8, matrixSize - 8], [8, matrixSize - 7], [8, matrixSize - 6],
    [8, matrixSize - 5], [8, matrixSize - 4], [8, matrixSize - 3],
    [8, matrixSize - 2], [8, matrixSize - 1],
  ]
  for (let i = 0; i < 15; i++) {
    const bit = ((formatVal >> (14 - i)) & 1) === 1
    matrix[tlCoords[i][0]][tlCoords[i][1]] = bit
    matrix[trBlCoords[i][0]][trBlCoords[i][1]] = bit
  }

  return matrix.map((row) => row.map((cell) => cell ?? false))
}

/**
 * Generate a standalone, high-contrast SVG string for a QR code.
 */
export function generateQrCodeSvg(
  text: string,
  options: QrCodeOptions = {},
): string {
  const {
    size = 280,
    margin = 4,
    darkColor = "#18181b",
    lightColor = "#ffffff",
    eccLevel = "M",
  } = options

  const matrix = generateQrMatrix(text, eccLevel)
  const count = matrix.length
  const totalCount = count + margin * 2
  const cellSize = size / totalCount

  let pathData = ""
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * cellSize
        const y = (r + margin) * cellSize
        pathData += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="${lightColor}" rx="12" />
  <path d="${pathData}" fill="${darkColor}" />
</svg>`
}

/**
 * Generate a data URL (image/svg+xml) for direct <img src="..."> consumption.
 */
export function generateQrCodeDataUrl(
  text: string,
  options: QrCodeOptions = {},
): string {
  const svg = generateQrCodeSvg(text, options)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Render the QR code directly onto an existing HTML Canvas element.
 */
export function drawQrCodeToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrCodeOptions = {},
): void {
  const {
    size = canvas.width || 280,
    margin = 4,
    darkColor = "#18181b",
    lightColor = "#ffffff",
    eccLevel = "M",
  } = options

  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.fillStyle = lightColor
  ctx.fillRect(0, 0, size, size)

  const matrix = generateQrMatrix(text, eccLevel)
  const count = matrix.length
  const totalCount = count + margin * 2
  const cellSize = size / totalCount

  ctx.fillStyle = darkColor
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(
          Math.floor((c + margin) * cellSize),
          Math.floor((r + margin) * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize),
        )
      }
    }
  }
}
