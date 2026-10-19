export function warpPerspective(
  source: HTMLCanvasElement,
  perspectiveX = 0,
  perspectiveY = 0,
): HTMLCanvasElement {
  if (
    typeof document === "undefined" ||
    (perspectiveX === 0 && perspectiveY === 0) ||
    !source.width ||
    !source.height
  ) {
    return source
  }

  const { width, height } = source
  let current: HTMLCanvasElement = source

  if (perspectiveX !== 0) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const slices = 40
      const sliceH = height / slices
      const factor = (perspectiveX / 100) * 0.5
      for (let i = 0; i < slices; i++) {
        const sy = i * sliceH
        const sh = sliceH
        const t = (i + 0.5) / slices - 0.5
        const scaleX = Math.max(0.2, 1 + t * factor)
        const dw = width * scaleX
        const dx = (width - dw) / 2
        ctx.drawImage(current, 0, sy, width, sh, dx, sy, dw, sh + 0.5)
      }
      current = canvas
    }
  }

  if (perspectiveY !== 0) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const slices = 40
      const sliceW = width / slices
      const factor = (perspectiveY / 100) * 0.5
      for (let i = 0; i < slices; i++) {
        const sx = i * sliceW
        const sw = sliceW
        const t = (i + 0.5) / slices - 0.5
        const scaleY = Math.max(0.2, 1 + t * factor)
        const dh = height * scaleY
        const dy = (height - dh) / 2
        ctx.drawImage(current, sx, 0, sw, height, sx, dy, sw + 0.5, dh)
      }
      current = canvas
    }
  }

  return current
}
