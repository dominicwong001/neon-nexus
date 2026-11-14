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

const glowCache = new Map<string, HTMLCanvasElement>()

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
  drawBeacons(ctx, state, width, height)
  drawShocks(ctx, state, X, Y)
  drawOrbs(ctx, state, X, Y)
  drawParticles(ctx, state, X, Y)
  drawEnemies(ctx, state, X, Y)
  drawBullets(ctx, state, X, Y)
  drawImpacts(ctx, state, X, Y)
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.075)'
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
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

function drawBeacons(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number): void {
  const cell = 640
  const x0 = Math.floor((state.playerX - width) / cell) - 1
  const x1 = Math.floor((state.playerX + width) / cell) + 1
  const y0 = Math.floor((state.playerY - height) / cell) - 1
  const y1 = Math.floor((state.playerY + height) / cell) + 1
  const palette = ['rgba(255, 255, 255, 0.22)', 'rgba(255, 61, 242, 0.2)', 'rgba(255, 210, 58, 0.2)']
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

function drawOrbs(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const orb of state.orbs) {
    const bob = Math.sin(state.time * 4 + orb.pulse) * 2
    const x = X(orb.x)
    const y = Y(orb.y) + bob
    const glow = glowFor(orb.color)
    const s = orb.radius * (orb.rare ? 5.2 : 4.2)
    ctx.drawImage(glow, x - s / 2, y - s / 2, s, s)
  }
  ctx.restore()

  for (const orb of state.orbs) {
    const bob = Math.sin(state.time * 4 + orb.pulse) * 2
    const x = X(orb.x)
    const y = Y(orb.y) + bob
    const pulse = 1 + Math.sin(state.time * 6 + orb.pulse) * 0.08
    const r = orb.radius * pulse
    ctx.beginPath()
    ctx.fillStyle = orb.color
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = '#ffffff'
    ctx.arc(x, y, Math.max(2, r * 0.42), 0, Math.PI * 2)
    ctx.fill()
    if (orb.rare) {
      ctx.strokeStyle = orb.color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, r + 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

function drawImpacts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const hit of state.impacts) {
    const t = 1 - hit.life / hit.max
    const alpha = Math.max(0, hit.life / hit.max)
    const x = X(hit.x)
    const y = Y(hit.y)
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 2 + (1 - t) * 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = alpha * 0.9
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 5 + t * 28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = alpha
    ctx.lineWidth = 1.6
    const len = 5 + t * 20
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = hit.spin + (i * Math.PI) / 3
      ctx.moveTo(x + Math.cos(a) * 2, y + Math.sin(a) * 2)
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawEnemies(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const sheets = [glowFor('#ff3df2'), glowFor('#ffd23a'), glowFor('#8dff6a')]
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
    ctx.restore()
  }
}

function drawBullets(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const glow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const b of state.bullets) {
    ctx.drawImage(glow, X(b.x) - 14, Y(b.y) - 14, 28, 28)
  }
  ctx.restore()

  for (const b of state.bullets) {
    const rx = b.vx - state.playerVx
    const ry = b.vy - state.playerVy
    ctx.save()
    ctx.translate(X(b.x), Y(b.y))
    ctx.rotate(Math.atan2(ry, rx))
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ffffff'
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

  const glow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(glow, -52, -52, 104, 104)
  ctx.restore()

  ctx.save()
  ctx.rotate(state.time * 0.65)
  strokePoly(ctx, 0, 0, 34, 6, 'rgba(255, 255, 255, 0.92)', 1.6, 0)
  ctx.restore()

  const speed = Math.hypot(state.playerVx, state.playerVy)
  if (speed > 40) {
    ctx.save()
    ctx.rotate(Math.atan2(state.playerVy, state.playerVx) + Math.PI)
    const len = Math.min(28, 8 + speed * 0.035)
    ctx.fillStyle = '#ffffff'
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
  ctx.fillStyle = '#071016'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(16, 0)
  ctx.lineTo(-14, 15)
  ctx.lineTo(-14, -15)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  ctx.strokeStyle = '#ffffff'
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
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
}

function drawStick(ctx: CanvasRenderingContext2D, stick: StickView): void {
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
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

function glowFor(hex: string): HTMLCanvasElement {
  const cached = glowCache.get(hex)
  if (cached) return cached
  const made = makeGlow(hex)
  glowCache.set(hex, made)
  return made
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
