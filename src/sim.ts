/** Drawn size of the ship, its gear, and the hostiles. */
export const BODY = 0.7

export const TUNING = {
  thrust: 12,
  maxSpeed: 450,
  drag: 6.5,
  bulletSpeed: 980,
  fireInterval: 0.28,
  muzzle: 22 * BODY,
  playerRadius: 14 * BODY,
  ringRadius: 34 * BODY,
  ringSpin: 0.65,
  hullMax: 5,
  invuln: 1.15,
  hitCooldown: 0.05,
  mercy: 1.4,
} as const

export const HIT = 100

export const ENEMY_COLOR = ['#ff3df2', '#ffd23a', '#8dff6a'] as const

export type EnemyKind = 0 | 1 | 2
export type Phase = 'play' | 'dead' | 'level'
export type UpgradeId = 'pulse' | 'caliber' | 'drift' | 'magnet' | 'fork' | 'greed' | 'plate' | 'orbiter' | 'field' | 'cache'

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
  orbitCd: number
  spin: number
  angle: number
  phase: number
  speed: number
  generation: number
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

export interface Impact {
  x: number
  y: number
  life: number
  max: number
  spin: number
}

export interface Orb {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  value: number
  color: string
  rare: boolean
  homing: boolean
  pulse: number
}

export interface Mods {
  pulse: number
  caliber: number
  drift: number
  magnet: number
  fork: number
  greed: number
  plate: number
  orbiter: number
  field: number
}

export interface Offer {
  id: UpgradeId
  title: string
  detail: string
  rank: number
  max: number
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
  level: number
  xp: number
  xpNeed: number
  hullMax: number
  orbitTime: number
  fieldTick: number
  mods: Mods
  offers: Offer[]
  bullets: Bullet[]
  enemies: Enemy[]
  orbs: Orb[]
  particles: Particle[]
  shocks: Shock[]
  impacts: Impact[]
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
  pickups: number
  leveled: boolean
}

const KIND = [
  { radius: 14 * BODY, hp: HIT, speed: 230, spin: 2.8 },
  { radius: 22 * BODY, hp: HIT * 2, speed: 100, spin: 1.15 },
  { radius: 20 * BODY, hp: HIT, speed: 108, spin: 0.8 },
] as const

const UPGRADE_MAX: Record<Exclude<UpgradeId, 'cache'>, number> = {
  pulse: 5,
  caliber: 3,
  drift: 4,
  magnet: 4,
  fork: 2,
  greed: 3,
  plate: 3,
  orbiter: 6,
  field: 5,
}

export const DISC = {
  radius: 36 * BODY,
  orbit: 176 * BODY,
  active: 4,
  recharge: 2.8,
  spin: 3,
  turn: 2.5,
} as const

export const FIELD = {
  tick: 0.22,
  color: '#3df0ff',
} as const

export function fieldRadius(rank: number): number {
  if (rank <= 0) return 0
  return (128 + Math.max(0, rank - 1) * 26) * BODY
}

export function fieldDamage(rank: number): number {
  return 6 + Math.max(0, rank - 1) * 3
}

export function fieldSlow(rank: number): number {
  return Math.max(0.34, 0.76 - Math.max(0, rank - 1) * 0.08)
}

const ORB_COMMON = '#ffffff'
const ORB_RARE = '#d9a6ff'

export function xpNeedFor(level: number): number {
  return 18 * 2 ** Math.max(0, level - 1)
}

function freshMods(): Mods {
  return { pulse: 0, caliber: 0, drift: 0, magnet: 0, fork: 0, greed: 0, plate: 0, orbiter: 0, field: 0 }
}

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
    level: 1,
    xp: 0,
    xpNeed: xpNeedFor(1),
    hullMax: TUNING.hullMax,
    orbitTime: 0,
    fieldTick: 0,
    mods: freshMods(),
    offers: [],
    bullets: [],
    enemies: [],
    orbs: [],
    particles: [],
    shocks: [],
    impacts: [],
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
  const events: StepEvents = { shots: 0, kills: 0, hurt: false, died: false, pickups: 0, leveled: false }
  const dt = Math.min(Math.max(rawDt, 0), 1 / 30)
  if (dt === 0) return events
  if (state.phase === 'play') simulate(state, input, dt, events)
  decayFx(state, dt)
  return events
}

export function chooseUpgrade(state: GameState, index: number): void {
  if (state.phase !== 'level') return
  const offer = state.offers[index]
  if (!offer) return
  applyUpgrade(state, offer.id)
  state.offers = []
  state.phase = 'play'
  if (openLevel(state)) state.offers = rollOffers(state)
}

function simulate(state: GameState, input: Input, dt: number, events: StepEvents): void {
  state.time += dt
  if (state.mods.orbiter > 0) state.orbitTime += dt
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
  pulseField(state, events)
  strikeOrbits(state, events)
  moveOrbs(state, input, dt, events)
  touchPlayer(state, events)
  if (state.phase === 'play' && openLevel(state)) {
    state.offers = rollOffers(state)
    events.leveled = true
  }
  thrustEmbers(state, dt)
}

function drift(state: GameState, input: Input, dt: number): void {
  let mx = input.moveX
  let my = input.moveY
  const moveCap = TUNING.maxSpeed * (1 + state.mods.drift * 0.14)
  const mag = Math.hypot(mx, my)
  if (mag > 1) {
    mx /= mag
    my /= mag
  }
  if (mag > 0.001) {
    const k = 1 - Math.exp(-TUNING.thrust * dt)
    state.playerVx += (mx * moveCap - state.playerVx) * k
    state.playerVy += (my * moveCap - state.playerVy) * k
  } else {
    const damp = Math.exp(-TUNING.drag * dt)
    state.playerVx *= damp
    state.playerVy *= damp
  }
  const speed = Math.hypot(state.playerVx, state.playerVy)
  if (speed > moveCap) {
    state.playerVx = (state.playerVx / speed) * moveCap
    state.playerVy = (state.playerVy / speed) * moveCap
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
  const interval = Math.max(0.08, TUNING.fireInterval / (1 + state.mods.pulse * 0.22))
  const shotSpeed = TUNING.bulletSpeed
  const life = 1.35
  let guard = 0
  while (state.fireCd <= 0 && guard < 4) {
    guard += 1
    state.fireCd += interval
    const angles = [state.aim]
    for (let n = 1; n <= state.mods.fork; n++) {
      angles.push(state.aim + n * 0.2, state.aim - n * 0.2)
    }
    for (const angle of angles) {
      const cs = Math.cos(angle)
      const sn = Math.sin(angle)
      state.bullets.push({
        x: state.playerX + cs * TUNING.muzzle,
        y: state.playerY + sn * TUNING.muzzle,
        // Carry the core's velocity so the shot stays on the cursor line
        // while the camera keeps the core centered.
        vx: cs * shotSpeed + state.playerVx,
        vy: sn * shotSpeed + state.playerVy,
        life,
      })
    }
    events.shots += 1
    state.muzzle = 0.05
    const cs = Math.cos(state.aim)
    const sn = Math.sin(state.aim)
    burst(state, state.playerX + cs * TUNING.muzzle, state.playerY + sn * TUNING.muzzle, '#ffffff', 2, 160)
  }
  if (state.bullets.length > 180) state.bullets.splice(0, state.bullets.length - 180)
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
      const reach = e.radius + 8 * BODY
      if (dx * dx + dy * dy > reach * reach) continue
      state.bullets.splice(i, 1)
      spawnImpact(state, b.x, b.y)
      burst(state, b.x, b.y, '#ffffff', 9, 260)
      if (e.hitCd <= 0) damageEnemy(state, e, events)
      break
    }
  }
}

function pushFloater(state: GameState, x: number, y: number, text: string, color: string, vy: number): void {
  state.floaters.push({
    x: x + Math.sin(x * 0.17 + y) * 6,
    y,
    vy,
    text,
    life: 0.72,
    max: 0.72,
    color,
  })
  if (state.floaters.length > 36) state.floaters.shift()
}

export function orbiterDamage(rank: number): number {
  return HIT / 2 + Math.max(0, rank - 1) * 10
}

export function orbiterShove(rank: number): number {
  return 4 + Math.max(0, rank - 1) * 2.5
}

export function orbitActive(rank: number): number {
  return DISC.active + Math.max(0, rank - 1) * 0.45
}

export function orbitRate(rank: number): number {
  return DISC.spin + Math.max(0, rank - 1) * 0.2
}

function damageEnemy(
  state: GameState,
  enemy: Enemy,
  events: StepEvents,
  dealt = HIT * (1 + state.mods.caliber),
  color = '#ffffff',
): void {
  enemy.hitCd = TUNING.hitCooldown
  enemy.hp -= dealt
  pushFloater(state, enemy.x, enemy.y - enemy.radius * 0.35, String(dealt), color, -68)
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
  state.shocks.push({
    x: enemy.x,
    y: enemy.y,
    life: 0.28,
    max: 0.28,
    color: ENEMY_COLOR[enemy.kind],
  })
  burst(state, enemy.x, enemy.y, ENEMY_COLOR[enemy.kind], 14, 280)
  dropOrb(state, enemy)
  if (enemy.kind === 2 && enemy.generation === 0) splitCircle(state, enemy)
  const idx = state.enemies.indexOf(enemy)
  if (idx >= 0) state.enemies.splice(idx, 1)
}

function splitCircle(state: GameState, enemy: Enemy): void {
  const heading = Math.hypot(enemy.vx, enemy.vy) > 8 ? Math.atan2(enemy.vy, enemy.vx) : state.rng() * Math.PI * 2
  for (const side of [-1, 1]) {
    const a = heading + side * 0.9
    const radius = Math.max(9 * BODY, enemy.radius * 0.55)
    const speed = enemy.speed
    state.enemies.push({
      x: enemy.x + Math.cos(a) * enemy.radius * 0.75,
      y: enemy.y + Math.sin(a) * enemy.radius * 0.75,
      vx: Math.cos(a) * speed * 0.55,
      vy: Math.sin(a) * speed * 0.55,
      radius,
      kind: 2,
      hp: HIT,
      hitCd: TUNING.hitCooldown,
      orbitCd: 0.2,
      spin: enemy.spin,
      angle: enemy.angle + side,
      phase: enemy.phase + side,
      speed,
      generation: 1,
    })
  }
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
    orbitCd: 0,
    spin: spec.spin * (state.rng() < 0.5 ? -1 : 1),
    angle: state.rng() * Math.PI * 2,
    phase: state.rng() * Math.PI * 2,
    speed: spec.speed * heatScale,
    generation: 0,
  })
}

function moveEnemies(state: GameState, input: Input, dt: number): void {
  const limit = Math.max(980, input.viewRadius * 2.5)
  const limit2 = limit * limit
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j]
    e.hitCd = Math.max(0, e.hitCd - dt)
    e.orbitCd = Math.max(0, e.orbitCd - dt)
    const dx = state.playerX - e.x
    const dy = state.playerY - e.y
    const dist = Math.hypot(dx, dy) || 1
    if (dist * dist > limit2) {
      state.enemies.splice(j, 1)
      continue
    }
    const inside = state.mods.field > 0 && dist < fieldRadius(state.mods.field) + e.radius
    const speed = e.speed * (inside ? fieldSlow(state.mods.field) : 1)
    const steer = 1 - Math.exp(-3.1 * dt)
    e.vx += ((dx / dist) * speed - e.vx) * steer
    e.vy += ((dy / dist) * speed - e.vy) * steer
    e.x += e.vx * dt
    e.y += e.vy * dt
    e.angle += e.spin * dt
  }
  separateEnemies(state)
}

function separateEnemies(state: GameState): void {
  const list = state.enemies
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i]
      if (!a) continue
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]
        if (!b) continue
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.hypot(dx, dy)
        const min = a.radius + b.radius + 6 * BODY
        if (dist >= min) continue
        if (dist < 0.01) {
          const ang = a.phase + b.phase + pass
          dx = Math.cos(ang)
          dy = Math.sin(ang)
          dist = 1
        }
        const push = (min - dist) * 0.5
        const nx = dx / dist
        const ny = dy / dist
        a.x -= nx * push
        a.y -= ny * push
        b.x += nx * push
        b.y += ny * push
      }
    }
  }
}

export function hexRingReach(angle: number, time: number): number {
  const sector = Math.PI / 3
  let a = angle - time * TUNING.ringSpin
  a -= Math.floor(a / sector) * sector
  const fromFlat = Math.abs(a - sector / 2)
  const apothem = TUNING.ringRadius * Math.cos(sector / 2)
  return apothem / Math.cos(fromFlat)
}

function shoveOutsideRing(state: GameState): void {
  const extra = 16 * BODY
  for (const e of state.enemies) {
    const dx = e.x - state.playerX
    const dy = e.y - state.playerY
    const dist = Math.hypot(dx, dy)
    let nx: number
    let ny: number
    let angle: number
    if (dist < 0.01) {
      angle = e.phase
      nx = Math.cos(angle)
      ny = Math.sin(angle)
    } else {
      nx = dx / dist
      ny = dy / dist
      angle = Math.atan2(dy, dx)
    }
    const limit = hexRingReach(angle, state.time) + e.radius
    if (dist > limit) continue
    const target = limit + extra
    e.x = state.playerX + nx * target
    e.y = state.playerY + ny * target
    e.vx = nx * 420
    e.vy = ny * 420
  }
}

function repelFromRing(state: GameState): void {
  shoveOutsideRing(state)
  separateEnemies(state)
  shoveOutsideRing(state)
}

function touchPlayer(state: GameState, events: StepEvents): void {
  if (state.invuln > 0) return
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j]
    const dx = e.x - state.playerX
    const dy = e.y - state.playerY
    const dist = Math.hypot(dx, dy) || 1
    const reach = TUNING.playerRadius + e.radius - 4 * BODY
    if (dist > reach) continue
    state.hull -= 1
    state.invuln = TUNING.invuln
    state.flash = 1
    state.shake = 9
    events.hurt = true
    burst(state, state.playerX, state.playerY, '#ff3df2', 12, 220)
    repelFromRing(state)
    if (state.hull <= 0) {
      state.hull = 0
      state.phase = 'dead'
      events.died = true
      state.flash = 1
      state.shake = 12
      burst(state, state.playerX, state.playerY, '#ffffff', 24, 340)
      burst(state, state.playerX, state.playerY, '#ff3df2', 16, 260)
    }
    return
  }
}

function dropOrb(state: GameState, enemy: Enemy): void {
  const rare = enemy.kind === 2
  const child = enemy.generation > 0
  const radius = rare ? (child ? 4.5 : 7) : enemy.kind === 1 ? 4.5 : 3.5
  const value = rare ? (child ? 3 : 6) : enemy.kind === 1 ? 2 : 1
  const a = state.rng() * Math.PI * 2
  const kick = 18 + state.rng() * 36
  if (state.orbs.length > 90) state.orbs.shift()
  state.orbs.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(a) * kick,
    vy: Math.sin(a) * kick,
    radius,
    value,
    color: rare ? ORB_RARE : ORB_COMMON,
    rare,
    homing: false,
    pulse: state.rng() * Math.PI * 2,
  })
}

function moveOrbs(state: GameState, input: Input, dt: number, events: StepEvents): void {
  const magnet = 86 + state.mods.magnet * 46
  const greed = 1 + state.mods.greed * 0.3
  const limit = Math.max(900, input.viewRadius * 2.8)
  for (let i = state.orbs.length - 1; i >= 0; i--) {
    const orb = state.orbs[i]
    const dx = state.playerX - orb.x
    const dy = state.playerY - orb.y
    const dist = Math.hypot(dx, dy) || 1
    if (dist > limit) {
      state.orbs.splice(i, 1)
      continue
    }
    if (dist < magnet) orb.homing = true
    if (orb.homing) {
      const speed = 462 + (1 - Math.min(1, dist / magnet)) * 294
      orb.vx = (dx / dist) * speed
      orb.vy = (dy / dist) * speed
    } else {
      const damp = Math.exp(-2.8 * dt)
      orb.vx *= damp
      orb.vy *= damp
    }
    orb.x += orb.vx * dt
    orb.y += orb.vy * dt
    orb.pulse += dt
    const landed = Math.hypot(state.playerX - orb.x, state.playerY - orb.y)
    if (landed > TUNING.playerRadius + orb.radius + 6 * BODY) continue
    const gain = Math.max(1, Math.round(orb.value * greed))
    state.xp += gain
    events.pickups += 1
    state.orbs.splice(i, 1)
    burst(state, state.playerX, state.playerY, orb.color, orb.rare ? 8 : 4, 140)
  }
}

export function orbitDiscs(state: GameState): { x: number; y: number; spin: number; fade: number }[] {
  const count = state.mods.orbiter > 0 ? state.mods.orbiter + 1 : 0
  if (count === 0) return []
  const active = orbitActive(state.mods.orbiter)
  const period = active + DISC.recharge
  const t = state.orbitTime % period
  if (t >= active) return []
  const fade = Math.min(1, t / 0.22, (active - t) / 0.5)
  const turn = state.time * orbitRate(state.mods.orbiter)
  const discs = []
  for (let i = 0; i < count; i++) {
    const angle = turn + (i * Math.PI * 2) / count
    discs.push({
      x: state.playerX + Math.cos(angle) * DISC.orbit,
      y: state.playerY + Math.sin(angle) * DISC.orbit,
      spin: angle * DISC.turn,
      fade,
    })
  }
  return discs
}

function shoveFromDisc(state: GameState, enemy: Enemy, x: number, y: number, shove: number): void {
  let dx = enemy.x - x
  let dy = enemy.y - y
  let dist = Math.hypot(dx, dy)
  if (dist < 0.01) {
    dx = x - state.playerX
    dy = y - state.playerY
    dist = Math.hypot(dx, dy) || 1
  }
  const nx = dx / dist
  const ny = dy / dist
  enemy.x += nx * shove
  enemy.y += ny * shove
  enemy.vx += nx * shove * 6
  enemy.vy += ny * shove * 6
}

function pulseField(state: GameState, events: StepEvents): void {
  const rank = state.mods.field
  if (rank <= 0) return
  const tick = Math.floor(state.time / FIELD.tick)
  if (tick === state.fieldTick) return
  state.fieldTick = tick
  const radius = fieldRadius(rank)
  const dealt = fieldDamage(rank)
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const enemy = state.enemies[j]
    if (!enemy) continue
    const dx = enemy.x - state.playerX
    const dy = enemy.y - state.playerY
    if (dx * dx + dy * dy > (radius + enemy.radius) ** 2) continue
    damageEnemy(state, enemy, events, dealt, FIELD.color)
  }
}

function strikeOrbits(state: GameState, events: StepEvents): void {
  const discs = orbitDiscs(state)
  if (discs.length === 0) return
  for (const disc of discs) {
    if (disc.fade < 0.45) continue
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j]
      if (!enemy || enemy.orbitCd > 0) continue
      const dx = disc.x - enemy.x
      const dy = disc.y - enemy.y
      const reach = DISC.radius + enemy.radius
      if (dx * dx + dy * dy > reach * reach) continue
      enemy.orbitCd = 0.42
      shoveFromDisc(state, enemy, disc.x, disc.y, orbiterShove(state.mods.orbiter))
      spawnImpact(state, disc.x, disc.y)
      damageEnemy(state, enemy, events, orbiterDamage(state.mods.orbiter))
    }
  }
}

function openLevel(state: GameState): boolean {
  if (state.phase !== 'play' || state.xp < state.xpNeed) return false
  state.xp -= state.xpNeed
  state.level += 1
  state.xpNeed = xpNeedFor(state.level)
  state.phase = 'level'
  return true
}

function rollOffers(state: GameState): Offer[] {
  const pool = (Object.keys(UPGRADE_MAX) as Exclude<UpgradeId, 'cache'>[]).filter(
    (id) => state.mods[id] < UPGRADE_MAX[id],
  )
  const picked: UpgradeId[] = []
  for (const pinned of ['orbiter', 'field'] as const) {
    const index = pool.indexOf(pinned)
    if (index >= 0) picked.push(pool.splice(index, 1)[0] ?? pinned)
  }
  while (picked.length < 3 && pool.length > 0) {
    const index = Math.floor(state.rng() * pool.length)
    const id = pool.splice(index, 1)[0]
    if (id) picked.push(id)
  }
  while (picked.length < 3) picked.push('cache')
  return picked.map((id) => describeOffer(state, id))
}

function describeOffer(state: GameState, id: UpgradeId): Offer {
  if (id === 'cache') {
    return { id, title: 'Cache', detail: 'Bank 40 score.', rank: 1, max: 1 }
  }
  const rank = state.mods[id] + 1
  const max = UPGRADE_MAX[id]
  const copy: Record<Exclude<UpgradeId, 'cache'>, { title: string; detail: string }> = {
    pulse: { title: 'Pulse', detail: 'Shots leave the core sooner.' },
    caliber: { title: 'Caliber', detail: 'Each round takes off one more hit.' },
    drift: { title: 'Drift', detail: 'Top speed climbs.' },
    magnet: { title: 'Magnet', detail: 'Orbs start homing from farther out.' },
    fork: { title: 'Fork', detail: 'Two extra rounds fan out beside the main shot.' },
    greed: { title: 'Greed', detail: 'Every orb is worth more.' },
    plate: { title: 'Plate', detail: 'Repair one hull segment and add a spare.' },
    orbiter: { title: 'Orbiter', detail: 'Two discs orbit the core, then fade out and recharge. They nudge what they hit.' },
    field: { title: 'Force Field', detail: 'A cyan field burns and slows anything inside.' },
  }
  const detail =
    id === 'orbiter' && rank > 1
      ? 'One more disc. They last longer, hit harder, spin faster, and nudge harder.'
      : id === 'field' && rank > 1
        ? 'The field widens, burns harder, and slows more.'
        : copy[id].detail
  return { id, title: copy[id].title, detail, rank, max }
}

function applyUpgrade(state: GameState, id: UpgradeId): void {
  if (id === 'cache') {
    state.score += 40
    if (state.score > state.best) state.best = state.score
    return
  }
  state.mods[id] += 1
  if (id === 'orbiter' && state.mods.orbiter === 1) state.orbitTime = 0.35
  if (id === 'field') state.fieldTick = Math.floor(state.time / FIELD.tick)
  if (id !== 'plate') return
  state.hullMax = Math.min(8, state.hullMax + 1)
  state.hull = Math.min(state.hullMax, state.hull + 1)
}

function spawnImpact(state: GameState, x: number, y: number): void {
  if (state.impacts.length > 32) state.impacts.shift()
  state.impacts.push({
    x,
    y,
    life: 0.22,
    max: 0.22,
    spin: state.rng() * Math.PI,
  })
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
    x: state.playerX + cs * 12 * BODY,
    y: state.playerY + sn * 12 * BODY,
    vx: cs * 50 + (state.rng() - 0.5) * 40,
    vy: sn * 50 + (state.rng() - 0.5) * 40,
    life: 0.22,
    max: 0.22,
    size: 2.2 * BODY,
    color: '#ffffff',
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
  for (let i = state.impacts.length - 1; i >= 0; i--) {
    state.impacts[i].life -= dt
    if (state.impacts[i].life <= 0) state.impacts.splice(i, 1)
  }
  for (let i = state.floaters.length - 1; i >= 0; i--) {
    const f = state.floaters[i]
    f.life -= dt
    f.y += f.vy * dt
    if (f.life <= 0) state.floaters.splice(i, 1)
  }
}
