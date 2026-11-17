import { BODY, ENEMY_COLOR, TUNING, droneAnchor, droneStorm, fieldColor, fieldRadius, fieldRipple, orbitDiscs, shellPose, type GameState } from './sim.ts'

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
  drawField(ctx, state)
  drawReticle(ctx, state, X, Y)
  drawShocks(ctx, state, X, Y)
  drawOrbs(ctx, state, X, Y)
  drawParticles(ctx, state, X, Y)
  drawEnemies(ctx, state, X, Y)
  drawBullets(ctx, state, X, Y)
  drawMortars(ctx, state, X, Y)
  drawBalls(ctx, state, X, Y)
  drawImpacts(ctx, state, X, Y)
  drawOrbiters(ctx, state, X, Y)
  drawPlayer(ctx, state)
  drawDrone(ctx, state, X, Y)
  drawFloaters(ctx, state, X, Y)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (state.phase === 'play') drawAim(ctx, view, sx, sy)
  if (view.stick && state.phase === 'play') drawStick(ctx, view.stick)
}

function drawField(ctx: CanvasRenderingContext2D, state: GameState): void {
  const radius = fieldRadius(state.mods.field)
  if (radius <= 0) return
  const red = fieldColor(state.mods.field) !== '#ffffff'
  const ink = red ? '255, 45, 58' : '255, 255, 255'
  const spin = -Math.PI / 2
  ctx.save()
  ctx.filter = 'blur(7px)'
  const fill = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius)
  fill.addColorStop(0, `rgba(${ink}, 0.34)`)
  fill.addColorStop(0.5, `rgba(${ink}, 0.18)`)
  fill.addColorStop(1, `rgba(${ink}, 0)`)
  ctx.fillStyle = fill
  ctx.beginPath()
  polyPath(ctx, 0, 0, radius, 6, spin)
  ctx.fill()
  ctx.restore()

  const life = 1.35
  const every = fieldRipple(state.mods.field)
  const newest = Math.floor(state.time / every)
  const span = Math.ceil(life / every)
  for (let i = newest; i >= newest - span; i--) {
    if (i < 0) continue
    const age = state.time - i * every
    if (age < 0 || age > life) continue
    const phase = age / life
    ctx.save()
    ctx.filter = `blur(${1 + phase * 11}px)`
    ctx.globalAlpha = (1 - phase) * (1 - phase * 0.55)
    ctx.strokeStyle = `rgba(${ink}, 0.9)`
    ctx.lineWidth = 2.5
    ctx.beginPath()
    polyPath(ctx, 0, 0, Math.max(2, phase * radius), 6, spin + i * (Math.PI / 5))
    ctx.stroke()
    ctx.restore()
  }
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

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  for (let x = mx0; x <= right; x += major) {
    for (let y = my0; y <= bottom; y += major) {
      ctx.fillRect(x - state.playerX - 1.6, y - state.playerY - 1.6, 3.2, 3.2)
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
    const fade = Math.max(0, shock.life / shock.max)
    ctx.strokeStyle = shock.color
    if (shock.square) {
      const outer = 7 + t * 22
      const inner = outer - 11
      const bright = Math.min(1, fade * 2.4)
      ctx.globalAlpha = bright
      ctx.lineWidth = 6
      ctx.strokeRect(X(shock.x) - outer, Y(shock.y) - outer, outer * 2, outer * 2)
      ctx.lineWidth = 6
      ctx.strokeRect(X(shock.x) - outer, Y(shock.y) - outer, outer * 2, outer * 2)
      ctx.lineWidth = 1.7
      ctx.strokeRect(X(shock.x) - inner, Y(shock.y) - inner, inner * 2, inner * 2)
      continue
    }
    ctx.globalAlpha = fade
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
    const bob = Math.sin(state.time * 4 + orb.pulse) * 1.4
    const x = X(orb.x)
    const y = Y(orb.y) + bob
    const glow = glowFor(orb.color)
    const s = orb.radius * (orb.rare ? 17 : 15)
    ctx.drawImage(glow, x - s / 2, y - s / 2, s, s)
    const hot = glowFor('#ffffff')
    const h = s * 0.5
    ctx.drawImage(hot, x - h / 2, y - h / 2, h, h)
  }
  ctx.restore()

  for (const orb of state.orbs) {
    const bob = Math.sin(state.time * 4 + orb.pulse) * 1.4
    const x = X(orb.x)
    const y = Y(orb.y) + bob
    const pulse = 1 + Math.sin(state.time * 7 + orb.pulse) * 0.12
    const r = orb.radius * pulse
    ctx.fillStyle = orb.color
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.fillStyle = '#ffffff'
    const core = Math.max(1.2, r * 0.55)
    ctx.fillRect(x - core, y - core, core * 2, core * 2)
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
    ctx.arc(x, y, (2 + (1 - t) * 6) * BODY, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = alpha * 0.9
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2 * BODY
    ctx.beginPath()
    ctx.arc(x, y, (5 + t * 28) * BODY, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = alpha
    ctx.lineWidth = 1.6 * BODY
    const len = (5 + t * 20) * BODY
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
  const sheets = [glowFor('#ff3df2'), glowFor('#ffd23a'), glowFor('#8dff6a'), glowFor('#ff2d3a')]
  const hurtGlow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const e of state.enemies) {
    const s = e.radius * 3.4
    ctx.drawImage(sheets[e.kind], X(e.x) - s / 2, Y(e.y) - s / 2, s, s)
    if (e.flash > 0) {
      const punch = Math.min(1, e.flash / 0.08)
      const hs = e.radius * (4.2 + punch)
      ctx.globalAlpha = 0.45 + punch * 0.55
      ctx.drawImage(hurtGlow, X(e.x) - hs / 2, Y(e.y) - hs / 2, hs, hs)
      ctx.globalAlpha = 1
    }
  }
  ctx.restore()

  for (const e of state.enemies) {
    ctx.save()
    ctx.translate(X(e.x), Y(e.y))
    ctx.rotate(e.angle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.strokeStyle = ENEMY_COLOR[e.kind]
    ctx.lineWidth = (e.kind === 3 ? 3.1 : 2) * BODY
    ctx.beginPath()
    if (e.kind === 0) polyPath(ctx, 0, 0, e.radius, 3, -Math.PI / 2)
    else if (e.kind === 1) polyPath(ctx, 0, 0, e.radius, 4, Math.PI / 4)
    else if (e.kind === 3) polyPath(ctx, 0, 0, e.radius, 6, -Math.PI / 2)
    else ctx.arc(0, 0, e.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (e.flash > 0) {
      const punch = Math.min(1, e.flash / 0.08)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.55 + punch * 0.45})`
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = (e.kind === 3 ? 4.2 : 3.2) * BODY
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
  const glow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const b of state.bullets) {
    ctx.drawImage(glow, X(b.x) - 14 * BODY, Y(b.y) - 14 * BODY, 28 * BODY, 28 * BODY)
  }
  ctx.restore()

  for (const b of state.bullets) {
    ctx.save()
    ctx.translate(X(b.x), Y(b.y))
    ctx.rotate(Math.atan2(b.vy - state.playerVy, b.vx - state.playerVx))
    ctx.scale(BODY, BODY)
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.moveTo(12, 0)
    ctx.lineTo(0, 3.2)
    ctx.lineTo(-10, 0)
    ctx.lineTo(0, -3.2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

function drawBalls(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (state.balls.length === 0) return
  const white = glowFor('#ffffff')
  const red = glowFor('#ff2d3a')
  for (const ball of state.balls) {
    const x = X(ball.x)
    const y = Y(ball.y)
    const sheet = ball.quantum ? red : white
    const glowSize = ball.radius * 3.2
    const flex = ball.flex
    const squish = Math.max(0, (flex - 0.58) / 0.42)
    const stretch = flex > 0 && flex < 0.7 ? Math.sin(((0.7 - flex) / 0.7) * Math.PI) : 0
    const along = 1 - squish * 0.42 + stretch * 0.4
    const across = 1 + squish * 0.36 - stretch * 0.16
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ball.flexAngle)
    ctx.scale(along, across)
    ctx.rotate(-ball.flexAngle)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.72
    ctx.drawImage(sheet, -glowSize / 2, -glowSize / 2, glowSize, glowSize)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.rotate(ball.spin)
    drawEnergyBall(ctx, ball.radius, ball.quantum)
    ctx.restore()
  }
}

function drawEnergyBall(ctx: CanvasRenderingContext2D, r: number, red: boolean): void {
  const ink = red ? '#ff2d3a' : '#ffffff'
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = '#05060a'
  ctx.fill()
  ctx.lineWidth = Math.max(1.6, r * 0.11)
  ctx.strokeStyle = ink
  ctx.stroke()
  const ex = -r * 0.28
  const ey = -r * 0.14
  ctx.beginPath()
  ctx.arc(ex, ey, r * 0.3, 0, Math.PI * 2)
  ctx.lineWidth = Math.max(1.2, r * 0.07)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(ex, ey, r * 0.11, 0, Math.PI * 2)
  ctx.fillStyle = ink
  ctx.fill()
}

function drawFloaters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  ctx.save()
  ctx.font = '700 18px Oxanium, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)'
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max)
    const x = X(f.x)
    const y = Y(f.y)
    ctx.strokeText(f.text, x, y)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, x, y)
  }
  ctx.restore()
}

function drawOrbiters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const discs = orbitDiscs(state)
  if (discs.length === 0) return
  const glow = glowFor(discs[0]?.halo ? '#ff2d3a' : '#ffffff')
  for (const disc of discs) {
    if (disc.fade < 0.04) continue
    const x = X(disc.x)
    const y = Y(disc.y)
    ctx.save()
    ctx.translate(x, y)
    ctx.globalAlpha = disc.fade * (disc.halo ? 0.82 : 1)
    const glowSize = disc.radius * (disc.halo ? 4.8 : 3.1)
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(glow, -glowSize / 2, -glowSize / 2, glowSize, glowSize)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = disc.fade
    ctx.rotate(disc.spin)
    drawSaw(ctx, disc.radius, disc.halo)
    ctx.restore()
  }
}

function drawSaw(ctx: CanvasRenderingContext2D, r: number, halo: boolean): void {
  const ink = halo ? '#ff2d3a' : '#ffffff'
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI * 2) / 3)
    traceCrescent(ctx, r)
    ctx.fillStyle = '#05060a'
    ctx.fill()
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.max(1.4, r * 0.075)
    ctx.stroke()
    if (halo) {
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.78, 0.08, 0.92)
      ctx.strokeStyle = ink
      ctx.lineWidth = Math.max(1.1, r * 0.045)
      ctx.stroke()
    }
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#05060a'
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = Math.max(1.3, r * 0.07)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2)
  ctx.fillStyle = ink
  ctx.fill()
}

function traceCrescent(ctx: CanvasRenderingContext2D, r: number): void {
  const a0 = -0.42
  const a1 = 1.28
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.98, a0, a1)
  ctx.arc(0, 0, r * 0.6, a1 - 0.06, a0 + 0.1, true)
  ctx.closePath()
}

function drawReticle(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (state.mods.drone <= 0) return
  for (const shell of state.mortars) {
    const fade = Math.min(1, shell.age / 0.22)
    const ink = shell.storm ? '#ff2d3a' : '#ffffff'
    ctx.save()
    ctx.translate(X(shell.tx), Y(shell.ty))
    ctx.scale(0.82 + fade * 0.18, 0.82 + fade * 0.18)
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineWidth = 1.25
    ctx.globalAlpha = 0.42 * fade
    paintReticle(ctx)
    ctx.restore()
  }
}

function paintReticle(ctx: CanvasRenderingContext2D): void {
  const s = 9
  const gap = 3
  const tick = 4
  ctx.beginPath()
  ctx.moveTo(-s, -s)
  ctx.lineTo(-gap, -s)
  ctx.moveTo(gap, -s)
  ctx.lineTo(s, -s)
  ctx.moveTo(s, -s)
  ctx.lineTo(s, -gap)
  ctx.moveTo(s, gap)
  ctx.lineTo(s, s)
  ctx.moveTo(s, s)
  ctx.lineTo(gap, s)
  ctx.moveTo(-gap, s)
  ctx.lineTo(-s, s)
  ctx.moveTo(-s, s)
  ctx.lineTo(-s, gap)
  ctx.moveTo(-s, -gap)
  ctx.lineTo(-s, -s)
  ctx.moveTo(0, -s - tick)
  ctx.lineTo(0, -s + tick)
  ctx.moveTo(0, s - tick)
  ctx.lineTo(0, s + tick)
  ctx.moveTo(-s - tick, 0)
  ctx.lineTo(-s + tick, 0)
  ctx.moveTo(s - tick, 0)
  ctx.lineTo(s + tick, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 1.7, 0, Math.PI * 2)
  ctx.fill()
}

function drawMortars(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  for (const shell of state.mortars) {
    const p = Math.min(1, shell.age / shell.flight)
    const pose = shellPose(shell, p)
    const groundX = shell.sx + (shell.tx - shell.sx) * p
    const groundY = shell.sy + (shell.ty - shell.sy) * p
    const rate = 1 / Math.max(0.05, shell.flight)
    const heading = Math.atan2(pose.vy * rate - state.playerVy, pose.vx * rate - state.playerVx)
    const ink = shell.storm ? '#ff2d3a' : '#ffffff'
    ctx.save()
    ctx.translate(X(groundX), Y(groundY))
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(0, 0, 6.2, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.translate(X(pose.x), Y(pose.y))
    ctx.rotate(heading)
    ctx.fillStyle = ink
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(18, 0)
    ctx.lineTo(-9, -3.4)
    ctx.lineTo(-9, 3.4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

function drawDrone(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (state.mods.drone <= 0) return
  const storm = droneStorm(state.mods.drone)
  const ink = storm ? '#ff2d3a' : '#ffffff'
  const pose = droneAnchor(state)
  ctx.save()
  ctx.translate(X(pose.x), Y(pose.y))
  ctx.rotate(state.droneFace)
  if (storm) {
    const glow = glowFor('#ff2d3a')
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.45
    ctx.drawImage(glow, -30, -30, 60, 60)
    ctx.restore()
  }
  ctx.fillStyle = '#05060a'
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(14, 0)
  ctx.lineTo(-10, -8)
  ctx.lineTo(-5, 0)
  ctx.lineTo(-10, 8)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-1, -5)
  ctx.lineTo(-8, -16)
  ctx.lineTo(-13, -12)
  ctx.lineTo(-6, -5)
  ctx.closePath()
  ctx.moveTo(-1, 5)
  ctx.lineTo(-8, 16)
  ctx.lineTo(-13, 12)
  ctx.lineTo(-6, 5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(1, 0, 1.5, 0, Math.PI * 2)
  ctx.fillStyle = ink
  ctx.fill()
  ctx.restore()
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const blink = state.invuln > 0 && state.invuln <= TUNING.invuln && Math.sin(state.time * 38) > 0
  ctx.save()
  if (blink) ctx.globalAlpha = 0.32

  const glow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(glow, -52 * BODY, -52 * BODY, 104 * BODY, 104 * BODY)
  ctx.restore()

  ctx.save()
  ctx.rotate(state.time * TUNING.ringSpin)
  ctx.setLineDash([0.1 * BODY, 7.5 * BODY])
  ctx.lineCap = 'round'
  strokePoly(ctx, 0, 0, TUNING.ringRadius, 6, 'rgba(255, 255, 255, 0.32)', 2.4 * BODY, 0)
  ctx.restore()

  const speed = Math.hypot(state.playerVx, state.playerVy)
  if (speed > 40) {
    ctx.save()
    ctx.rotate(Math.atan2(state.playerVy, state.playerVx) + Math.PI)
    ctx.scale(BODY, BODY)
    const len = Math.min(28, 8 + speed * 0.035)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)'
    ctx.beginPath()
    ctx.moveTo(-6, 0)
    ctx.lineTo(-6 - len, 4.5)
    ctx.lineTo(-12 - len, 0)
    ctx.lineTo(-6 - len, -4.5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.rotate(state.aim)
  ctx.scale(BODY, BODY)
  ctx.fillStyle = '#071016'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'miter'
  ctx.miterLimit = 3
  ctx.beginPath()
  ctx.moveTo(16, 0)
  ctx.lineTo(-14, 15)
  ctx.lineTo(-6, 0)
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)'
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  ctx.moveTo(x - 15, y)
  ctx.lineTo(x - 4.5, y)
  ctx.moveTo(x + 4.5, y)
  ctx.lineTo(x + 15, y)
  ctx.moveTo(x, y - 15)
  ctx.lineTo(x, y - 4.5)
  ctx.moveTo(x, y + 4.5)
  ctx.lineTo(x, y + 15)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.34)'
  ctx.fillRect(x - 1.1, y - 1.1, 2.2, 2.2)
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
