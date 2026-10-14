const TONES = ['#e8d5b5', '#cfd8d0', '#e6c9c0', '#c9d3e0', '#e8e0b8', '#d9cce0', '#d6dcc0', '#ecd0b6', '#c8dada']
const HAIR = ['#2a2724', '#5a4632', '#1d1c1a', '#7a5a3a', '#3b3b3b', '#8a6a46', '#2a2724', '#4a3626', '#1d1c1a']

function hatch(g: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  g.save()
  g.strokeStyle = 'rgba(40,38,34,0.16)'
  g.lineWidth = 1.5
  g.beginPath()
  for (let x = -h; x < w; x += 14) {
    g.moveTo(x + (seed % 3), h)
    g.lineTo(x + h, 0)
  }
  g.stroke()
  g.restore()
}

/** Procedural sketched "portraits" used only for template previews. */
export function makeSamples(): HTMLCanvasElement[] {
  return TONES.map((tone, i) => {
    const w = 800
    const h = 600
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')!
    g.fillStyle = tone
    g.fillRect(0, 0, w, h)
    hatch(g, w, h, i)
    const cx = w / 2 + ((i % 3) - 1) * 70
    g.lineJoin = 'round'
    g.lineCap = 'round'
    g.strokeStyle = '#1d1c1a'
    g.lineWidth = 6
    // shoulders
    g.fillStyle = i % 2 ? '#4b4a47' : '#2f4a63'
    g.beginPath()
    g.moveTo(cx - 260, h + 10)
    g.quadraticCurveTo(cx - 240, h - 190, cx - 70, h - 200)
    g.lineTo(cx + 70, h - 200)
    g.quadraticCurveTo(cx + 240, h - 190, cx + 260, h + 10)
    g.closePath()
    g.fill()
    g.stroke()
    // neck
    g.fillStyle = '#f2dcc4'
    g.fillRect(cx - 38, h - 270, 76, 90)
    // head
    g.beginPath()
    g.ellipse(cx, h - 340, 108, 128, 0, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    // hair
    g.fillStyle = HAIR[i]
    g.beginPath()
    g.ellipse(cx, h - 390, 116, 92, 0, Math.PI, Math.PI * 2)
    g.fill()
    g.stroke()
    // face
    g.fillStyle = '#1d1c1a'
    g.beginPath()
    g.arc(cx - 40, h - 340, 8, 0, Math.PI * 2)
    g.arc(cx + 40, h - 340, 8, 0, Math.PI * 2)
    g.fill()
    g.lineWidth = 6
    g.beginPath()
    g.arc(cx, h - 310, 40, 0.2 * Math.PI, 0.8 * Math.PI)
    g.stroke()
    return c
  })
}
