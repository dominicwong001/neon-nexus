import { BODY, ENEMY_COLOR, HOLE, TUNING, droneAnchor, droneBlasterTips, droneStorm, fieldColor, fieldRadius, fieldRipple, hexFuseLit, orbitDiscs, pentChargeMax, placeStrikeTop, shellPose, type GameState, type Hole } from './sim.ts'

export interface StickView {
  x: number
  y: number
  ox: number
  oy: number
  aim?: boolean
}

export interface View {
  width: number
  height: number
  dpr: number
  pointerX: number
  pointerY: number
  pointerOn: boolean
  stick: StickView | null
  aimStick: StickView | null
  reduceMotion: boolean
  fast: boolean
}

const glowCache = new Map<string, HTMLCanvasElement>()
let lean = false

export function render(ctx: CanvasRenderingContext2D, state: GameState, view: View): void {
  const { width, height, dpr } = view
  lean = view.fast
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
  // Body + void under hostiles; Fast mode has no enemy auras, so nothing
  // opaque from the hole may paint after drawEnemies.
  drawHoles(ctx, state, X, Y, view.reduceMotion, 'body')
  drawHoles(ctx, state, X, Y, view.reduceMotion, 'void')
  drawReticle(ctx, state, X, Y)
  drawShocks(ctx, state, X, Y)
  drawOrbs(ctx, state, X, Y)
  drawEnemies(ctx, state, X, Y)
  drawHoles(ctx, state, X, Y, view.reduceMotion, 'glow')
  drawParticles(ctx, state, X, Y)
  drawBullets(ctx, state, X, Y)
  drawMortars(ctx, state, X, Y)
  drawBalls(ctx, state, X, Y)
  drawImpacts(ctx, state, X, Y)
  drawOrbiters(ctx, state, X, Y)
  drawPlayer(ctx, state)
  drawDrone(ctx, state, X, Y)
  drawBolts(ctx, state, X, Y, height, view.reduceMotion)
  drawFloaters(ctx, state, X, Y)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 36, 72, ${Math.min(0.55, state.flash * 0.55)})`
    ctx.fillRect(0, 0, width, height)
  }
  if (state.phase === 'play') drawAim(ctx, view, sx, sy)
  if (state.phase === 'play') {
    if (view.stick) drawStick(ctx, view.stick)
    if (view.aimStick) drawStick(ctx, view.aimStick)
  }
}

function drawField(ctx: CanvasRenderingContext2D, state: GameState): void {
  const radius = fieldRadius(state.mods.field)
  if (radius <= 0) return
  const red = fieldColor(state.mods.field) !== '#ffffff'
  const ink = red ? '255, 45, 58' : '255, 255, 255'
  const spin = -Math.PI / 2
  ctx.save()
  if (!lean) ctx.filter = 'blur(7px)'
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
    if (!lean) ctx.filter = `blur(${1 + phase * 11}px)`
    ctx.globalAlpha = (1 - phase) * (1 - phase * 0.55)
    ctx.strokeStyle = `rgba(${ink}, 0.9)`
    ctx.lineWidth = 2.5
    ctx.beginPath()
    polyPath(ctx, 0, 0, Math.max(2, phase * radius), 6, spin + i * (Math.PI / 5))
    ctx.stroke()
    ctx.restore()
  }
}

type HoleLayer = 'body' | 'void' | 'glow'

function holePose(well: Hole, time: number): {
  scale: number
  core: number
  reach: number
  spin: number
  twistMul: number
  red: boolean
} {
  const age = Math.max(0, well.max - well.life)
  const bornT = Math.min(1, age / HOLE.spawn)
  const born = 1 - Math.pow(1 - bornT, 3)
  const red = well.crimson
  const closing = well.closing > 0 && well.closeMax > 0 ? well.closing / well.closeMax : 1
  // Hold the vortex readable, then pin to a bright point in the last beat (no blank gap).
  let closeScale = 1
  if (well.closing > 0) {
    if (closing > 0.14) closeScale = 0.16 + 0.84 * Math.pow((closing - 0.14) / 0.86, red ? 0.7 : 0.78)
    else closeScale = Math.max(0.04, 0.16 * (closing / 0.14))
  }
  const scale = Math.max(0.04, born * closeScale)
  const spinBoost = (1 - born) * 12 + (well.closing > 0 ? (1 - closeScale) * 28 : 0)
  // Counter-clockwise on canvas — negate spin only; keep twist so arms still curl inward.
  const spin = -(time * (red ? 2.65 : 2.3) + spinBoost) + well.x * 0.01
  const twistMul = 1 + (1 - born) * 0.55 + (well.closing > 0 ? (1 - closeScale) * 3.2 : 0)
  const core = Math.max(28 * BODY, well.radius * 0.22) * scale
  // Arms taper just past the gameplay radius so pull reach matches the painted well.
  const reach = well.radius * (lean ? 1.02 : 1.08) * scale
  return { scale, core, reach, spin, twistMul, red }
}

function drawHoles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
  still: boolean,
  layer: HoleLayer,
): void {
  for (const well of state.holes) {
    if (well.blast > 0) {
      if (layer === 'body') paintHoleBlast(ctx, well, X, Y, still)
      continue
    }
    if (layer === 'body') paintHoleBody(ctx, well, state.time, X, Y, still)
    else if (layer === 'void') paintHoleVoid(ctx, well, state.time, X, Y)
    else paintHoleCenterGlow(ctx, well, state.time, X, Y)
  }
}

const HOLE_INK = [
  ['255, 255, 255', '228, 234, 245', '168, 178, 198', '100, 108, 128'],
  ['255, 248, 240', '255, 170, 70', '255, 70, 40', '140, 12, 28'],
] as const

function holeShade(red: boolean, shade: number): string {
  return HOLE_INK[red ? 1 : 0]![Math.min(3, Math.max(0, shade))]!
}

function holeNoise(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function holeTier(red: boolean, leanRed: number, leanNorm: number, fullRed: number, fullNorm: number): number {
  return lean ? (red ? leanRed : leanNorm) : red ? fullRed : fullNorm
}

function fillDisc(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
}

function fillRadial(
  ctx: CanvasRenderingContext2D,
  inner: number,
  outer: number,
  stops: readonly (readonly [number, string])[],
): void {
  const g = ctx.createRadialGradient(0, 0, inner, 0, 0, outer)
  for (const [t, c] of stops) g.addColorStop(t, c)
  ctx.fillStyle = g
  fillDisc(ctx, outer)
}

function stampGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  hex: string,
  alpha: number,
): void {
  ctx.globalAlpha = alpha
  ctx.drawImage(glowFor(hex), x - size / 2, y - size / 2, size, size)
}

function paintHoleWisp(
  ctx: CanvasRenderingContext2D,
  core: number,
  reach: number,
  base: number,
  twist: number,
  startT: number,
  endT: number,
  width: number,
  ink: string,
  alpha: number,
  steps: number,
  suck: number,
): void {
  const a0 = Math.max(0, Math.min(0.98, startT))
  const a1 = Math.max(a0 + 0.04, Math.min(1.08, endT))
  const count = Math.max(5, Math.ceil(steps * (a1 - a0)))
  const pull = Math.min(0.92, Math.max(0, suck))
  const span = (reach - core * 1.02) * (1 - pull * 0.78)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  let prevX = 0
  let prevY = 0
  for (let i = 0; i <= count; i++) {
    const u = i / count
    const t = a0 + (a1 - a0) * u
    const ang = base + t * twist
    const r = core * 1.02 + span * Math.pow(Math.min(1, t), 0.68)
    const px = Math.cos(ang) * r
    const py = Math.sin(ang) * r
    if (i > 0) {
      // Feather toward the outer tip: thinner and softer, no hard circular rim.
      const tip = Math.pow(u, 1.15)
      const fade = (1 - tip * 0.92) * (1 - pull * 0.22)
      ctx.strokeStyle = `rgba(${ink}, ${alpha * fade})`
      ctx.lineWidth = Math.max(0.25, width * (1 - tip * 0.82) * (1 - pull * 0.3))
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(px, py)
      ctx.stroke()
    }
    prevX = px
    prevY = py
  }
}

/** Short radial streaks that rush inward — little to no swirl. */
function paintHoleSuckRay(
  ctx: CanvasRenderingContext2D,
  core: number,
  reach: number,
  ang: number,
  width: number,
  ink: string,
  alpha: number,
  suck: number,
): void {
  const pull = Math.min(0.95, Math.max(0, suck))
  // Short dashes that race toward the void instead of long spokes.
  const band = reach - core
  const tip = core + band * (0.78 - pull * 0.62)
  const root = tip + band * (0.16 + (1 - pull) * 0.1)
  if (root <= tip + 1.5) return
  const cs = Math.cos(ang)
  const sn = Math.sin(ang)
  ctx.strokeStyle = `rgba(${ink}, ${alpha * (1 - pull * 0.2)})`
  ctx.lineWidth = Math.max(0.35, width * (1 - pull * 0.45))
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cs * root, sn * root)
  ctx.lineTo(cs * tip, sn * tip)
  ctx.stroke()
}

function paintHoleBody(
  ctx: CanvasRenderingContext2D,
  well: Hole,
  time: number,
  X: (x: number) => number,
  Y: (y: number) => number,
  still: boolean,
): void {
  const x = X(well.x)
  const y = Y(well.y)
  const { scale, core, reach, spin, twistMul, red } = holePose(well, time)
  const closingEarly = well.closing > 0 && well.closeMax > 0
  // Keep painting through the final pinpoint; only skip when fully gone.
  if (reach < 2 && !(closingEarly && core >= 1)) return
  const rim = red ? '#ff4a20' : '#ffffff'
  const hot = red ? '255, 220, 180' : '255, 255, 255'
  const plasmaR = reach * 0.78
  const steps = lean ? 10 : red ? 20 : 18
  const dens = red ? 0.72 : 1
  const alpha = (lr: number, ln: number, fr: number, fn: number) => (lean ? (red ? lr : ln) : red ? fr : fn)
  const outerN = holeTier(red, 40, 32, 100, 72)
  const midN = holeTier(red, 48, 40, 124, 88)
  const ribbonN = holeTier(red, 40, 28, 100, 64)
  const innerN = holeTier(red, 56, 44, 132, 96)
  const dustN = lean || still ? (red ? 70 : 56) : red ? 200 : 160

  if (!lean) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    stampGlow(ctx, x, y, Math.max(core * 5.5, reach * 1.35), rim, (red ? 0.16 : 0.18) * scale)
    stampGlow(ctx, x, y, core * 3.8, red ? '#ffb040' : '#ffffff', (red ? 0.3 : 0.34) * scale)
    ctx.restore()
  }

  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  fillRadial(ctx, 0, core * 1.85, red
    ? [[0, 'rgba(255,255,255,1)'], [0.28, 'rgba(255,210,140,1)'], [0.55, 'rgba(255,120,45,1)'], [0.82, 'rgba(220,28,40,1)'], [1, 'rgba(90,6,16,0)']]
    : [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(200,208,222,1)'], [0.8, 'rgba(110,118,135,1)'], [1, 'rgba(45,50,60,0)']])
  fillRadial(ctx, core * 1.15, plasmaR, red
    ? [[0, 'rgba(255,140,55,0.95)'], [0.4, 'rgba(230,40,45,0.75)'], [0.72, 'rgba(120,10,24,0.3)'], [1, 'rgba(50,0,8,0)']]
    : [[0, 'rgba(185,194,210,0.95)'], [0.45, 'rgba(130,138,155,0.65)'], [0.75, 'rgba(80,86,102,0.25)'], [1, 'rgba(40,45,55,0)']])
  if (!lean) ctx.globalCompositeOperation = 'lighter'
  fillRadial(ctx, core * 0.55, core * 2.35, [
    [0, `rgba(${hot}, 0)`],
    [0.35, red ? `rgba(255,180,90,${lean ? 0.22 : 0.36})` : `rgba(${hot},${lean ? 0.18 : 0.28})`],
    [0.7, red ? 'rgba(255,60,40,0.14)' : 'rgba(230,236,248,0.1)'],
    [1, 'rgba(0,0,0,0)'],
  ])

  ctx.globalAlpha = Math.min(1, 0.5 + scale * 0.5)
  if (!lean) ctx.globalCompositeOperation = 'lighter'

  const closing = well.closing > 0 && well.closeMax > 0
  const closeFrac = closing ? well.closing / well.closeMax : 1

  // Singularity only: soft concentric rings while the crimson vortex pinches shut.
  // Staggered births + short duty cycle keep rings spaced apart instead of stacked.
  if (red && closing) {
    const rings = lean ? 14 : 22
    ctx.globalCompositeOperation = lean ? 'source-over' : 'lighter'
    const blastInk = ['255, 255, 255', '255, 220, 180', '255, 176, 64', '255, 122, 40', '255, 74, 32', '255, 45, 58']
    for (let i = 0; i < rings; i++) {
      const n0 = holeNoise(i * 4.7 + 19.3)
      const n1 = holeNoise(i * 2.9 + 41.1)
      const period = 0.72 + n1 * 0.85
      const gap = 0.38 + n0 * 0.55
      const delay = i * (0.11 + n0 * 0.07) + n1 * 0.22
      let phase: number
      if (still) {
        phase = ((i * 1.65 + 0.5) / rings) % 1
      } else {
        const cycle = period + gap
        const local = ((time + delay) % cycle + cycle) % cycle
        if (local > period) continue
        phase = local / period
      }
      // Stretch radius so neighboring live rings sit farther apart.
      const radial = Math.pow(1 - phase, 0.72)
      const r = Math.max(core * 1.15, reach * (0.18 + radial * 0.82) * (0.5 + closeFrac * 0.5))
      const ink = blastInk[i % blastInk.length]!
      const width = Math.max(1.1, (1.4 + n1 * 3.6 + (1 - phase) * 1.8) * BODY * scale)
      const a = (0.1 + (1 - phase) * 0.16 + closeFrac * 0.05) * (0.55 + n0 * 0.25)
      ctx.strokeStyle = `rgba(${ink}, ${Math.min(0.32, a)})`
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (!lean) ctx.globalCompositeOperation = 'lighter'
  }

  const rayN = holeTier(red, 14, 8, 28, 14)
  for (let i = 0; i < rayN; i++) {
    const n0 = holeNoise(i * 2.4 + 61.2)
    const n1 = holeNoise(i * 5.7 + 70.4)
    const ang = (i / rayN) * Math.PI * 2 + n0 * 0.12 + spin * 0.05
    const suck = still ? n1 * 0.45 : (time * (2.6 + n0 * 3.2) + n1 * 3.4) % 1
    paintHoleSuckRay(
      ctx,
      core,
      reach,
      ang,
      Math.max(0.35, (0.55 + n1 * 1.6) * BODY * scale),
      holeShade(red, n0 > 0.7 ? 0 : n0 > 0.35 ? 1 : 2),
      alpha(0.16, 0.16, 0.36, 0.24),
      suck * suck,
    )
  }

  for (let i = 0; i < outerN; i++) {
    const n0 = holeNoise(i * 3.1 + 1.7)
    const n1 = holeNoise(i * 5.9 + 2.3)
    const n2 = holeNoise(i * 7.3 + 4.1)
    const rate = 0.22 + n0 * 1.8
    const startT = 0.28 + n2 * 0.4
    const suck = still ? n2 * 0.3 : (time * (0.7 + n1 * 1.25) + n0) % 1
    paintHoleWisp(
      ctx,
      core,
      reach,
      spin * (0.45 + n1 * 0.9) + n0 * Math.PI * 2 - time * rate * 0.55,
      (0.95 + n1 * 1.15) * twistMul,
      startT,
      Math.min(1.08, startT + 0.28 + n1 * 0.55 + n0 * 0.22),
      Math.max(0.4, (1.1 + n2 * 2.4) * BODY * scale * dens),
      holeShade(red, n0 > 0.62 ? 3 : 2),
      alpha(0.16, 0.16, 0.34, 0.32),
      steps,
      suck * suck,
    )
  }

  for (let i = 0; i < midN; i++) {
    const n0 = holeNoise(i * 2.7 + 11.2)
    const n1 = holeNoise(i * 4.4 + 8.6)
    const n2 = holeNoise(i * 9.1 + 3.5)
    const rate = 0.35 + n0 * 2.2
    const base = spin * (0.55 + n2 * 0.7) + n0 * Math.PI * 2 - time * rate * 0.6
    const twist = (1.25 + n1 * 1.05) * twistMul
    const startT = 0.05 + n2 * 0.2
    const endT = 0.48 + n1 * 0.42 + n0 * 0.18
    const suck = still ? n1 * 0.35 : (time * (0.85 + n0 * 1.5) + n2 * 3.1) % 1
    const width = Math.max(0.45, (1.35 + n2 * 2.4) * BODY * scale * dens)
    paintHoleWisp(ctx, core, reach, base, twist, startT, endT, width, holeShade(red, n0 > 0.66 ? 2 : 1), alpha(0.26, 0.26, 0.5, 0.46), steps, suck * suck)
    if (!lean && (red || n1 > 0.28)) {
      paintHoleWisp(
        ctx,
        core,
        reach * (0.9 + n2 * 0.2),
        base - 0.06,
        twist * 1.05,
        startT + 0.1,
        endT + 0.08,
        width * 0.55,
        holeShade(red, 3),
        red ? 0.22 : 0.2,
        steps,
        Math.min(0.95, suck * suck + 0.1),
      )
    }
  }

  for (let i = 0; i < ribbonN; i++) {
    const n0 = holeNoise(i * 1.7 + 33.4)
    const n1 = holeNoise(i * 5.1 + 29.8)
    const n2 = holeNoise(i * 8.4 + 19.2)
    const startT = 0.12 + n1 * 0.45
    const suck = still ? n0 * 0.4 : (time * (1.05 + n1 * 1.7) + n2 * 2.2) % 1
    paintHoleWisp(
      ctx,
      core,
      reach,
      spin * (0.5 + n1 * 0.5) + n0 * Math.PI * 2 - time * (0.4 + n0),
      (0.85 + n2 * 0.9) * twistMul,
      startT,
      Math.min(0.95, startT + 0.08 + n2 * 0.18),
      Math.max(0.35, (0.7 + n2 * 1.6) * BODY * scale * dens),
      holeShade(red, n0 > 0.55 ? 1 : 0),
      alpha(0.24, 0.24, 0.48, 0.42),
      steps,
      suck * suck,
    )
  }

  for (let i = 0; i < innerN; i++) {
    const n0 = holeNoise(i * 1.9 + 21.4)
    const n1 = holeNoise(i * 6.2 + 17.8)
    const n2 = holeNoise(i * 3.8 + 13.1)
    const suck = still ? n0 * 0.4 : (time * (1.15 + n2 * 1.7) + n1 * 2.4) % 1
    paintHoleWisp(
      ctx,
      core,
      reach,
      spin * (0.7 + n1 * 0.5) + n0 * Math.PI * 2 - time * (0.55 + n0 * 1.4),
      (1.55 + n1 * 0.85) * twistMul,
      n2 * 0.05,
      0.26 + n1 * 0.3,
      Math.max(0.5, (1.5 + n2 * 2.6) * BODY * scale * dens),
      holeShade(red, n0 > 0.7 ? 1 : 0),
      alpha(0.38, 0.38, 0.78, 0.7),
      steps,
      suck * suck,
    )
  }

  // Cosmic dust — mostly radial inward fall with a hint of swirl.
  for (let i = 0; i < dustN; i++) {
    const n0 = holeNoise(i * 1.3 + 40.2)
    const n1 = holeNoise(i * 2.1 + 44.7)
    const pace = 0.45 + n0 * 1.7 + (i % 7) * 0.11
    const drift = still ? (n1 * 0.97) % 1 : (time * pace + i * 0.137) % 1
    const pull = drift * drift * (3 - 2 * drift)
    const ang = n0 * Math.PI * 2 + spin * 0.08 - pull * n1 * 0.35
    const r = reach * (0.98 - (0.98 - (core * 1.02) / Math.max(reach, 1)) * pull)
    if (r <= core * 0.98) continue
    const size = (0.4 + n1 * 2.0 + (i % 6 === 0 ? 1.4 : 0)) * BODY * scale * (1 - pull * 0.55)
    const ink = holeShade(red, n0 > 0.72 ? 0 : n0 > 0.38 ? 1 : 2)
    const alpha = (0.12 + (1 - pull) * 0.7 * (0.4 + n1 * 0.6)) * (1 - Math.max(0, (core * 1.15 - r) / (core * 0.35)))
    if (alpha <= 0.02) continue
    ctx.fillStyle = `rgba(${ink}, ${alpha})`
    if (size > 1.5 * BODY && i % 3 === 0) {
      ctx.beginPath()
      ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, size * 0.45, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(Math.cos(ang) * r - size * 0.5, Math.sin(ang) * r - size * 0.5, size, size)
    }
  }

  // Late collapse: bright pinpoint that the vortex hands off (BH vanishes; Singularity detonates).
  if (closing && closeFrac < 0.28) {
    const pin = 1 - closeFrac / 0.28
    const pinR = Math.max(3.5, core * (0.55 + pin * 0.9))
    ctx.globalCompositeOperation = lean ? 'source-over' : 'lighter'
    ctx.globalAlpha = 1
    fillRadial(ctx, 0, pinR * (red ? 2.4 : 2.1), red
      ? [[0, `rgba(255,255,255,${0.95 + pin * 0.05})`], [0.35, `rgba(255,210,140,${0.7 + pin * 0.25})`], [0.7, `rgba(255,90,40,${0.35 * pin})`], [1, 'rgba(255,40,50,0)']]
      : [[0, `rgba(255,255,255,${0.95 + pin * 0.05})`], [0.4, `rgba(230,236,248,${0.55 + pin * 0.35})`], [0.75, `rgba(180,190,210,${0.22 * pin})`], [1, 'rgba(200,210,230,0)']])
  }

  ctx.restore()
}

function paintHoleVoid(
  ctx: CanvasRenderingContext2D,
  well: Hole,
  time: number,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const { scale, core, red } = holePose(well, time)
  // Stay with the vortex into the final pin; skip only when the core is gone.
  if (core < 0.8) return
  const hot = red ? '255, 245, 230' : '255, 255, 255'
  ctx.save()
  ctx.translate(X(well.x), Y(well.y))
  ctx.globalAlpha = Math.min(1, 0.4 + scale * 0.6)
  if (!lean) ctx.globalCompositeOperation = 'lighter'
  fillRadial(ctx, core * 0.55, core * 1.5, [
    [0, 'rgba(0,0,0,0)'],
    [0.45, red ? `rgba(255,190,110,${lean ? 0.18 : 0.32})` : `rgba(${hot},${lean ? 0.16 : 0.28})`],
    [0.8, red ? 'rgba(255,90,40,0.1)' : 'rgba(235,240,250,0.08)'],
    [1, 'rgba(0,0,0,0)'],
  ])
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  // Pitch-black core stays solid longer, then soft-falls only at the outer rim.
  fillRadial(ctx, 0, core * 1.48, [
    [0, 'rgba(0,0,0,1)'],
    [0.62, 'rgba(0,0,0,1)'],
    [0.78, 'rgba(0,0,0,0.98)'],
    [0.88, 'rgba(0,0,0,0.7)'],
    [0.95, 'rgba(0,0,0,0.28)'],
    [1, 'rgba(0,0,0,0)'],
  ])
  ctx.restore()
}

/** Soft horizon glow above enemies — kept off the pitch-black core. */
function paintHoleCenterGlow(
  ctx: CanvasRenderingContext2D,
  well: Hole,
  time: number,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  const { scale, core, red } = holePose(well, time)
  if (core < 1.2) return
  ctx.save()
  ctx.translate(X(well.x), Y(well.y))
  ctx.globalAlpha = Math.min(1, 0.55 + scale * 0.35)
  ctx.globalCompositeOperation = 'lighter'
  // Start outside the solid void so the center stays black.
  fillRadial(ctx, core * 0.85, core * 1.95, red
    ? [[0, 'rgba(255,200,140,0)'], [0.25, 'rgba(255,130,55,0.32)'], [0.65, 'rgba(255,60,35,0.14)'], [1, 'rgba(255,40,30,0)']]
    : [[0, 'rgba(235,240,250,0)'], [0.25, 'rgba(200,212,235,0.26)'], [0.65, 'rgba(170,180,205,0.1)'], [1, 'rgba(150,160,180,0)']])
  ctx.restore()
}

/** Rebuild enemy outline for fill / stroke. */
function enemyBodyPath(
  ctx: CanvasRenderingContext2D,
  e: { kind: number; radius: number; ballistic?: boolean; phase: number },
): void {
  ctx.beginPath()
  if (e.ballistic && e.kind === 3) traceHexWedge(ctx, e.phase)
  else if (e.kind === 0) polyPath(ctx, 0, 0, e.radius, 3, -Math.PI / 2)
  // Pentagon: vertex 0 at local angle 0 so the tip tracks e.angle after rotate.
  else if (e.kind === 1) polyPath(ctx, 0, 0, e.radius, 5, 0)
  else if (e.kind === 3) polyPath(ctx, 0, 0, e.radius, 6, -Math.PI / 2)
  else if (e.kind === 4) polyPath(ctx, 0, 0, e.radius, 4, Math.PI / 4)
  else ctx.arc(0, 0, e.radius, 0, Math.PI * 2)
}

const ENEMY_RGB: [number, number, number][] = [
  [255, 61, 242],
  [61, 184, 255],
  [141, 255, 106],
  [255, 45, 58],
  [255, 210, 58],
]

/** Subtle kind-colored skin wash on the black body (off in Fast mode). */
function enemySkinFill(
  ctx: CanvasRenderingContext2D,
  kind: number,
  radius: number,
): CanvasGradient | string {
  if (lean) return '#050508'
  const [r, g, b] = ENEMY_RGB[kind] ?? ENEMY_RGB[0]!
  const skin = ctx.createRadialGradient(0, 0, radius * 0.12, 0, 0, radius)
  skin.addColorStop(0, `rgb(${Math.round(r * 0.22)}, ${Math.round(g * 0.22)}, ${Math.round(b * 0.22)})`)
  skin.addColorStop(0.45, `rgb(${Math.round(r * 0.1)}, ${Math.round(g * 0.1)}, ${Math.round(b * 0.1)})`)
  skin.addColorStop(0.78, 'rgb(6, 6, 8)')
  skin.addColorStop(1, '#050508')
  return skin
}

function paintHoleBlast(
  ctx: CanvasRenderingContext2D,
  well: Hole,
  X: (x: number) => number,
  Y: (y: number) => number,
  _still: boolean,
): void {
  const x = X(well.x)
  const y = Y(well.y)
  const phase = 1 - Math.max(0, well.blast) / Math.max(0.01, well.blastMax)
  // Open from the collapse pinpoint immediately — no blank beat before the shockwave.
  const pinKick = Math.max(10, well.blastRadius * 0.06)
  const radius = Math.max(pinKick, well.blastRadius * Math.min(1, phase * 1.2))
  const fade = (1 - phase) * (1 - phase * 0.25)
  const pinFade = Math.max(0, 1 - phase * 4.5)

  if (!lean) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    stampGlow(ctx, x, y, radius * (2.2 + phase * 0.8), '#ff4a20', 0.5 * fade)
    stampGlow(ctx, x, y, radius * 1.05, '#ffffff', 0.32 * fade)
    if (pinFade > 0.02) stampGlow(ctx, x, y, pinKick * (1.8 + pinFade), '#ffffff', 0.85 * pinFade)
    ctx.restore()
  }
  ctx.save()
  ctx.translate(x, y)
  if (pinFade > 0.02) {
    ctx.globalCompositeOperation = lean ? 'source-over' : 'lighter'
    ctx.globalAlpha = 1
    fillRadial(ctx, 0, pinKick * (1.6 + pinFade), [
      [0, `rgba(255,255,255,${0.95 * pinFade})`],
      [0.35, `rgba(255,210,140,${0.75 * pinFade})`],
      [0.7, `rgba(255,90,40,${0.4 * pinFade})`],
      [1, 'rgba(255,40,50,0)'],
    ])
  }
  ctx.globalAlpha = fade
  fillRadial(ctx, 0, radius, [
    [0, 'rgba(255,255,255,0.55)'], [0.2, 'rgba(255,190,90,0.32)'],
    [0.55, 'rgba(255,60,40,0.16)'], [1, 'rgba(255,40,50,0)'],
  ])
  ctx.strokeStyle = 'rgba(255, 220, 180, 0.9)'
  ctx.lineWidth = (5.5 - phase * 2.2) * BODY
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255, 60, 40, 0.7)'
  ctx.lineWidth = (3.2 - phase * 1.2) * BODY
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
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
  if (!lean) ctx.globalCompositeOperation = 'lighter'
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
      ctx.lineWidth = 2.2
      ctx.strokeRect(X(shock.x) - inner, Y(shock.y) - inner, inner * 2, inner * 2)
      continue
    }
    const span = shock.span ?? 52
    const ring = 6 + t * span
    ctx.globalAlpha = fade * (shock.span ? 0.95 : 1)
    ctx.lineWidth = (shock.width ?? 2) * (1.15 - t * 0.55)
    ctx.beginPath()
    ctx.arc(X(shock.x), Y(shock.y), ring, 0, Math.PI * 2)
    ctx.stroke()
    if (shock.span && shock.span > 80) {
      ctx.globalAlpha = fade * 0.45
      ctx.lineWidth = Math.max(1.2, (shock.width ?? 2) * 0.45)
      ctx.beginPath()
      ctx.arc(X(shock.x), Y(shock.y), ring * 0.72, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (state.particles.length === 0) return
  ctx.save()
  if (!lean) ctx.globalCompositeOperation = 'lighter'
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    const s = p.size
    const px = X(p.x)
    const py = Y(p.y)
    if (p.shard) {
      // Broken enemy chips — short rotated shards, visual only.
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(p.ang ?? 0)
      ctx.fillRect(-s * 1.1, -s * 0.28, s * 2.2, s * 0.56)
      ctx.strokeStyle = p.color
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.85
      ctx.lineWidth = Math.max(0.8, s * 0.22)
      ctx.beginPath()
      ctx.moveTo(-s * 1.15, 0)
      ctx.lineTo(s * 1.15, 0)
      ctx.stroke()
      ctx.restore()
      continue
    }
    if (s > 3.5 * BODY) {
      ctx.beginPath()
      ctx.arc(px, py, s * 0.45, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(px - s / 2, py - s / 2, s, s)
    }
  }
  ctx.restore()
}

function drawOrbs(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (!lean) {
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
  }

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
  if (!lean) ctx.globalCompositeOperation = 'lighter'
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
  // Subtle kind-colored bloom — off in Fast mode.
  if (!lean) {
    const sheets = [glowFor('#ff3df2'), glowFor('#3db8ff'), glowFor('#8dff6a'), glowFor('#ff2d3a'), glowFor('#ffd23a')]
    const hurtGlow = glowFor('#ffffff')
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const e of state.enemies) {
      const bolt = e.ballistic && e.kind === 1
      const shard = e.ballistic && e.kind === 3
      // Pentagon bolts match hex-shard neon bloom (hot core + wide halo).
      const s = e.radius * (bolt || shard ? 4.6 : 2.6)
      ctx.globalAlpha = bolt || shard ? 0.82 : 0.55
      ctx.drawImage(sheets[e.kind]!, X(e.x) - s / 2, Y(e.y) - s / 2, s, s)
      if (bolt || shard) {
        const hot = e.radius * 2.8
        ctx.globalAlpha = 0.55
        ctx.drawImage(hurtGlow, X(e.x) - hot / 2, Y(e.y) - hot / 2, hot, hot)
      }
      if (e.flash > 0) {
        const punch = Math.min(1, e.flash / 0.08)
        const hs = e.radius * (3.4 + punch)
        ctx.globalAlpha = 0.35 + punch * 0.4
        ctx.drawImage(hurtGlow, X(e.x) - hs / 2, Y(e.y) - hs / 2, hs, hs)
      }
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  for (const e of state.enemies) {
    ctx.save()
    ctx.translate(X(e.x), Y(e.y))
    ctx.rotate(e.angle)
    const primed = e.fuse > 0
    const lit = primed && hexFuseLit(e.fuse)
    const shard = e.ballistic && e.kind === 3
    const bolt = e.ballistic && e.kind === 1
    const charging = !e.ballistic && e.kind === 1 && e.windup > 0
    const chargeT = charging ? 1 - e.windup / Math.max(0.01, pentChargeMax(e)) : 0
    if (lit) ctx.scale(1.08, 1.08)
    if (bolt || shard) {
      // Solid neon projectiles — same lit fill as hex shards / pent bolts.
      ctx.fillStyle = ENEMY_COLOR[e.kind]
      ctx.strokeStyle = bolt ? '#9adcff' : ENEMY_COLOR[3]
      ctx.lineWidth = (bolt ? 1.8 : 3.1) * BODY
      enemyBodyPath(ctx, e)
      ctx.fill()
      ctx.stroke()
    } else {
      // Black body; subtle kind skin only when glows are on.
      ctx.fillStyle = lit ? '#ffffff' : enemySkinFill(ctx, e.kind, e.radius)
      ctx.strokeStyle = lit ? '#ffffff' : ENEMY_COLOR[e.kind]
      ctx.lineWidth = ((e.kind === 3 ? 3.1 : 2) + (lit ? 2.4 : 0) + (lean ? 0.7 : 0)) * BODY
      enemyBodyPath(ctx, e)
      ctx.fill()
      ctx.stroke()
    }
    if (charging) {
      enemyBodyPath(ctx, e)
      ctx.fillStyle = `rgba(61, 184, 255, ${0.2 + chargeT * 0.65})`
      ctx.fill()
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + chargeT * 0.65})`
      ctx.lineWidth = (2.4 + chargeT * 2.2) * BODY
      ctx.stroke()
    } else if (e.flash > 0) {
      const punch = Math.min(1, e.flash / 0.08)
      enemyBodyPath(ctx, e)
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
  if (!lean) {
  const glow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const b of state.bullets) {
    ctx.drawImage(glow, X(b.x) - 14 * BODY, Y(b.y) - 14 * BODY, 28 * BODY, 28 * BODY)
  }
  ctx.restore()
  }

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
    const glowSize = ball.radius * (ball.quantum ? 7.4 : 6.2)
    const flex = ball.flex
    const squish = Math.max(0, (flex - 0.58) / 0.42)
    const stretch = flex > 0 && flex < 0.7 ? Math.sin(((0.7 - flex) / 0.7) * Math.PI) : 0
    const along = 1 - squish * 0.22 + stretch * 0.2
    const across = 1 + squish * 0.18 - stretch * 0.08
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ball.flexAngle)
    ctx.scale(along, across)
    ctx.rotate(-ball.flexAngle)
    if (!lean) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = ball.quantum ? 0.95 : 0.82
      ctx.drawImage(sheet, -glowSize / 2, -glowSize / 2, glowSize, glowSize)
      ctx.globalAlpha = 0.4
      ctx.drawImage(sheet, -glowSize, -glowSize, glowSize * 2, glowSize * 2)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }
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

function drawBolts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
  height: number,
  still: boolean,
): void {
  if (state.bolts.length === 0) return
  const cameraTop = state.playerY - height / 2
  ctx.save()
  for (const bolt of state.bolts) {
    const fade = Math.max(0, bolt.life / bolt.max)
    const flicker = 0.82 + 0.18 * Math.abs(Math.sin(state.time * 90 + bolt.x))
    const red = bolt.reactor
    const glow = red ? '#ff1a2e' : '#ffffff'
    const core = '#ffffff'
    const crack = Math.max(0.07, fade ** 1.7)
    const glowAlpha = (red ? 0.9 : 0.72) * flicker * (0.45 + fade * 0.55)
    const coreAlpha = Math.min(1, 0.55 + fade * 0.45)
    const strikeTop = bolt.strike.pts[0]
    const strikeBottom = bolt.strike.pts[bolt.strike.pts.length - 1]
    const strike = jitterPts(placeStrikeTop(bolt.strike.pts, cameraTop), state.time, bolt.x, still ? 0 : 6, true)
    if (!lean) ctx.globalCompositeOperation = 'lighter'
    fillJag(ctx, { pts: strike, half: bolt.strike.half }, X, Y, 5.4 * crack, glow, glowAlpha * (red ? 0.55 : 0.38))
    fillJag(ctx, { pts: strike, half: bolt.strike.half }, X, Y, 2.8 * crack, glow, glowAlpha)
    if (!lean) stampAura(ctx, strike, X, Y, glow, glowAlpha * 0.7, red ? 62 : 50)
    paintMotes(ctx, strike, state.time, fade, glow, core, X, Y)
    for (const arc of bolt.arcs) {
      const pts = jitterPts(arc.pts, state.time, bolt.y + arc.pts.length, still ? 0 : 3.5, true)
      fillJag(ctx, { pts, half: arc.half }, X, Y, 4.4 * crack, glow, glowAlpha * (red ? 0.5 : 0.34))
      fillJag(ctx, { pts, half: arc.half }, X, Y, 2.5 * crack, glow, glowAlpha)
      if (!lean) stampAura(ctx, pts, X, Y, glow, glowAlpha * 0.55, red ? 40 : 32)
      paintMotes(ctx, pts, state.time, fade, glow, core, X, Y)
      ctx.globalCompositeOperation = 'source-over'
      fillJag(ctx, { pts, half: arc.half }, X, Y, crack, core, coreAlpha)
      if (!lean) ctx.globalCompositeOperation = 'lighter'
    }
    ctx.globalCompositeOperation = 'source-over'
    fillJag(ctx, { pts: strike, half: bolt.strike.half }, X, Y, crack, core, coreAlpha)
    const ink = red ? '#ff2436' : '#ffffff'
    for (const ray of bolt.splinters) {
      const lifted = ray.pts.map((point) => ({
        x: point.x,
        y: strikeTop && strikeBottom ? liftWithStrike(point.y, strikeTop.y, strikeBottom.y, cameraTop) : point.y,
      }))
      const pts = jitterPts(lifted, state.time, bolt.x + ray.pts.length, still ? 0 : 3, false)
      fillJag(ctx, { pts, half: ray.half }, X, Y, 2.1 * crack, glow, glowAlpha * 0.9)
      fillJag(ctx, { pts, half: ray.half }, X, Y, crack, core, coreAlpha)
    }
    for (const ray of bolt.bursts) {
      const pts = jitterPts(ray.jag.pts, state.time, bolt.x, still ? 0 : 2.2, false)
      fillJag(ctx, { pts, half: ray.jag.half }, X, Y, 2.2 * crack, ink, glowAlpha)
      fillJag(ctx, { pts, half: ray.jag.half }, X, Y, crack, ink, coreAlpha)
    }
    paintShards(ctx, bolt.shards, X, Y, fade, ink)
  }
  ctx.restore()
}

function stampAura(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  X: (x: number) => number,
  Y: (y: number) => number,
  color: string,
  alpha: number,
  size: number,
): void {
  if (pts.length < 2 || alpha <= 0) return
  const sprite = glowFor(color)
  ctx.globalAlpha = alpha
  for (let i = 1; i < pts.length - 1; i += 2) {
    const point = pts[i]
    if (!point) continue
    const x = X(point.x)
    const y = Y(point.y)
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size)
  }
}

function paintMotes(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  time: number,
  fade: number,
  glow: string,
  core: string,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (pts.length < 2 || fade <= 0) return
  const age = 1 - fade
  const last = pts.length - 1
  const count = Math.min(12, last)
  for (let i = 0; i < count; i++) {
    const index = 1 + Math.floor(((i + 0.5) / count) * (last - 1))
    const point = pts[index]
    const prev = pts[Math.max(0, index - 1)]
    const next = pts[Math.min(last, index + 1)]
    if (!point || !prev || !next) continue
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    const side = i % 2 === 0 ? 1 : -1
    const reach = (4 + age * (16 + (i % 4) * 7)) * side
    const nx = (-dy / len) * reach
    const ny = (dx / len) * reach
    const blink = 0.35 + 0.65 * Math.abs(Math.sin(time * 58 + i * 2.3))
    const x = X(point.x + nx)
    const y = Y(point.y + ny)
    const spark = i % 3 === 0 ? 2.4 : 1.3
    ctx.fillStyle = glow
    ctx.globalAlpha = fade * blink * 0.9
    ctx.fillRect(x - spark, y - spark, spark * 2, spark * 2)
    ctx.fillStyle = core
    ctx.globalAlpha = fade * blink
    ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2)
  }
}

function liftWithStrike(y: number, strikeTop: number, strikeBottom: number, cameraTop: number): number {
  const lifted = placeStrikeTop(
    [
      { x: 0, y: strikeTop },
      { x: 0, y },
      { x: 0, y: strikeBottom },
    ],
    cameraTop,
  )
  return lifted[1]?.y ?? y
}

function jitterPts(
  pts: { x: number; y: number }[],
  time: number,
  seed: number,
  amount: number,
  lockEnds: boolean,
): { x: number; y: number }[] {
  if (amount <= 0) return pts
  const last = pts.length - 1
  return pts.map((point, index) => {
    if (lockEnds && (index === 0 || index === last)) return point
    return {
      x: point.x + Math.sin(time * 64 + seed + index * 1.7) * amount,
      y: point.y + Math.cos(time * 73 + seed * 0.6 + index * 2.2) * amount * 0.7,
    }
  })
}

function fillJag(
  ctx: CanvasRenderingContext2D,
  jag: { pts: { x: number; y: number }[]; half: number[] },
  X: (x: number) => number,
  Y: (y: number) => number,
  scale: number,
  color: string,
  alpha: number,
): void {
  const pts = jag.pts
  if (pts.length < 2 || alpha <= 0) return
  const left: { x: number; y: number }[] = []
  const right: { x: number; y: number }[] = []
  const last = pts.length - 1
  for (let i = 0; i < pts.length; i++) {
    const point = pts[i]
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(last, i + 1)]
    if (!point || !prev || !next) continue
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    const half = (jag.half[i] ?? 1) * scale
    const nx = (-dy / len) * half
    const ny = (dx / len) * half
    const sx = X(point.x)
    const sy = Y(point.y)
    left.push({ x: sx + nx, y: sy + ny })
    right.push({ x: sx - nx, y: sy - ny })
  }
  const start = left[0]
  if (!start) return
  ctx.beginPath()
  traceRail(ctx, left, false)
  traceRail(ctx, right.reverse(), true)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.fill()
}

function traceRail(
  ctx: CanvasRenderingContext2D,
  rail: { x: number; y: number }[],
  join: boolean,
): void {
  const first = rail[0]
  if (!first) return
  if (join) ctx.lineTo(first.x, first.y)
  else ctx.moveTo(first.x, first.y)
  for (let i = 1; i < rail.length; i++) {
    const point = rail[i]
    if (point) ctx.lineTo(point.x, point.y)
  }
}

function paintShards(
  ctx: CanvasRenderingContext2D,
  shards: { x: number; y: number; angle: number; size: number }[],
  X: (x: number) => number,
  Y: (y: number) => number,
  fade: number,
  color: string,
): void {
  const scale = 0.18 + 0.82 * fade
  ctx.fillStyle = color
  ctx.globalAlpha = Math.min(1, 0.4 + fade * 0.6)
  for (const shard of shards) {
    const size = shard.size * scale
    ctx.save()
    ctx.translate(X(shard.x), Y(shard.y))
    ctx.rotate(shard.angle)
    ctx.beginPath()
    ctx.moveTo(size, 0)
    ctx.lineTo(-size * 0.42, size * 0.32)
    ctx.lineTo(-size * 0.16, 0)
    ctx.lineTo(-size * 0.42, -size * 0.24)
    ctx.closePath()
    ctx.fill()
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
  const glow = lean ? null : glowFor(discs[0]?.halo ? '#ff2d3a' : '#ffffff')
  for (const disc of discs) {
    if (disc.fade < 0.04) continue
    const x = X(disc.x)
    const y = Y(disc.y)
    ctx.save()
    ctx.translate(x, y)
    ctx.globalAlpha = disc.fade * (disc.halo ? 0.82 : 1)
    if (!lean && glow) {
    const glowSize = disc.radius * (disc.halo ? 4.8 : 3.1)
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(glow, -glowSize / 2, -glowSize / 2, glowSize, glowSize)
    ctx.globalCompositeOperation = 'source-over'
    }
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
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(1.35, r * 0.05)
    ctx.stroke()
    ctx.lineCap = 'butt'
    traceBladeEdge(ctx, r)
    ctx.lineWidth = Math.max(2.8, r * 0.16)
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
  const a0 = -0.32
  const a1 = 1.1
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.98, a0, a1)
  ctx.arc(0, 0, r * 0.6, a1 - 0.06, a0 + 0.1, true)
  ctx.closePath()
}

function traceHexWedge(ctx: CanvasRenderingContext2D, span: number): void {
  const a0 = -Math.PI / 6
  const a1 = Math.PI / 6
  const v0x = Math.cos(a0) * span
  const v0y = Math.sin(a0) * span
  const v1x = Math.cos(a1) * span
  const v1y = Math.sin(a1) * span
  const cx = (v0x + v1x) / 3
  const cy = (v0y + v1y) / 3
  ctx.moveTo(-cx, -cy)
  ctx.lineTo(v0x - cx, v0y - cy)
  ctx.lineTo(v1x - cx, v1y - cy)
  ctx.closePath()
}

function traceBladeEdge(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.98, -0.32, 1.1)
}

function drawReticle(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  X: (x: number) => number,
  Y: (y: number) => number,
): void {
  if (state.mods.drone <= 0) return
  for (const shell of state.mortars) {
    const t = Math.min(1, shell.age / 0.36)
    const ease = 1 - (1 - t) ** 3
    const ink = shell.storm ? '#ff2d3a' : '#ffffff'
    ctx.save()
    ctx.translate(X(shell.tx), Y(shell.ty))
    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.lineWidth = 1.25
    ctx.globalAlpha = 0.48 * Math.min(1, 0.35 + ease)
    paintReticle(ctx, (1 - ease) * 28)
    ctx.restore()
  }
}

function paintReticle(ctx: CanvasRenderingContext2D, open: number): void {
  const s = 9 + open
  const arm = 6
  const tick = 4
  ctx.beginPath()
  ctx.moveTo(-s, -s)
  ctx.lineTo(-s + arm, -s)
  ctx.moveTo(s - arm, -s)
  ctx.lineTo(s, -s)
  ctx.moveTo(s, -s)
  ctx.lineTo(s, -s + arm)
  ctx.moveTo(s, s - arm)
  ctx.lineTo(s, s)
  ctx.moveTo(s, s)
  ctx.lineTo(s - arm, s)
  ctx.moveTo(-s + arm, s)
  ctx.lineTo(-s, s)
  ctx.moveTo(-s, s)
  ctx.lineTo(-s, s - arm)
  ctx.moveTo(-s, -s + arm)
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
    const heading = pose.heading
    const ink = shell.storm ? '#ff2d3a' : '#ffffff'
    if (!lean) {
    const steps = 8
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = ink
    ctx.lineWidth = 2.4
    for (let i = steps; i >= 1; i--) {
      const back = shellPose(shell, Math.max(0, p - i * 0.028))
      const front = shellPose(shell, Math.max(0, p - (i - 1) * 0.028))
      ctx.globalAlpha = ((steps - i + 1) / (steps + 1)) * 0.28
      ctx.beginPath()
      ctx.moveTo(X(back.x), Y(back.y))
      ctx.lineTo(X(front.x), Y(front.y))
      ctx.stroke()
    }
    ctx.restore()
    }
    ctx.save()
    ctx.translate(X(groundX), Y(groundY))
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(0, 0, 6.2, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    if (!lean) {
      const glow = glowFor(ink)
      const s = 40
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(glow, X(pose.x) - s / 2, Y(pose.y) - s / 2, s, s)
      ctx.restore()
    }
    ctx.save()
    ctx.translate(X(pose.x), Y(pose.y))
    ctx.rotate(heading)
    ctx.fillStyle = '#05060a'
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.55
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(19, 0)
    ctx.lineTo(-10, -4.6)
    ctx.lineTo(-10, 4.6)
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
  if (storm && !lean) {
    const glow = glowFor('#ff2d3a')
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.45
    ctx.drawImage(glow, -30, -30, 60, 60)
    ctx.restore()
  }
  const r = 13
  const spin = Math.PI / 6
  ctx.lineJoin = 'miter'
  ctx.miterLimit = 2
  ctx.lineWidth = 1.6
  ctx.fillStyle = '#05060a'
  ctx.strokeStyle = ink
  ctx.beginPath()
  polyPath(ctx, 0, 0, r, 6, spin)
  ctx.fill()
  for (const tip of droneBlasterTips()) {
    const len = Math.hypot(tip.x, tip.y) || 1
    const nx = tip.x / len
    const ny = tip.y / len
    const px = -ny
    const py = nx
    const half = 5.8
    const base = len - 6.5
    ctx.beginPath()
    ctx.moveTo(nx * base + px * half, ny * base + py * half)
    ctx.lineTo(nx * base - px * half, ny * base - py * half)
    ctx.lineTo(tip.x - px * half, tip.y - py * half)
    ctx.lineTo(tip.x + px * half, tip.y + py * half)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.beginPath()
  polyPath(ctx, 0, 0, r, 6, spin)
  ctx.stroke()
  const ax = Math.cos(spin) * r
  const ay = Math.sin(spin) * r
  ctx.beginPath()
  ctx.moveTo(ax + 9, 0)
  ctx.lineTo(ax, ay)
  ctx.lineTo(ax, -ay)
  ctx.closePath()
  ctx.fillStyle = '#05060a'
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 3.8, 0, Math.PI * 2)
  ctx.fillStyle = storm ? '#ff2d3a' : '#ffffff'
  ctx.fill()
  ctx.restore()
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const blink = state.invuln > 0 && Math.sin(state.time * 38) > 0
  ctx.save()
  if (blink) ctx.globalAlpha = 0.32

  if (!lean) {
  const glow = glowFor('#ffffff')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(glow, -52 * BODY, -52 * BODY, 104 * BODY, 104 * BODY)
  ctx.restore()
  }

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
  ctx.strokeStyle = stick.aim ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.arc(stick.ox, stick.oy, 56, 0, Math.PI * 2)
  ctx.stroke()
  if (!stick.aim) {
    ctx.beginPath()
    ctx.fillStyle = '#ffffff'
    ctx.arc(stick.x, stick.y, 16, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.arc(stick.x, stick.y, 14, 0, Math.PI * 2)
  ctx.moveTo(stick.x - 22, stick.y)
  ctx.lineTo(stick.x - 6, stick.y)
  ctx.moveTo(stick.x + 6, stick.y)
  ctx.lineTo(stick.x + 22, stick.y)
  ctx.moveTo(stick.x, stick.y - 22)
  ctx.lineTo(stick.x, stick.y - 6)
  ctx.moveTo(stick.x, stick.y + 6)
  ctx.lineTo(stick.x, stick.y + 22)
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
