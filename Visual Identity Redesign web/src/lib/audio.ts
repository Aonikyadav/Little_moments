let ctx: AudioContext | null = null

export function unlockAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = ctx ?? new AC()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

export function beep(freq: number, dur = 0.1, vol = 0.12) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.frequency.value = freq
  o.type = 'sine'
  g.gain.setValueAtTime(vol, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + dur)
}

export function shutterSound() {
  if (!ctx) return
  const len = Math.floor(ctx.sampleRate * 0.12)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = ctx.createBufferSource()
  const g = ctx.createGain()
  g.gain.value = 0.35
  src.buffer = buf
  src.connect(g).connect(ctx.destination)
  src.start()
}
