export const TUNING = {
  thrust: 12,
  maxSpeed: 450,
  drag: 6.5,
  bulletSpeed: 980,
  fireInterval: 0.28,
  muzzle: 22,
  playerRadius: 14,
  hullMax: 5,
  invuln: 1.15,
  hitCooldown: 0.05,
  mercy: 1.4,
} as const

export const ENEMY_COLOR = ['#ff3df2', '#ffd23a', '#8dff6a'] as const

export type EnemyKind = 0 | 1 | 2
export type Phase = 'play' | 'dead'

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export interface Enemy {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  kind: EnemyKind
  hp: number
  hitCd: number
  spin: number
  angle: number
  phase: number
  speed: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}

export interface Shock {
  x: number
  y: number
  life: number
  max: number
  color: string
}

export interface Floater {
  x: number
  y: number
  vy: number
  text: string
  life: number
  max: number
  color: string
}

export interface GameState {
  phase: Phase
  time: number
  playerX: number
  playerY: number
  playerVx: number
  playerVy: number
  aim: number
  fireCd: number
  hull: number
  invuln: number
  score: number
  best: number
  combo: number
  comboTime: number
  heat: number
  spawnCd: number
  shake: number
  flash: number
  muzzle: number
  thrustCd: number
  kills: number
  bullets: Bullet[]
  enemies: Enemy[]
  particles: Particle[]
  shocks: Shock[]
  floaters: Floater[]
  rng: () => number
}

export interface Input {
  moveX: number
  moveY: number
  aimX: number
  aimY: number
  aimActive: boolean
  viewRadius: number
}

export interface StepEvents {
  shots: number
  kills: number
  hurt: boolean
  died: boolean
}

const KIND = [
  { radius: 16, hp: 1, speed: 148, spin: 2.5 },
  { radius: 22, hp: 2, speed: 96, spin: 1.15 },
  { radius: 18, hp: 1, speed: 128, spin: 0.7 },
] as const

export function createGame(best = 0, seed = 1): GameState {
  let s = seed >>> 0 || 1
  const rng = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  return {
    phase: 'play',
    time: 0,
    playerX: 0,
    playerY: 0,
    playerVx: 0,
    playerVy: 0,
    aim: 0,
    fireCd: 0,
    hull: TUNING.hullMax,
    invuln: TUNING.mercy,
    score: 0,
    best: Math.max(0, best),
    combo: 0,
    comboTime: 0,
    heat: 0,
    spawnCd: 1.15,
    shake: 0,
    flash: 0,
    muzzle: 0,
    thrustCd: 0,
    kills: 0,
    bullets: [],
    enemies: [],
    particles: [],
    shocks: [],
    floaters: [],
    rng,
  }
}

/** Screen position of a world point while the core is pinned to the view center. */
export function worldToScreen(
  viewW: number,
  viewH: number,
  playerX: number,
  playerY: number,
  worldX: number,
  worldY: number,
): { x: number; y: number } {
  return {
    x: viewW / 2 + (worldX - playerX),
    y: viewH / 2 + (worldY - playerY),
  }
}

/** World position under a screen point while the core is pinned to the view center. */
export function screenToWorld(
  viewW: number,
  viewH: number,
  playerX: number,
  playerY: number,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  return {
    x: playerX + (screenX - viewW / 2),
    y: playerY + (screenY - viewH / 2),
  }
}

export function step(state: GameState, input: Input, rawDt: number): StepEvents {
  const events: StepEvents = { shots: 0, kills: 0, hurt: false, died: false }
  const dt = Math.min(Math.max(rawDt, 0), 1 / 30)
  if (dt === 0) return events
  if (state.phase === 'play') simulate(state, input, dt, events)
  decayFx(state, dt)
  return events
}

function simulate(state: GameState, input: Input, dt: number, events: StepEvents): void {
  state.time += dt
  state.heat = Math.min(99, Math.floor(state.time / 7))
  state.invuln = Math.max(0, state.invuln - dt)
  state.comboTime = Math.max(0, state.comboTime - dt)
  if (state.comboTime === 0) state.combo = 0

  drift(state, input, dt)
  aimAt(state, input)
  fire(state, dt, events)
  moveBullets(state, input, dt, events)
  spawn(state, input, dt)
  moveEnemies(state, input, dt)
  touchPlayer(state, events)
  thrustEmbers(state, dt)
}

function drift(state: GameState, input: Input, dt: number): void {
  let mx = input.moveX
  let my = input.moveY
  const mag = Math.hypot(mx, my)
  if (mag > 1) {
    mx /= mag
    my /= mag
  }
  if (mag > 0.001) {
    const k = 1 - Math.exp(-TUNING.thrust * dt)
    state.playerVx += (mx * TUNING.maxSpeed - state.playerVx) * k
    state.playerVy += (my * TUNING.maxSpeed - state.playerVy) * k
  } else {
    const damp = Math.exp(-TUNING.drag * dt)
    state.playerVx *= damp
    state.playerVy *= damp
  }
  const speed = Math.hypot(state.playerVx, state.playerVy)
  if (speed > TUNING.maxSpeed) {
    state.playerVx = (state.playerVx / speed) * TUNING.maxSpeed
    state.playerVy = (state.playerVy / speed) * TUNING.maxSpeed
  }
  state.playerX += state.playerVx * dt
  state.playerY += state.playerVy * dt
}

function aimAt(state: GameState, input: Input): void {
  if (!input.aimActive) return
  const dx = input.aimX - state.playerX
  const dy = input.aimY - state.playerY
  if (dx * dx + dy * dy < 64) return
  state.aim = Math.atan2(dy, dx)
}

function fire(state: GameState, dt: number, events: StepEvents): void {
  state.fireCd -= dt
  let guard = 0
  while (state.fireCd <= 0 && guard < 4) {
    guard += 1
    state.fireCd += TUNING.fireInterval
    const cs = Math.cos(state.aim)
    const sn = Math.sin(state.aim)
    state.bullets.push({
      x: state.playerX + cs * TUNING.muzzle,
      y: state.playerY + sn * TUNING.muzzle,
      // Carry the core's velocity so the shot stays on the cursor line
      // while the camera keeps the core centered.
      vx: cs * TUNING.bulletSpeed + state.playerVx,
      vy: sn * TUNING.bulletSpeed + state.playerVy,
      life: 1.35,
    })
    events.shots += 1
    state.muzzle = 0.05
    burst(state, state.playerX + cs * TUNING.muzzle, state.playerY + sn * TUNING.muzzle, '#e9fdff', 2, 160)
  }
  if (state.bullets.length > 120) state.bullets.splice(0, state.bullets.length - 120)
}

function moveBullets(state: GameState, input: Input, dt: number, events: StepEvents): void {
  const maxR = Math.max(320, input.viewRadius + 110)
  const maxR2 = maxR * maxR
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i]
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    const dxp = b.x - state.playerX
    const dyp = b.y - state.playerY
    if (b.life <= 0 || dxp * dxp + dyp * dyp > maxR2) {
      state.bullets.splice(i, 1)
      continue
    }
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j]
      const dx = b.x - e.x
      const dy = b.y - e.y
      const reach = e.radius + 8
      if (dx * dx + dy * dy > reach * reach) continue
      state.bullets.splice(i, 1)
      burst(state, b.x, b.y, '#e9fdff', 3, 150)
      if (e.hitCd <= 0) damageEnemy(state, e, events)
      break
    }
  }
}

function damageEnemy(state: GameState, enemy: Enemy, events: StepEvents): void {
  enemy.hitCd = TUNING.hitCooldown
  enemy.hp -= 1
  burst(state, enemy.x, enemy.y, ENEMY_COLOR[enemy.kind], 6, 140)
  if (enemy.hp > 0) return
  const mult = state.comboTime > 0 ? state.combo + 1 : 1
  state.combo = mult
  state.comboTime = 1.7
  const gain = 10 * mult * (enemy.kind === 1 ? 2 : 1)
  state.score += gain
  if (state.score > state.best) state.best = state.score
  state.kills += 1
  events.kills += 1
  state.shake = Math.min(7, state.shake + 2.4)
  state.floaters.push({
    x: enemy.x,
    y: enemy.y,
    vy: -36,
    text: `+${gain}`,
    life: 0.7,
    max: 0.7,
    color: ENEMY_COLOR[enemy.kind],
  })
  if (state.floaters.length > 14) state.floaters.shift()
  state.shocks.push({
    x: enemy.x,
    y: enemy.y,
    life: 0.28,
    max: 0.28,
    color: ENEMY_COLOR[enemy.kind],
  })
  burst(state, enemy.x, enemy.y, ENEMY_COLOR[enemy.kind], 14, 280)
  const idx = state.enemies.indexOf(enemy)
  if (idx >= 0) state.enemies.splice(idx, 1)
}

function spawn(state: GameState, input: Input, dt: number): void {
  state.spawnCd -= dt
  if (state.spawnCd > 0) return
  const interval = Math.max(0.38, 1.4 - state.time * 0.016)
  state.spawnCd += interval
  if (state.enemies.length >= 26) return
  spawnOne(state, input.viewRadius)
  if (state.heat >= 8 && state.rng() < 0.4 && state.enemies.length < 26) {
    spawnOne(state, input.viewRadius)
  }
}

function spawnOne(state: GameState, viewRadius: number): void {
  const roll = state.rng()
  let kind: EnemyKind = 0
  if (roll > 0.8) kind = 2
  else if (roll > 0.46) kind = 1
  if (state.time < 14 && kind === 2) kind = 0
  if (state.time < 7 && kind === 1 && state.rng() < 0.55) kind = 0
  const spec = KIND[kind]
  const ang = state.rng() * Math.PI * 2
  const dist = Math.max(200, viewRadius) + 90 + state.rng() * 180
  const heatScale = 1 + state.heat * 0.012
  state.enemies.push({
    x: state.playerX + Math.cos(ang) * dist,
    y: state.playerY + Math.sin(ang) * dist,
    vx: 0,
    vy: 0,
    radius: spec.radius,
    kind,
    hp: spec.hp,
    hitCd: 0,
    spin: spec.spin * (state.rng() < 0.5 ? -1 : 1),
    angle: state.rng() * Math.PI * 2,
    phase: state.rng() * Math.PI * 2,
    speed: spec.speed * heatScale,
  })
}

function moveEnemies(state: GameState, input: Input, dt: number): void {
  const limit = Math.max(980, input.viewRadius * 2.5)
  const limit2 = limit * limit
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j]
    e.hitCd = Math.max(0, e.hitCd - dt)
    const dx = state.playerX - e.x
    const dy = state.playerY - e.y
    const dist = Math.hypot(dx, dy) || 1
    if (dist * dist > limit2) {
      state.enemies.splice(j, 1)
      continue
    }
    const speed = e.speed
    const steer = 1 - Math.exp(-3.1 * dt)
    e.vx += ((dx / dist) * speed - e.vx) * steer
    e.vy += ((dy / dist) * speed - e.vy) * steer
    e.x += e.vx * dt
    e.y += e.vy * dt
    e.angle += e.spin * dt
  }
}

function touchPlayer(state: GameState, events: StepEvents): void {
  if (state.invuln > 0) return
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j]
    const dx = e.x - state.playerX
    const dy = e.y - state.playerY
    const dist = Math.hypot(dx, dy) || 1
    const reach = TUNING.playerRadius + e.radius - 4
    if (dist > reach) continue
    const nx = dx / dist
    const ny = dy / dist
    e.x = state.playerX + nx * (reach + 18)
    e.y = state.playerY + ny * (reach + 18)
    e.vx = nx * 260
    e.vy = ny * 260
    state.hull -= 1
    state.invuln = TUNING.invuln
    state.flash = 1
    state.shake = 9
    events.hurt = true
    burst(state, state.playerX, state.playerY, '#ff3df2', 12, 220)
    if (state.hull <= 0) {
      state.hull = 0
      state.phase = 'dead'
      events.died = true
      state.flash = 1
      state.shake = 12
      burst(state, state.playerX, state.playerY, '#5ef2ff', 24, 340)
      burst(state, state.playerX, state.playerY, '#ff3df2', 16, 260)
    }
    return
  }
}

function thrustEmbers(state: GameState, dt: number): void {
  const speed = Math.hypot(state.playerVx, state.playerVy)
  if (speed < 80) return
  state.thrustCd -= dt
  if (state.thrustCd > 0) return
  state.thrustCd = 0.028
  const a = Math.atan2(state.playerVy, state.playerVx) + Math.PI
  const cs = Math.cos(a)
  const sn = Math.sin(a)
  pushParticle(state, {
    x: state.playerX + cs * 12,
    y: state.playerY + sn * 12,
    vx: cs * 50 + (state.rng() - 0.5) * 40,
    vy: sn * 50 + (state.rng() - 0.5) * 40,
    life: 0.22,
    max: 0.22,
    size: 2.2,
    color: state.rng() < 0.25 ? '#ff3df2' : '#5ef2ff',
  })
}

function burst(state: GameState, x: number, y: number, color: string, count: number, speed: number): void {
  for (let i = 0; i < count; i++) {
    const a = state.rng() * Math.PI * 2
    const s = speed * (0.35 + state.rng() * 0.75)
    pushParticle(state, {
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.18 + state.rng() * 0.28,
      max: 0.46,
      size: 1.6 + state.rng() * 2.4,
      color,
    })
  }
}

function pushParticle(state: GameState, particle: Particle): void {
  if (state.particles.length > 280) state.particles.shift()
  state.particles.push(particle)
}

function decayFx(state: GameState, dt: number): void {
  state.flash = Math.max(0, state.flash - dt * 2.1)
  state.shake *= Math.exp(-7 * dt)
  if (state.shake < 0.15) state.shake = 0
  state.muzzle = Math.max(0, state.muzzle - dt)
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.life -= dt
    if (p.life <= 0) {
      state.particles.splice(i, 1)
      continue
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    const damp = Math.exp(-2.2 * dt)
    p.vx *= damp
    p.vy *= damp
  }
  for (let i = state.shocks.length - 1; i >= 0; i--) {
    state.shocks[i].life -= dt
    if (state.shocks[i].life <= 0) state.shocks.splice(i, 1)
  }
  for (let i = state.floaters.length - 1; i >= 0; i--) {
    const f = state.floaters[i]
    f.life -= dt
    f.y += f.vy * dt
    if (f.life <= 0) state.floaters.splice(i, 1)
  }
}
