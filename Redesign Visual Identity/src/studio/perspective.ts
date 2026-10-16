// Piecewise affine mesh maps a source rectangle onto an editable keystone quad.
// This is a local geometry operation, not subject detection or automatic straightening.
type Point = {
  x: number
  y: number
}
export function warpPerspective(
  source: HTMLCanvasElement,
  horizontal: number,
  vertical: number,
) {
  if (!horizontal && !vertical) return source
  const w = source.width,
    h = source.height
  const output = document.createElement("canvas")
  output.width = w
  output.height = h
  const ctx = output.getContext("2d")!
  const px = horizontal * 0.0018,
    py = vertical * 0.0018
  const corners = [
    { x: w * Math.max(0, py), y: h * Math.max(0, px) },
    { x: w * (1 - Math.max(0, py)), y: h * Math.max(0, -px) },
    { x: w * (1 - Math.max(0, -py)), y: h * (1 - Math.max(0, -px)) },
    { x: w * Math.max(0, -py), y: h * (1 - Math.max(0, px)) },
  ]
  const map = (u: number, v: number): Point => ({
    x:
      corners[0].x * (1 - u) * (1 - v) +
      corners[1].x * u * (1 - v) +
      corners[2].x * u * v +
      corners[3].x * (1 - u) * v,
    y:
      corners[0].y * (1 - u) * (1 - v) +
      corners[1].y * u * (1 - v) +
      corners[2].y * u * v +
      corners[3].y * (1 - u) * v,
  })
  const triangle = (s: Point[], d: Point[]) => {
    const denominator =
      s[0].x * (s[1].y - s[2].y) +
      s[1].x * (s[2].y - s[0].y) +
      s[2].x * (s[0].y - s[1].y)
    const coefficients = (a: number, b: number, c: number) => [
      (a * (s[1].y - s[2].y) + b * (s[2].y - s[0].y) + c * (s[0].y - s[1].y)) /
        denominator,
      (a * (s[2].x - s[1].x) + b * (s[0].x - s[2].x) + c * (s[1].x - s[0].x)) /
        denominator,
      (a * (s[1].x * s[2].y - s[2].x * s[1].y) +
        b * (s[2].x * s[0].y - s[0].x * s[2].y) +
        c * (s[0].x * s[1].y - s[1].x * s[0].y)) /
        denominator,
    ]
    const [a, c, e] = coefficients(d[0].x, d[1].x, d[2].x)
    const [b, dv, f] = coefficients(d[0].y, d[1].y, d[2].y)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(d[0].x, d[0].y)
    ctx.lineTo(d[1].x, d[1].y)
    ctx.lineTo(d[2].x, d[2].y)
    ctx.closePath()
    ctx.clip()
    ctx.transform(a, b, c, dv, e, f)
    ctx.drawImage(source, 0, 0)
    ctx.restore()
  }
  const cells = 12
  for (let y = 0; y < cells; y++)
    for (let x = 0; x < cells; x++) {
      const u = x / cells,
        v = y / cells,
        nu = (x + 1) / cells,
        nv = (y + 1) / cells
      const s = [
        { x: u * w, y: v * h },
        { x: nu * w, y: v * h },
        { x: nu * w, y: nv * h },
        { x: u * w, y: nv * h },
      ]
      const d = [map(u, v), map(nu, v), map(nu, nv), map(u, nv)]
      triangle([s[0], s[1], s[2]], [d[0], d[1], d[2]])
      triangle([s[0], s[2], s[3]], [d[0], d[2], d[3]])
    }
  return output
}
