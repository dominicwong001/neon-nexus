import { ENEMY_COLOR, TUNING, type GameState } from './sim.ts'

export interface StickView {
  x: number
  y: number
  ox: number
  oy: number
}

export interface View {
  width: number
  height: number
  dpr: number
  pointerX: number
  pointerY: number
  pointerOn: boolean
  stick: StickView | null
  reduceMotion: boolean
}

interface GlowSet {
  cyan: HTMLCanvasElement
  magenta: HTMLCanvasElement
  amber: HTMLCanvasElement
  lime: HTMLCanvasElement
}

let glows: GlowSet | null = null

export function render(ctx: CanvasRenderingContext2D, state: GameState, view: View): void {
  const { width, height, dpr } = view
  let sx = 0
  let sy = 0
  if (!view.reduceMotion && state.shake > 0.15) {
    sx = Math.sin(state.time * 53) * state.shake
    sy = Math.cos(state.time * 47) * state.shake
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.setTransform(dpr, 0, 0, dpr, (width / 2 + sx) * dpr, (height / 2 + sy) * dpr)

  const X = (x: number) => x - state.playerX
  const Y = (y: number) => y - state.playerY

  drawGrid(ctx, state, width, height)
  drawOrigin(ctx, state, width, height)
  drawBeacons(ctx, state, width, height)
  drawShocks(ctx, state, X, Y)
  drawParticles(ctx, state, X, Y)
  drawEnemies(ctx, state, X, Y)
  drawBullets(ctx, state, X, Y)
  drawFloaters(ctx, state, X, Y)
  drawPlayer(ctx, state)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawAim(ctx, view, sx, sy)
  if (view.stick) drawStick(ctx, view.stick)
}

function drawGrid(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number): void {
  const gap = 72
  const pad = gap * 2
  const left = state.playerX - width / 2 - pad
  const right = state.playerX + width / 2 + pad
  const top = state.playerY - height / 2 - pad
  const bottom = state.playerY + height / 2 + pad
  const x0 = Math.floor(left / gap) * gap
  const y0 = Math.floor(top / gap) * gap

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(94, 242, 255, 0.075)'
  ctx.lineWidth = 1
  for (let x = x0; x <= right; x += gap) {
    ctx.moveTo(x - state.playerX, y0 - state.playerY)
    ctx.lineTo(x - state.playerX, bottom - state.playerY)
  }
  for (let y = y0; y <= bottom; y += gap) {
    ctx.moveTo(x0 - state.playerX, y - state.playerY)
    ctx.lineTo(right - state.playerX, y - state.playerY)
  }
  ctx.stroke()

  const major = gap * 4
  const mx0 = Math.floor(left / major) * major
  const my0 = Math.floor(top / major) * major
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(94, 242, 255, 0.16)'
  for (let x = mx0; x <= right; x += major) {
    ctx.moveTo(x - state.playerX, my0 - state.playerY)
    ctx.lineTo(x - state.playerX, bottom - state.playerY)
  }
  for (let y = my0; y <= bottom; y += major) {
    ctx.moveTo(mx0 - state.playerX, y - state.playerY)
    ctx.lineTo(right - state.playerX, y - state.playerY)
  }
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 61, 242, 0.55)'
  for (let x = mx0; x <= right; x += major) {
    for (let y = my0; y <= bottom; y += major) {
      ctx.fillRect(x - state.playerX - 1.6, y - state.playerY - 1.6, 3.2, 3.2)
    }
  }
}

function drawOrigin(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number): void {
  const ox = -state.playerX
  const oy = -state.playerY
  if (Math.abs(ox) > width && Math.abs(oy) > height) return
  const glow = ctx.createRadialGradient(ox, oy, 20, ox, oy, 280)
  glow.addColorStop(0, 'rgba(94, 242, 255, 0.07)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(ox, oy, 280, 0, Math.PI * 2)
  ctx.fill()

  strokePoly(ctx, ox, oy, 230, 6, 'rgba(255, 61, 242, 0.32)', 1.6, Math.PI / 6)
  strokePoly(ctx, ox, oy, 112, 6, 'rgba(94, 242, 255, 0.4)', 1.5, state.time * 0.15)
  ctx.fillStyle = 'rgba(94, 242, 255, 0.55)'
  ctx.font = '600 12px Oxanium, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ORIGIN', ox, oy + 150)
}

function drawBeacons(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number): void {
  const cell = 640
  const x0 = Math.floor((state.playerX - width) / cell) - 1
  const x1 = Math.floor((state.playerX + width) / cell) + 1
  const y0 = Math.floor((state.playerY - height) / cell) - 1
  const y1 = Math.floor((state.playerY + height) / cell) + 1
  const palette = ['rgba(94, 242, 255, 0.22)', 'rgba(255, 61, 242, 0.2)', 'rgba(255, 210, 58, 0.2)']
  for (let iy = y0; iy <= y1; iy++) {
    for (let ix = x0; ix <= x1; ix++) {
      if (ix === 0 && iy === 0) continue
      const h = hashCell(ix, iy)
      if (h % 4 !== 0) continue
      const x = ix * cell + cell / 2 + ((h >>> 8) % 180) - 90 - state.playerX
      const y = iy * cell + cell / 2 + ((h >>> 16) % 180) - 90 - state.playerY
      const r = 28 + (h % 36)
      ctx.strokeStyle = palette[h % 3]
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      strokePoly(ctx, x, y, r * 0.45, 4, palette[h % 3], 1.25, ((h % 90) * Math.PI) / 180)
    }
  }
}

function drawShocks(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const shock of state.shocks) {
    const t = 1 - shock.life / shock.max
    ctx.globalAlpha = Math.max(0, shock.life / shock.max)
    ctx.strokeStyle = shock.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(X(shock.x), Y(shock.y), 8 + t * 52, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    const s = p.size
    ctx.fillRect(X(p.x) - s / 2, Y(p.y) - s / 2, s, s)
  }
  ctx.restore()
}

function drawEnemies(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const set = glowSprites()
  const sheets = [set.magenta, set.amber, set.lime]
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const e of state.enemies) {
    const s = e.radius * 3.4
    ctx.drawImage(sheets[e.kind], X(e.x) - s / 2, Y(e.y) - s / 2, s, s)
  }
  ctx.restore()

  for (const e of state.enemies) {
    ctx.save()
    ctx.translate(X(e.x), Y(e.y))
    ctx.rotate(e.angle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.strokeStyle = ENEMY_COLOR[e.kind]
    ctx.lineWidth = 2
    ctx.beginPath()
    if (e.kind === 0) polyPath(ctx, 0, 0, e.radius, 3, -Math.PI / 2)
    else if (e.kind === 1) polyPath(ctx, 0, 0, e.radius, 4, Math.PI / 4)
    else ctx.arc(0, 0, e.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (e.kind === 1 && e.hp === 1) {
      ctx.beginPath()
      ctx.moveTo(-e.radius * 0.4, -e.radius * 0.4)
      ctx.lineTo(e.radius * 0.4, e.radius * 0.4)
      ctx.stroke()
    }
    if (e.kind === 2) {
      ctx.beginPath()
      ctx.arc(0, 0, e.radius * 0.42, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }
}

function drawBullets(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const glow = glowSprites().cyan
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const b of state.bullets) {
    ctx.drawImage(glow, X(b.x) - 16, Y(b.y) - 16, 32, 32)
  }
  ctx.restore()

  for (const b of state.bullets) {
    const rx = b.vx - state.playerVx
    const ry = b.vy - state.playerVy
    ctx.save()
    ctx.translate(X(b.x), Y(b.y))
    ctx.rotate(Math.atan2(ry, rx))
    ctx.fillStyle = '#f7feff'
    ctx.strokeStyle = '#5ef2ff'
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.moveTo(12, 0)
    ctx.lineTo(0, 2.5)
    ctx.lineTo(-10, 0)
    ctx.lineTo(0, -2.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

function drawFloaters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  ctx.save()
  ctx.font = '600 14px Oxanium, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, X(f.x), Y(f.y))
  }
  ctx.restore()
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const blink = state.invuln > 0 && state.invuln <= TUNING.invuln && Math.sin(state.time * 38) > 0
  ctx.save()
  if (blink) ctx.globalAlpha = 0.32

  const glow = glowSprites().cyan
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(glow, -52, -52, 104, 104)
  ctx.restore()

  ctx.save()
  ctx.rotate(state.time * 0.65)
  strokePoly(ctx, 0, 0, 30, 6, 'rgba(94, 242, 255, 0.9)', 1.5, 0)
  ctx.restore()

  ctx.save()
  ctx.rotate(-state.time * 0.4)
  ctx.setLineDash([6, 8])
  ctx.strokeStyle = 'rgba(255, 61, 242, 0.9)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, 40, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  const speed = Math.hypot(state.playerVx, state.playerVy)
  if (speed > 40) {
    ctx.save()
    ctx.rotate(Math.atan2(state.playerVy, state.playerVx) + Math.PI)
    const len = Math.min(28, 8 + speed * 0.035)
    ctx.fillStyle = 'rgba(94, 242, 255, 0.95)'
    ctx.beginPath()
    ctx.moveTo(-10, 0)
    ctx.lineTo(-10 - len, 5)
    ctx.lineTo(-16 - len, 0)
    ctx.lineTo(-10 - len, -5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.rotate(state.aim)
  ctx.fillStyle = '#05080c'
  ctx.strokeStyle = '#f4feff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(20, 0)
  ctx.lineTo(-13, 11)
  ctx.lineTo(-7, 0)
  ctx.lineTo(-13, -11)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = '#5ef2ff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(9, 0)
  ctx.lineTo(-3, 0)
  ctx.stroke()
  ctx.fillStyle = '#ff3df2'
  ctx.beginPath()
  ctx.arc(-1, 0, 2.3, 0, Math.PI * 2)
  ctx.fill()
  if (state.muzzle > 0) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = 'rgba(244, 254, 255, 0.95)'
    ctx.lineWidth = 2
    const tip = 16 + 22 * (state.muzzle / 0.05)
    ctx.beginPath()
    ctx.moveTo(16, -3.5)
    ctx.lineTo(tip, 0)
    ctx.lineTo(16, 3.5)
    ctx.stroke()
  }
  ctx.restore()
  ctx.restore()
}

function drawAim(ctx: CanvasRenderingContext2D, view: View, sx: number, sy: number): void {
  const ox = view.width / 2 + sx
  const oy = view.height / 2 + sy
  const x = view.pointerOn ? view.pointerX : ox + 150
  const y = view.pointerOn ? view.pointerY : oy
  const dx = x - ox
  const dy = y - oy
  if (dx * dx + dy * dy > 36 * 36) {
    ctx.strokeStyle = 'rgba(94, 242, 255, 0.16)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(94, 242, 255, 0.95)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.moveTo(x - 20, y)
  ctx.lineTo(x - 6, y)
  ctx.moveTo(x + 6, y)
  ctx.lineTo(x + 20, y)
  ctx.moveTo(x, y - 20)
  ctx.lineTo(x, y - 6)
  ctx.moveTo(x, y + 6)
  ctx.lineTo(x, y + 20)
  ctx.stroke()
  ctx.fillStyle = '#ff3df2'
  ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
}

function drawStick(ctx: CanvasRenderingContext2D, stick: StickView): void {
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(94, 242, 255, 0.4)'
  ctx.lineWidth = 2
  ctx.arc(stick.ox, stick.oy, 56, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.fillStyle = 'rgba(5, 8, 12, 0.85)'
  ctx.arc(stick.x, stick.y, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ff3df2'
  ctx.lineWidth = 2
  ctx.stroke()
}

function strokePoly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  color: string,
  width: number,
  rotation: number,
): void {
  ctx.beginPath()
  polyPath(ctx, x, y, radius, sides, rotation)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

function polyPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number,
): void {
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * Math.PI * 2) / sides
    const px = x + Math.cos(a) * radius
    const py = y + Math.sin(a) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function glowSprites(): GlowSet {
  if (glows) return glows
  glows = {
    cyan: makeGlow('#5ef2ff'),
    magenta: makeGlow('#ff3df2'),
    amber: makeGlow('#ffd23a'),
    lime: makeGlow('#8dff6a'),
  }
  return glows
}

function makeGlow(hex: string): HTMLCanvasElement {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Glow buffer unavailable')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, hexAlpha(hex, 0.95))
  g.addColorStop(0.28, hexAlpha(hex, 0.28))
  g.addColorStop(1, hexAlpha(hex, 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return canvas
}

function hexAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function hashCell(ix: number, iy: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return (n ^ (n >>> 16)) >>> 0
}
