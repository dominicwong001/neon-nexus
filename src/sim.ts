/** Drawn size of the ship, its gear, and the hostiles. */
export const BODY = 0.7

export const TUNING = {
  thrust: 12,
  maxSpeed: 300,
  drag: 6.5,
  bulletSpeed: 980,
  fireInterval: 0.28,
  muzzle: 22 * BODY,
  playerRadius: 14 * BODY,
  ringRadius: 34 * BODY,
  ringSpin: 0.65,
  hullMax: 8,
  invuln: 1.15,
  hitCooldown: 0.05,
  mercy: 1.4,
} as const

export const HIT = 100

export const ENEMY_COLOR = ['#ff3df2', '#ffd23a', '#8dff6a', '#ff2d3a'] as const

export type EnemyKind = 0 | 1 | 2 | 3
export type Phase = 'play' | 'dead' | 'level'
export type UpgradeId = 'pulse' | 'caliber' | 'drift' | 'magnet' | 'fork' | 'greed' | 'regen' | 'orbiter' | 'field' | 'ball' | 'drone' | 'tesla' | 'cache'
export type DamageSource = 'stream' | 'orbiter' | 'field' | 'ball' | 'drone' | 'tesla'

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
  maxHp: number
  hitCd: number
  flash: number
  orbitCd: number
  spin: number
  angle: number
  phase: number
  speed: number
  generation: number
  immortal: boolean
  ballistic: boolean
  fuse: number
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
  square?: boolean
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

export interface Mortar {
  sx: number
  sy: number
  tx: number
  ty: number
  age: number
  flight: number
  arc: number
  radius: number
  damage: number
  storm: boolean
  bx: number
  by: number
  dvx: number
  dvy: number
}

export interface Mods {
  pulse: number
  caliber: number
  drift: number
  magnet: number
  fork: number
  greed: number
  regen: number
  orbiter: number
  field: number
  ball: number
  drone: number
  tesla: number
}

export interface Bolt {
  life: number
  max: number
  reactor: boolean
  paths: { x: number; y: number }[][]
  tendrils: { x: number; y: number }[][]
  x: number
  y: number
}

export interface Ricochet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  radius: number
  damage: number
  echo: boolean
  quantum: boolean
  knock: number
  spin: number
  flex: number
  flexAngle: number
  touched: { enemy: Enemy; cd: number }[]
}

export interface Offer {
  id: UpgradeId
  title: string
  detail: string
  rank: number
  max: number
  overdrive: boolean
}

export interface DamageBin {
  t: number
  stream: number
  orbiter: number
  field: number
  ball: number
  drone: number
  tesla: number
}

export interface UpgradeMark {
  t: number
  source: DamageSource
  name: string
  rank: number
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
  ballCd: number
  droneCd: number
  droneBurst: number
  droneReload: number
  droneX: number
  droneY: number
  droneLag: number
  droneVx: number
  droneVy: number
  droneFace: number
  droneBarrel: number
  droneAreaCd: number
  droneAreaHot: boolean
  droneMarkX: number
  droneMarkY: number
  reticleOn: boolean
  reticleX: number
  reticleY: number
  reticleVx: number
  reticleVy: number
  teslaCd: number
  mods: Mods
  dealt: Record<DamageSource, number>
  damageBins: DamageBin[]
  upgradeMarks: UpgradeMark[]
  offers: Offer[]
  bullets: Bullet[]
  balls: Ricochet[]
  mortars: Mortar[]
  bolts: Bolt[]
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
  viewW: number
  viewH: number
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
  { radius: 14 * BODY, hp: 100, speed: 70, spin: 2.8 },
  { radius: 22 * BODY, hp: 200, speed: 31, spin: 1.15 },
  { radius: 20 * BODY, hp: 300, speed: 34, spin: 0.8 },
  { radius: 40 * BODY, hp: 1000, speed: 22, spin: 0.55 },
] as const

export const OVERDRIVE = 6

const UPGRADE_MAX: Record<Exclude<UpgradeId, 'cache'>, number> = {
  pulse: 5,
  caliber: 3,
  drift: 4,
  magnet: 4,
  fork: 2,
  greed: 3,
  regen: 3,
  orbiter: OVERDRIVE,
  field: OVERDRIVE,
  ball: OVERDRIVE,
  drone: 5,
  tesla: 5,
}

export const DISC = {
  radius: 36 * BODY,
  orbit: 176 * BODY,
  active: 4,
  recharge: 2.8,
  spin: 3,
  turn: 2.05,
} as const

export const FIELD = {
  tick: 0.22,
  color: '#ffffff',
  nullColor: '#ff2d3a',
} as const

export const DRONE = {
  stormRank: 5,
} as const

export function droneStorm(rank: number): boolean {
  return rank >= DRONE.stormRank
}

export const TESLA = {
  evolveRank: 5,
} as const

export function arcReactor(rank: number): boolean {
  return rank >= TESLA.evolveRank
}

export function teslaBolts(rank: number, reactor: boolean): number {
  if (rank <= 0) return 0
  if (reactor) return rank + 1
  return rank
}

export function teslaDamage(rank: number, reactor: boolean): number {
  if (rank <= 0) return 0
  const dealt = 140 + Math.max(0, rank - 1) * 40
  return reactor ? Math.round(dealt * 1.3) : dealt
}

export function teslaInterval(rank: number, reactor: boolean): number {
  if (rank <= 0) return 0
  const wait = Math.max(0.62, 1.4 - Math.max(0, rank - 1) * 0.18)
  return reactor ? Math.max(0.28, wait * 0.48) : wait
}

export function droneBurst(rank: number): number {
  if (rank <= 0) return 0
  if (droneStorm(rank)) return 4.2
  return 2.4 + Math.max(0, rank - 1) * 0.35
}

export function droneReload(rank: number): number {
  if (rank <= 0) return 0
  if (droneStorm(rank)) return 0.32
  return Math.max(0.75, 1.2 - Math.max(0, rank - 1) * 0.12)
}

export function droneVolley(rank: number): number {
  if (rank <= 0) return 0
  return rank + 1
}

export function droneInterval(rank: number): number {
  const step = Math.max(0, Math.min(rank, DRONE.stormRank) - 1)
  return Math.max(0.22, 0.32 - step * 0.02)
}

export function droneBlast(rank: number): number {
  if (rank <= 0) return 0
  if (droneStorm(rank)) return 84
  return 44 + Math.max(0, rank - 1) * 12
}

export function droneDamage(rank: number): number {
  if (rank <= 0) return 0
  return 7 + Math.max(0, rank - 1) * 2
}

export function droneAnchor(state: GameState): { x: number; y: number } {
  return { x: state.droneX, y: state.droneY }
}

export function droneBlasterTips(): { x: number; y: number }[] {
  const r = 13
  const spin = Math.PI / 6
  const reach = r * Math.cos(Math.PI / 6) + 6.5
  const wider = 0.24
  return [0, 4].map((edge) => {
    const aim = spin + (edge + 0.5) * (Math.PI / 3) + (edge === 0 ? wider : -wider)
    return { x: Math.cos(aim) * reach, y: Math.sin(aim) * reach }
  })
}

function droneSlot(state: GameState): { x: number; y: number } {
  const bob = Math.sin(state.time * 3.1) * 7
  const sway = Math.cos(state.time * 1.3) * 5
  return {
    x: state.playerX - 52 * BODY + sway,
    y: state.playerY - 64 * BODY + bob,
  }
}

function followDrone(state: GameState, dt: number): void {
  const slot = droneSlot(state)
  const prevX = state.droneX
  const prevY = state.droneY
  const speed = Math.hypot(state.playerVx, state.playerVy)
  const moving = speed > 36
  if (moving) state.droneLag = Math.min(0.2, state.droneLag + dt)
  else state.droneLag = 0
  if (!(moving && state.droneLag < 0.2)) {
    const rate = moving ? 6.5 : 11
    const k = 1 - Math.exp(-rate * dt)
    state.droneX += (slot.x - state.droneX) * k
    state.droneY += (slot.y - state.droneY) * k
  }
  if (dt > 1e-5) {
    const vx = (state.droneX - prevX) / dt
    const vy = (state.droneY - prevY) / dt
    const k = 1 - Math.exp(-12 * dt)
    state.droneVx += (vx - state.droneVx) * k
    state.droneVy += (vy - state.droneVy) * k
  }
  const want = state.reticleOn
    ? Math.atan2(state.reticleY - state.droneY, state.reticleX - state.droneX)
    : state.aim
  const diff = Math.atan2(Math.sin(want - state.droneFace), Math.cos(want - state.droneFace))
  const maxStep = 2.4 * dt
  state.droneFace += Math.max(-maxStep, Math.min(maxStep, diff))
}

function droneAimed(state: GameState): boolean {
  const want = Math.atan2(state.reticleY - state.droneY, state.reticleX - state.droneX)
  const diff = Math.atan2(Math.sin(want - state.droneFace), Math.cos(want - state.droneFace))
  return Math.abs(diff) < 0.1
}

export function fieldOverdrive(rank: number): boolean {
  return rank >= OVERDRIVE
}

export function fieldRadius(rank: number): number {
  if (rank <= 0) return 0
  const step = Math.min(rank, OVERDRIVE - 1)
  const radius = (128 + Math.max(0, step - 1) * 64) * BODY * 0.8
  if (fieldOverdrive(rank)) return radius + 96 * BODY
  return radius
}

export function fieldDamage(rank: number): number {
  if (fieldOverdrive(rank)) return 15
  return 6 + Math.floor(Math.max(0, rank - 1) * 1.5)
}

export function fieldSlow(rank: number): number {
  const step = Math.min(Math.max(rank, 1), OVERDRIVE - 1)
  const raw = Math.max(0.34, 0.76 - Math.max(0, step - 1) * 0.08)
  const eased = 1 - (1 - raw) * 0.55
  if (fieldOverdrive(rank)) return Math.max(0.3, eased - 0.16)
  return eased
}

export function fieldColor(rank: number): string {
  return fieldOverdrive(rank) ? FIELD.nullColor : FIELD.color
}

export function fieldRipple(rank: number): number {
  const step = Math.min(Math.max(rank, 1), OVERDRIVE - 1)
  return Math.max(0.18, 0.42 - Math.max(0, step - 1) * 0.06)
}

export function xpNeedFor(level: number): number {
  return Math.round(8 * 1.2 ** Math.max(0, level - 1))
}

export function streamDamage(rank: number): number {
  return HIT + Math.max(0, rank) * 25
}

export function levelMend(rank: number): number {
  return 1 + Math.max(0, rank)
}

export function orbGain(value: number, rank: number): number {
  return Math.max(1, Math.round(value * (1 + Math.max(0, rank) * 0.12)) + Math.max(0, rank))
}

function freshMods(): Mods {
  return { pulse: 0, caliber: 0, drift: 0, magnet: 0, fork: 0, greed: 0, regen: 0, orbiter: 0, field: 0, ball: 0, drone: 0, tesla: 0 }
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
    ballCd: 0.45,
    droneCd: 0,
    droneBurst: 0,
    droneReload: 0.4,
    droneX: -52 * BODY + 5,
    droneY: -64 * BODY,
    droneLag: 0,
    droneVx: 0,
    droneVy: 0,
    droneFace: 0,
    droneBarrel: 0,
    droneAreaCd: 0,
    droneAreaHot: false,
    droneMarkX: 0,
    droneMarkY: 0,
    reticleOn: false,
    reticleX: 0,
    reticleY: 0,
    reticleVx: 0,
    reticleVy: 0,
    teslaCd: 0.45,
    mods: freshMods(),
    dealt: { stream: 0, orbiter: 0, field: 0, ball: 0, drone: 0, tesla: 0 },
    damageBins: [],
    upgradeMarks: [],
    offers: [],
    bullets: [],
    balls: [],
    mortars: [],
    bolts: [],
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
  launchBalls(state, dt)
  moveBalls(state, input, dt, events)
  updateDrone(state, dt, events)
  updateTesla(state, dt, events, input.viewH)
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
  followDrone(state, dt)
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
    const spread = 0.18
    const angles =
      state.mods.fork >= 2
        ? [state.aim - spread, state.aim, state.aim + spread]
        : state.mods.fork >= 1
          ? [state.aim - spread * 0.5, state.aim + spread * 0.5]
          : [state.aim]
    for (const angle of angles) {
      const cs = Math.cos(angle)
      const sn = Math.sin(angle)
      state.bullets.push({
        x: state.playerX + cs * TUNING.muzzle,
        y: state.playerY + sn * TUNING.muzzle,
        vx: cs * shotSpeed,
        vy: sn * shotSpeed,
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

export function damageReport(state: GameState): { name: string; amount: number }[] {
  const rows: { name: string; amount: number }[] = [{ name: 'Stream', amount: state.dealt.stream }]
  if (state.mods.orbiter > 0) {
    rows.push({ name: state.mods.orbiter >= OVERDRIVE ? "Guardian's Halo" : 'Sentinel', amount: state.dealt.orbiter })
  }
  if (state.mods.field > 0) {
    rows.push({ name: state.mods.field >= OVERDRIVE ? 'Null Zone' : 'Force Field', amount: state.dealt.field })
  }
  if (state.mods.ball > 0) {
    rows.push({ name: state.mods.ball >= OVERDRIVE ? 'Quantum Core' : 'Bouncy Ball', amount: state.dealt.ball })
  }
  if (state.mods.drone > 0) {
    rows.push({ name: droneStorm(state.mods.drone) ? 'Bulletstorm' : 'Drone', amount: state.dealt.drone })
  }
  if (state.mods.tesla > 0 || state.dealt.tesla > 0) {
    rows.push({ name: arcReactor(state.mods.tesla) ? 'Arc Reactor' : 'Tesla Coil', amount: state.dealt.tesla })
  }
  rows.sort((a, b) => b.amount - a.amount)
  return rows
}

export function sourceLabel(source: DamageSource, rank: number): string {
  if (source === 'stream') return 'Stream'
  if (source === 'orbiter') return rank >= OVERDRIVE ? "Guardian's Halo" : 'Sentinel'
  if (source === 'field') return rank >= OVERDRIVE ? 'Null Zone' : 'Force Field'
  if (source === 'ball') return rank >= OVERDRIVE ? 'Quantum Core' : 'Bouncy Ball'
  if (source === 'tesla') return arcReactor(rank) ? 'Arc Reactor' : 'Tesla Coil'
  return droneStorm(rank) ? 'Bulletstorm' : 'Drone'
}

function noteDamage(state: GameState, source: DamageSource, amount: number): void {
  if (amount <= 0) return
  const slot = Math.floor(state.time / 0.5) * 0.5
  let bin = state.damageBins[state.damageBins.length - 1]
  if (!bin || bin.t !== slot) {
    bin = { t: slot, stream: 0, orbiter: 0, field: 0, ball: 0, drone: 0, tesla: 0 }
    state.damageBins.push(bin)
  }
  bin[source] += amount
}

function upgradeSource(id: UpgradeId, rank: number): { source: DamageSource; name: string } | null {
  if (id === 'pulse') return { source: 'stream', name: 'Pulse' }
  if (id === 'caliber') return { source: 'stream', name: 'Caliber' }
  if (id === 'fork') return { source: 'stream', name: 'Fork' }
  if (id === 'orbiter' || id === 'field' || id === 'ball' || id === 'drone' || id === 'tesla') {
    return { source: id, name: sourceLabel(id, rank) }
  }
  return null
}

export function orbiterDamage(rank: number): number {
  const dealt = 46 + Math.max(0, rank - 1) * 11
  return rank >= OVERDRIVE ? dealt + 18 : dealt
}

export function ballCount(rank: number): number {
  if (rank <= 0) return 0
  if (rank >= OVERDRIVE) return 2
  if (rank <= 2) return 1
  if (rank <= 4) return 2
  return 3
}

export function ballSpeed(rank: number): number {
  if (rank >= OVERDRIVE) return 700
  return 600
}

export function ballDamage(rank: number): number {
  if (rank >= OVERDRIVE) return 36
  return 14 + Math.max(0, rank - 1) * 4
}

export function ballLife(rank: number): number {
  if (rank >= OVERDRIVE) return 5.6
  return 4.6 + Math.max(0, rank - 1) * 0.2
}

export function ballInterval(rank: number): number {
  if (rank >= OVERDRIVE) return 1.15
  return Math.max(1.6, 2.3 - Math.max(0, rank - 1) * 0.14)
}

export function orbiterCount(rank: number): number {
  if (rank <= 0) return 0
  return Math.min(OVERDRIVE, rank + 1)
}

export function orbiterShove(rank: number): number {
  const step = Math.min(Math.max(rank, 1), OVERDRIVE - 1)
  const base = 1.4 + Math.max(0, step - 1) * 0.55
  return rank >= OVERDRIVE ? base + 1.2 : base
}

export function orbitActive(rank: number): number {
  return DISC.active + Math.max(0, Math.min(rank, OVERDRIVE - 1) - 1) * 0.45
}

export function orbitRate(rank: number): number {
  return DISC.spin + Math.max(0, Math.min(rank, OVERDRIVE - 1) - 1) * 0.2
}

export function discTurn(rank: number): number {
  return rank >= OVERDRIVE ? DISC.turn * 1.8 : DISC.turn
}

export function discRadius(rank: number): number {
  if (rank >= OVERDRIVE) return DISC.radius * 1.42
  return DISC.radius * 1.16
}

export function discOrbit(rank: number): number {
  if (rank >= OVERDRIVE) return DISC.orbit * 1.38
  return DISC.orbit * 1.14
}

function damageEnemy(
  state: GameState,
  enemy: Enemy,
  events: StepEvents,
  dealt = streamDamage(state.mods.caliber),
  color = '#ffffff',
  source: DamageSource = 'stream',
): void {
  if (enemy.immortal) {
    enemy.hitCd = TUNING.hitCooldown
    enemy.flash = 0.08
    return
  }
  enemy.hitCd = TUNING.hitCooldown
  enemy.flash = 0.08
  const before = Math.max(0, enemy.hp)
  const landed = Math.min(dealt, before)
  state.dealt[source] += landed
  noteDamage(state, source, landed)
  enemy.hp -= dealt
  pushFloater(state, enemy.x, enemy.y - enemy.radius * 0.35, String(dealt), color, -68)
  burst(state, enemy.x, enemy.y, ENEMY_COLOR[enemy.kind], 6, 140)
  if (enemy.hp > 0) return
  if (giantHex(enemy) && enemy.fuse <= 0) {
    finishEnemy(state, enemy, events)
    enemy.hp = 1
    enemy.immortal = true
    enemy.fuse = HEX_FUSE
    enemy.speed = 0
    enemy.vx = 0
    enemy.vy = 0
    return
  }
  finishEnemy(state, enemy, events)
}

function finishEnemy(state: GameState, enemy: Enemy, events: StepEvents): void {
  const mult = state.comboTime > 0 ? state.combo + 1 : 1
  state.combo = mult
  state.comboTime = 1.7
  const gain = 10 * mult * (enemy.kind === 3 ? 6 : enemy.kind === 1 ? 2 : 1)
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
  if (enemy.kind === 2 && enemy.radius > KIND[2].radius * 1.5) splitCircle(state, enemy, 'normal')
  else if (enemy.kind === 2 && enemy.generation === 0) splitCircle(state, enemy, 'piece')
  if (giantHex(enemy)) return
  const idx = state.enemies.indexOf(enemy)
  if (idx >= 0) state.enemies.splice(idx, 1)
}

function giantHex(enemy: Enemy): boolean {
  return enemy.kind === 3 && !enemy.ballistic && enemy.radius > KIND[3].radius * 1.45
}

export const HEX_FUSE = 1.75

export function hexFuseLit(fuse: number): boolean {
  const elapsed = Math.max(0, HEX_FUSE - fuse)
  const beat = elapsed * (1.1 + elapsed * 2.4)
  return Math.floor(beat) % 2 === 0
}

function splitCircle(state: GameState, enemy: Enemy, into: 'normal' | 'piece'): void {
  const heading = Math.hypot(enemy.vx, enemy.vy) > 8 ? Math.atan2(enemy.vy, enemy.vx) : state.rng() * Math.PI * 2
  const normal = into === 'normal'
  for (const side of [-1, 1]) {
    const a = heading + side * 0.9
    const radius = normal ? KIND[2].radius : KIND[2].radius * 0.48
    const speed = normal ? KIND[2].speed : enemy.speed
    state.enemies.push({
      x: enemy.x + Math.cos(a) * enemy.radius * 0.55,
      y: enemy.y + Math.sin(a) * enemy.radius * 0.55,
      vx: Math.cos(a) * speed * 0.55,
      vy: Math.sin(a) * speed * 0.55,
      radius,
      kind: 2,
      hp: normal ? KIND[2].hp : 100,
      maxHp: normal ? KIND[2].hp : 100,
      hitCd: TUNING.hitCooldown,
      flash: 0,
      orbitCd: 0.2,
      spin: enemy.spin,
      angle: enemy.angle + side,
      phase: enemy.phase + side,
      speed,
      generation: normal ? 0 : 2,
      immortal: false,
      ballistic: false,
      fuse: 0,
    })
  }
}

function shatterHex(state: GameState, enemy: Enemy): void {
  const span = enemy.radius
  const outset = span / Math.sqrt(3)
  const speed = 190
  const flight = 560 / speed
  for (let i = 0; i < 6; i++) {
    const bisector = -Math.PI / 2 + (i + 0.5) * (Math.PI / 3)
    state.enemies.push({
      x: enemy.x + Math.cos(bisector) * outset,
      y: enemy.y + Math.sin(bisector) * outset,
      vx: Math.cos(bisector) * speed,
      vy: Math.sin(bisector) * speed,
      radius: span * 0.46,
      kind: 3,
      hp: 1,
      maxHp: 1,
      hitCd: 0.12,
      flash: 0,
      orbitCd: flight,
      spin: 0,
      angle: bisector,
      phase: span,
      speed,
      generation: i,
      immortal: true,
      ballistic: true,
      fuse: 0,
    })
  }
}

function lateGame(state: GameState): boolean {
  return state.heat >= 6 || state.level >= 7
}

function bigHexSeason(state: GameState): boolean {
  return state.heat >= 9 || state.level >= 9
}

function spawn(state: GameState, input: Input, dt: number): void {
  state.spawnCd -= dt
  if (state.spawnCd > 0) return
  const late = lateGame(state)
  const pace = Math.max(0, state.time) * 0.012 + Math.max(0, state.level - 1) * 0.04
  const interval = Math.max(late ? 0.07 : 0.12, 0.62 - pace)
  state.spawnCd += interval
  const cap = Math.min(late ? 140 : 80, 34 + state.heat * 6 + state.level * 3)
  if (state.enemies.length >= cap) return
  const wave = (late ? 5 : 2) + Math.floor(state.heat / 3)
  for (let n = 0; n < wave && state.enemies.length < cap; n++) spawnOne(state, input.viewRadius)
}

function spawnOne(state: GameState, viewRadius: number): void {
  const roll = state.rng()
  let kind: EnemyKind = 0
  if (roll > 0.96) kind = 3
  else if (roll > 0.9) kind = 2
  else if (roll > 0.42) kind = 1
  const spec = KIND[kind]
  const ang = state.rng() * Math.PI * 2
  const late = lateGame(state)
  const dist = Math.max(late ? 120 : 200, viewRadius) + (late ? 16 : 70) + state.rng() * (late ? 90 : 160)
  const heatScale = 1 + state.heat * 0.012
  let hp: number = spec.hp
  let radius = spec.radius
  let speed = spec.speed * heatScale
  if (late && kind === 0 && state.rng() < 0.1) {
    hp = spec.hp * 3
    speed *= 1.85
    radius *= 2.05
  } else if (late && kind === 1 && state.rng() < 0.12) {
    hp = spec.hp * 6
    radius *= 2.2
  } else if (late && kind === 2 && state.rng() < 0.32) {
    hp = Math.round(spec.hp * 2.5)
    radius *= 2.6
  } else if (kind === 3 && bigHexSeason(state) && state.rng() < 0.4) {
    radius *= 1.95
  }
  state.enemies.push({
    x: state.playerX + Math.cos(ang) * dist,
    y: state.playerY + Math.sin(ang) * dist,
    vx: 0,
    vy: 0,
    radius,
    kind,
    hp,
    maxHp: hp,
    hitCd: 0,
    flash: 0,
    orbitCd: 0,
    spin: spec.spin * (state.rng() < 0.5 ? -1 : 1),
    angle: state.rng() * Math.PI * 2,
    phase: state.rng() * Math.PI * 2,
    speed,
    generation: 0,
    immortal: false,
    ballistic: false,
    fuse: 0,
  })
}

function moveEnemies(state: GameState, input: Input, dt: number): void {
  const limit = Math.max(980, input.viewRadius * 2.5)
  const limit2 = limit * limit
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j]
    e.hitCd = Math.max(0, e.hitCd - dt)
    e.flash = Math.max(0, e.flash - dt)
    e.orbitCd = Math.max(0, e.orbitCd - dt)
    if (e.fuse > 0) {
      e.fuse -= dt
      e.vx = 0
      e.vy = 0
      e.speed = 0
      e.flash = hexFuseLit(e.fuse) ? 0.2 : 0
      if (e.fuse <= 0) {
        shatterHex(state, e)
        burst(state, e.x, e.y, ENEMY_COLOR[3], 22, 360)
        state.enemies.splice(j, 1)
      }
      continue
    }
    if (e.ballistic && e.orbitCd <= 0) {
      burst(state, e.x, e.y, ENEMY_COLOR[e.kind], 6, 140)
      state.enemies.splice(j, 1)
      continue
    }
    const dx = state.playerX - e.x
    const dy = state.playerY - e.y
    const dist = Math.hypot(dx, dy) || 1
    if (dist * dist > limit2) {
      state.enemies.splice(j, 1)
      continue
    }
    if (!e.ballistic) {
      const inside = state.mods.field > 0 && dist < fieldRadius(state.mods.field) + e.radius
      const speed = e.speed * (inside ? fieldSlow(state.mods.field) : 1)
      const steer = 1 - Math.exp(-3.1 * dt)
      e.vx += ((dx / dist) * speed - e.vx) * steer
      e.vy += ((dy / dist) * speed - e.vy) * steer
    }
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
      if (!a || a.ballistic) continue
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]
        if (!b || b.ballistic) continue
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
        const nx = dx / dist
        const ny = dy / dist
        const holdA = a.fuse > 0
        const holdB = b.fuse > 0
        if (holdA && holdB) continue
        const push = (min - dist) * (holdA || holdB ? 1 : 0.5)
        if (!holdA) {
          a.x -= nx * push
          a.y -= ny * push
        }
        if (!holdB) {
          b.x += nx * push
          b.y += ny * push
        }
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
    if (e.ballistic || e.fuse > 0) continue
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
    if (e.ballistic && e.kind === 3) {
      const awayX = (state.playerX - e.x) / dist
      const awayY = (state.playerY - e.y) / dist
      const kick = 720
      state.playerVx += awayX * kick
      state.playerVy += awayY * kick
      burst(state, e.x, e.y, ENEMY_COLOR[3], 18, 340)
      state.shocks.push({ x: e.x, y: e.y, life: 0.28, max: 0.28, color: ENEMY_COLOR[3] })
      state.enemies.splice(j, 1)
    } else {
      burst(state, state.playerX, state.playerY, '#ff3df2', 12, 220)
    }
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

function orbValue(hp: number): number {
  return Math.max(1, Math.round(hp / 100))
}

function orbColor(value: number): string {
  if (value >= 12) return '#ff2d3a'
  if (value >= 8) return '#ff4d9a'
  if (value >= 5) return '#ff8a24'
  if (value >= 3) return '#ffe14a'
  if (value >= 2) return '#7dff9a'
  return '#eef3ff'
}

function dropOrb(state: GameState, enemy: Enemy): void {
  const value = orbValue(enemy.maxHp)
  const radius = 3.1 + Math.min(5.6, value * 0.7)
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
    color: orbColor(value),
    rare: value >= 5,
    homing: false,
    pulse: state.rng() * Math.PI * 2,
  })
}

function moveOrbs(state: GameState, input: Input, dt: number, events: StepEvents): void {
  const magnet = 72 + state.mods.magnet * 28
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
      const speed = 300 + state.mods.magnet * 55 + (1 - Math.min(1, dist / magnet)) * 130
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
    const gain = orbGain(orb.value, state.mods.greed)
    state.xp += gain
    events.pickups += 1
    state.orbs.splice(i, 1)
    burst(state, state.playerX, state.playerY, orb.color, orb.rare ? 8 : 4, 140)
  }
}

export function orbitDiscs(state: GameState): { x: number; y: number; spin: number; fade: number; halo: boolean; radius: number }[] {
  const count = orbiterCount(state.mods.orbiter)
  if (count === 0) return []
  const halo = state.mods.orbiter >= OVERDRIVE
  let fade = 1
  if (!halo) {
    const active = orbitActive(state.mods.orbiter)
    const period = active + DISC.recharge
    const t = state.orbitTime % period
    if (t >= active) return []
    fade = Math.min(1, t / 0.22, (active - t) / 0.5)
  }
  const turn = state.time * orbitRate(state.mods.orbiter)
  const orbit = discOrbit(state.mods.orbiter)
  const radius = discRadius(state.mods.orbiter)
  const discs = []
  for (let i = 0; i < count; i++) {
    const angle = turn + (i * Math.PI * 2) / count
    discs.push({
      x: state.playerX + Math.cos(-angle) * orbit,
      y: state.playerY + Math.sin(-angle) * orbit,
      spin: -angle * discTurn(state.mods.orbiter),
      fade,
      halo,
      radius,
    })
  }
  return discs
}

function shoveFromDisc(state: GameState, enemy: Enemy, x: number, y: number, shove: number): void {
  if (enemy.fuse > 0) return
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
  enemy.vx += nx * shove * 1.4
  enemy.vy += ny * shove * 1.4
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
    damageEnemy(state, enemy, events, dealt, fieldColor(rank), 'field')
  }
}

function launchBalls(state: GameState, dt: number): void {
  const rank = state.mods.ball
  if (rank <= 0) return
  state.ballCd -= dt
  if (state.ballCd > 0 || state.balls.length > 48) return
  const count = ballCount(rank)
  const speed = ballSpeed(rank)
  const quantum = rank >= OVERDRIVE
  const life = ballLife(rank)
  const damage = ballDamage(rank)
  for (let i = 0; i < count; i++) {
    const angle = state.rng() * Math.PI * 2
    state.balls.push({
      x: state.playerX,
      y: state.playerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      max: life,
      radius: 32 * BODY,
      damage,
      echo: false,
      quantum,
      knock: quantum ? 8 : 2.2,
      spin: state.rng() * Math.PI * 2,
      flex: 0,
      flexAngle: 0,
      touched: [],
    })
  }
  state.ballCd += ballInterval(rank)
}

function moveBalls(state: GameState, input: Input, dt: number, events: StepEvents): void {
  const halfW = Math.max(80, input.viewW) / 2
  const halfH = Math.max(80, input.viewH) / 2
  const left = state.playerX - halfW
  const right = state.playerX + halfW
  const top = state.playerY - halfH
  const bottom = state.playerY + halfH
  for (let i = state.balls.length - 1; i >= 0; i--) {
    const ball = state.balls[i]
    if (!ball) continue
    ball.life -= dt
    ball.flex = Math.max(0, ball.flex - dt * 2.6)
    if (ball.life <= 0) {
      state.balls.splice(i, 1)
      continue
    }
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt
    if (Math.hypot(ball.vx, ball.vy) > 30) ball.spin += dt * 2.4
    let nx = 0
    let ny = 0
    if (ball.x - ball.radius < left) {
      ball.x = left + ball.radius
      if (ball.vx < 0) {
        ball.vx = -ball.vx
        nx += 1
      }
    } else if (ball.x + ball.radius > right) {
      ball.x = right - ball.radius
      if (ball.vx > 0) {
        ball.vx = -ball.vx
        nx -= 1
      }
    }
    if (ball.y - ball.radius < top) {
      ball.y = top + ball.radius
      if (ball.vy < 0) {
        ball.vy = -ball.vy
        ny += 1
      }
    } else if (ball.y + ball.radius > bottom) {
      ball.y = bottom - ball.radius
      if (ball.vy > 0) {
        ball.vy = -ball.vy
        ny -= 1
      }
    }
    if (nx !== 0 || ny !== 0) {
      ball.flex = 1
      ball.flexAngle = Math.atan2(ny, nx)
    }
    for (let t = ball.touched.length - 1; t >= 0; t--) {
      const touch = ball.touched[t]
      if (!touch) continue
      touch.cd -= dt
      if (touch.cd <= 0) ball.touched.splice(t, 1)
    }
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j]
      if (!enemy) continue
      if (ball.touched.some((touch) => touch.enemy === enemy)) continue
      const dx = ball.x - enemy.x
      const dy = ball.y - enemy.y
      const reach = ball.radius + enemy.radius
      if (dx * dx + dy * dy > reach * reach) continue
      ball.touched.push({ enemy, cd: 0.15 })
      if (thickHull(enemy) && deflectOffEnemy(ball, enemy)) ball.flex = 1
      shoveFromBall(enemy, ball)
      damageEnemy(state, enemy, events, ball.damage, ball.quantum ? '#ff2d3a' : '#8dff4a', 'ball')
      enemy.hitCd = 0.14
      if (splitBall(state, ball)) {
        state.balls.splice(i, 1)
        break
      }
    }
  }
}

function splitBall(state: GameState, ball: Ricochet): boolean {
  if (!ball.quantum || ball.echo || state.balls.length > 24) return false
  const speed = Math.hypot(ball.vx, ball.vy) || ballSpeed(OVERDRIVE)
  const angle = Math.atan2(ball.vy, ball.vx)
  const echoSpeed = speed * 1.15
  for (const turn of [-35, 35]) {
    if (state.balls.length > 24) break
    const a = angle + (turn * Math.PI) / 180
    state.balls.push({
      x: ball.x,
      y: ball.y,
      vx: Math.cos(a) * echoSpeed,
      vy: Math.sin(a) * echoSpeed,
      life: ball.max,
      max: ball.max,
      radius: Math.max(12 * BODY, ball.radius * 0.55),
      damage: Math.max(1, Math.round(ball.damage * 0.45)),
      echo: true,
      quantum: true,
      knock: 2.4,
      spin: ball.spin,
      flex: 0,
      flexAngle: ball.flexAngle,
      touched: [],
    })
  }
  return true
}

function giantCircle(enemy: Enemy): boolean {
  return enemy.kind === 2 && !enemy.ballistic && enemy.radius > KIND[2].radius * 1.5
}

function thickHull(enemy: Enemy): boolean {
  if (enemy.ballistic) return false
  if (enemy.maxHp >= 1000) return true
  // A giant circle splits into two circles, and each of those splits again.
  return giantCircle(enemy) && enemy.maxHp + KIND[2].hp * 2 + 400 >= 1000
}

function deflectOffEnemy(ball: Ricochet, enemy: Enemy): boolean {
  const speed = Math.hypot(ball.vx, ball.vy)
  if (speed < 1) return false
  let dx = ball.x - enemy.x
  let dy = ball.y - enemy.y
  const dist = Math.hypot(dx, dy)
  let nx = dist > 0.01 ? dx / dist : -ball.vx / speed
  let ny = dist > 0.01 ? dy / dist : -ball.vy / speed
  if (ball.vx * nx + ball.vy * ny > 0) {
    nx = -ball.vx / speed
    ny = -ball.vy / speed
  }
  const reach = ball.radius + enemy.radius
  ball.x = enemy.x + nx * reach
  ball.y = enemy.y + ny * reach
  const toward = ball.vx * nx + ball.vy * ny
  if (toward < 0) {
    ball.vx -= 2 * toward * nx
    ball.vy -= 2 * toward * ny
  } else {
    ball.vx = nx * speed
    ball.vy = ny * speed
  }
  ball.flexAngle = Math.atan2(ny, nx)
  return true
}

function shoveFromBall(enemy: Enemy, ball: Ricochet): void {
  if (enemy.fuse > 0) return
  const speed = Math.hypot(ball.vx, ball.vy) || 1
  const nx = ball.vx / speed
  const ny = ball.vy / speed
  enemy.x += nx * ball.knock
  enemy.y += ny * ball.knock
  enemy.vx += nx * ball.knock * 1.6
  enemy.vy += ny * ball.knock * 1.6
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
      const reach = disc.radius + enemy.radius
      if (dx * dx + dy * dy > reach * reach) continue
      enemy.orbitCd = 0.42
      shoveFromDisc(state, enemy, disc.x, disc.y, orbiterShove(state.mods.orbiter))
      spawnImpact(state, disc.x, disc.y)
      damageEnemy(state, enemy, events, orbiterDamage(state.mods.orbiter), '#ffffff', 'orbiter')
    }
  }
}

function updateDrone(state: GameState, dt: number, events: StepEvents): void {
  const rank = state.mods.drone
  if (rank <= 0) return
  for (let i = state.mortars.length - 1; i >= 0; i--) {
    const shell = state.mortars[i]
    if (!shell) continue
    shell.age += dt
    if (shell.age < shell.flight) continue
    explodeShell(state, shell, events)
    state.mortars.splice(i, 1)
  }
  const storm = droneStorm(rank)
  if (state.droneBurst <= 0) {
    if (storm) hopStormArea(state, false)
    else if (!trackLiveAim(state)) state.reticleOn = false
  }
  if (state.droneReload > 0) {
    state.droneReload = Math.max(0, state.droneReload - dt)
    return
  }
  if (storm && !enemiesInDroneRange(state)) {
    state.reticleOn = false
    state.droneAreaHot = false
    return
  }
  if (state.droneBurst <= 0) {
    if (!state.reticleOn) return
    state.droneBurst = droneBurst(rank)
    state.droneCd = 0
    if (storm && !state.droneAreaHot) state.droneAreaCd = 1
  }
  const roundOpen = state.droneBurst < droneBurst(rank) - 1e-4 || state.droneCd > 0
  if (storm) {
    if (!state.reticleOn) {
      hopStormArea(state, false)
      if (!state.reticleOn) return
    }
    if (state.droneAreaHot) {
      state.droneAreaCd -= dt
      const left = Math.hypot(state.droneX - state.droneMarkX, state.droneY - state.droneMarkY)
      if (state.droneAreaCd <= 0 || left > 220 || !stormAreaLive(state)) {
        hopStormArea(state, true)
      }
    }
  } else if (!roundOpen && !droneAimed(state)) return
  state.droneBurst = Math.max(0, state.droneBurst - dt)
  state.droneCd -= dt
  if (state.droneCd <= 0 && state.mortars.length < 72) {
    const anchor = droneAnchor(state)
    const tips = droneBlasterTips()
    const count = droneVolley(rank)
    const span = Math.min(2.15, 0.92 + Math.max(0, count - 2) * 0.3)
    const gap = count <= 1 ? 0 : span / (count - 1)
    for (let i = 0; i < count && state.mortars.length < 72; i++) {
      const barrel = state.droneBarrel % tips.length
      const tip = tips[barrel] ?? { x: 0, y: 0 }
      state.droneBarrel += 1
      const c = Math.cos(state.droneFace)
      const s = Math.sin(state.droneFace)
      const sx = anchor.x + tip.x * c - tip.y * s
      const sy = anchor.y + tip.x * s + tip.y * c
      const barrelLen = Math.hypot(tip.x, tip.y) || 1
      const bx0 = (tip.x * c - tip.y * s) / barrelLen
      const by0 = (tip.x * s + tip.y * c) / barrelLen
      const offset = (i - (count - 1) / 2) * gap + (unit(state) - 0.5) * 0.16
      const turn = Math.cos(offset)
      const sway = Math.sin(offset)
      const bx = bx0 * turn - by0 * sway
      const by = bx0 * sway + by0 * turn
      const spot = randomMark(state, sx, sy)
      launchShell(
        state,
        sx,
        sy,
        spot.x,
        spot.y,
        rank,
        droneStorm(rank),
        blasterArcSign(state.droneFace, tip.y, spot.x - sx, spot.y - sy),
        spot.fromCenter,
        bx,
        by,
      )
    }
    state.droneCd = droneInterval(rank)
    if (storm && !state.droneAreaHot) {
      state.droneAreaHot = true
      state.droneMarkX = state.droneX
      state.droneMarkY = state.droneY
      state.droneAreaCd = 1
    }
  }
  if (state.droneBurst <= 0) state.droneReload = droneReload(rank)
}

function hopStormArea(state: GameState, force: boolean): void {
  if (!force && state.reticleOn) return
  state.droneAreaHot = false
  const areas = droneAreas(state)
  const live = nextStormArea(state, areas, force)
  if (!live) {
    state.reticleOn = false
    state.droneAreaCd = 0.35
    return
  }
  const spot = stormSpot(state, live, force)
  state.reticleX = spot.x
  state.reticleY = spot.y
  state.reticleVx = live.vx
  state.reticleVy = live.vy
  state.reticleOn = true
  state.droneAreaCd = 1
}

function stormShift(state: GameState): number {
  return Math.max(180, aimSpread(state) * 1.25)
}

function nextStormArea(
  state: GameState,
  areas: { x: number; y: number; vx: number; vy: number }[],
  force: boolean,
): { x: number; y: number; vx: number; vy: number } | null {
  const first = areas[0]
  if (!first) return null
  if (!force || !state.reticleOn) return first
  const minShift = stormShift(state)
  const elsewhere = areas.find((area) => Math.hypot(area.x - state.reticleX, area.y - state.reticleY) > minShift)
  if (elsewhere) return elsewhere
  return first
}

function stormSpot(
  state: GameState,
  live: { x: number; y: number; vx: number; vy: number },
  force: boolean,
): { x: number; y: number } {
  const spot = leadPoint(state, live)
  if (!force || !state.reticleOn) return spot
  const minShift = stormShift(state)
  if (Math.hypot(spot.x - state.reticleX, spot.y - state.reticleY) >= minShift) return spot
  let ang = Math.atan2(state.reticleY - live.y, state.reticleX - live.x) + 2.2
  for (let n = 0; n < 6; n++) {
    const x = state.reticleX + Math.cos(ang) * minShift
    const y = state.reticleY + Math.sin(ang) * minShift
    if (Math.hypot(x - state.playerX, y - state.playerY) >= 72) return { x, y }
    ang += 1.05
  }
  return { x: state.reticleX + minShift, y: state.reticleY }
}

function enemiesInDroneRange(state: GameState): boolean {
  const anchor = droneAnchor(state)
  const reach = 360
  for (const enemy of state.enemies) {
    const dx = enemy.x - anchor.x
    const dy = enemy.y - anchor.y
    if (dx * dx + dy * dy <= reach * reach) return true
  }
  return false
}

function stormAreaLive(state: GameState): boolean {
  const reach = aimSpread(state) + 90
  for (const enemy of state.enemies) {
    const dx = enemy.x - state.reticleX
    const dy = enemy.y - state.reticleY
    if (dx * dx + dy * dy <= reach * reach) return true
  }
  return false
}

function trackLiveAim(state: GameState): boolean {
  const live = richestDroneArea(state)
  if (!live) return false
  const spot = leadPoint(state, live)
  state.reticleX = spot.x
  state.reticleY = spot.y
  state.reticleVx = live.vx
  state.reticleVy = live.vy
  state.reticleOn = true
  return true
}

function leadPoint(state: GameState, live: { x: number; y: number; vx: number; vy: number }): { x: number; y: number } {
  const anchor = droneAnchor(state)
  const dist = Math.hypot(live.x - anchor.x, live.y - anchor.y)
  const flight = Math.min(0.85, 0.34 + dist / 700)
  return holdOffPlayer(state, live.x + live.vx * flight, live.y + live.vy * flight, live.x, live.y)
}

function holdOffPlayer(state: GameState, x: number, y: number, fromX: number, fromY: number): { x: number; y: number } {
  const px = x - state.playerX
  const py = y - state.playerY
  const pd = Math.hypot(px, py)
  if (pd >= 72) return { x, y }
  const ox = fromX - state.playerX
  const oy = fromY - state.playerY
  const od = Math.hypot(ox, oy) || 1
  return { x: state.playerX + (ox / od) * 72, y: state.playerY + (oy / od) * 72 }
}

function richestDroneArea(state: GameState): { x: number; y: number; vx: number; vy: number } | null {
  return droneAreas(state)[0] ?? null
}

function droneAreas(state: GameState): { x: number; y: number; vx: number; vy: number; score: number }[] {
  const anchor = droneAnchor(state)
  const reach = 360
  const zone = 96
  const found: { x: number; y: number; vx: number; vy: number; score: number }[] = []
  for (const enemy of state.enemies) {
    const pdx = enemy.x - anchor.x
    const pdy = enemy.y - anchor.y
    if (pdx * pdx + pdy * pdy > reach * reach) continue
    let total = 0
    let sx = 0
    let sy = 0
    let svx = 0
    let svy = 0
    let count = 0
    for (const other of state.enemies) {
      const dx = other.x - enemy.x
      const dy = other.y - enemy.y
      if (dx * dx + dy * dy > zone * zone) continue
      total += Math.max(0, other.hp)
      sx += other.x
      sy += other.y
      svx += other.vx
      svy += other.vy
      count += 1
    }
    if (count === 0) continue
    const x = sx / count
    const y = sy / count
    const dup = found.find((area) => {
      const dx = area.x - x
      const dy = area.y - y
      return dx * dx + dy * dy < zone * zone
    })
    if (dup) {
      if (total > dup.score) {
        dup.x = x
        dup.y = y
        dup.vx = svx / count
        dup.vy = svy / count
        dup.score = total
      }
      continue
    }
    found.push({ x, y, vx: svx / count, vy: svy / count, score: total })
  }
  found.sort((a, b) => b.score - a.score)
  return found
}

function launchShell(
  state: GameState,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  rank: number,
  storm: boolean,
  arcSign: number,
  fromCenter: number,
  bx: number,
  by: number,
): void {
  const dx = tx - sx
  const dy = ty - sy
  const dist = Math.hypot(dx, dy) || 1
  const maxRange = 360
  const scale = dist > maxRange ? maxRange / dist : 1
  const landX = sx + dx * scale
  const landY = sy + dy * scale
  const travel = dist * scale
  state.mortars.push({
    sx,
    sy,
    tx: landX,
    ty: landY,
    age: 0,
    flight: Math.min(1.05, 0.34 + travel / 700),
    arc: shellArc(state, travel, arcSign, fromCenter),
    radius: droneBlast(rank),
    damage: droneDamage(rank),
    storm,
    bx,
    by,
    dvx: state.droneVx,
    dvy: state.droneVy,
  })
}

function aimSpread(state: GameState): number {
  const dist = Math.hypot(state.reticleX - state.playerX, state.reticleY - state.playerY)
  return Math.min(168, Math.max(58, dist * 0.46))
}

function randomMark(state: GameState, sx: number, sy: number): { x: number; y: number; fromCenter: number } {
  const outer = aimSpread(state)
  const maxRange = 352
  const angle = unit(state) * Math.PI * 2
  let fromCenter = Math.sqrt(unit(state)) * outer
  for (let n = 0; n < 6; n++) {
    const x = state.reticleX + Math.cos(angle) * fromCenter
    const y = state.reticleY + Math.sin(angle) * fromCenter
    if (Math.hypot(x - sx, y - sy) <= maxRange) return { x, y, fromCenter }
    fromCenter *= 0.72
  }
  const x = state.reticleX + Math.cos(angle) * fromCenter
  const y = state.reticleY + Math.sin(angle) * fromCenter
  const dx = x - sx
  const dy = y - sy
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(dist, maxRange)
  const landX = sx + (dx / dist) * reach
  const landY = sy + (dy / dist) * reach
  return { x: landX, y: landY, fromCenter: Math.hypot(landX - state.reticleX, landY - state.reticleY) }
}

function unit(state: GameState): number {
  let x = Math.floor(state.rng() * 4294967296)
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

function blasterArcSign(face: number, side: number, shotX: number, shotY: number): number {
  let px = -shotY
  let py = shotX
  if (py > 0 || (py === 0 && px < 0)) {
    px = -px
    py = -py
  }
  const outwardX = -Math.sin(face) * Math.sign(side || 1)
  const outwardY = Math.cos(face) * Math.sign(side || 1)
  return px * outwardX + py * outwardY >= 0 ? 1 : -1
}

function shellArc(state: GameState, travel: number, sign: number, fromCenter: number): number {
  const ring = Math.min(1, fromCenter / aimSpread(state))
  const reach = Math.min(1, travel / 260)
  const base = (26 + reach * 10 + ring * ring * 6) * 1.4
  const vary = 0.8 + state.rng() * 0.4
  return sign * base * vary
}

export function shellPose(shell: Mortar, p: number): { x: number; y: number; vx: number; vy: number; heading: number } {
  const t = Math.min(1, Math.max(0, p))
  const u = 1 - t
  const dx = shell.tx - shell.sx
  const dy = shell.ty - shell.sy
  const dist = Math.hypot(dx, dy) || 1
  const launch = Math.min(46, dist * 0.2)
  const p1x = shell.sx + shell.bx * launch + shell.dvx * shell.flight / 3
  const p1y = shell.sy + shell.by * launch + shell.dvy * shell.flight / 3
  const perp = arcPerp(dx, dy)
  const pull = Math.min(dist * 0.32, 64)
  const p2x = shell.tx - (dx / dist) * pull + perp.x * shell.arc
  const p2y = shell.ty - (dy / dist) * pull + perp.y * shell.arc
  const x = u * u * u * shell.sx + 3 * u * u * t * p1x + 3 * u * t * t * p2x + t * t * t * shell.tx
  const y = u * u * u * shell.sy + 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t * shell.ty
  const tx = 3 * u * u * (p1x - shell.sx) + 6 * u * t * (p2x - p1x) + 3 * t * t * (shell.tx - p2x)
  const ty = 3 * u * u * (p1y - shell.sy) + 6 * u * t * (p2y - p1y) + 3 * t * t * (shell.ty - p2y)
  const fade = u * u
  const hvx = tx - shell.dvx * shell.flight * fade
  const hvy = ty - shell.dvy * shell.flight * fade
  return { x, y, vx: hvx, vy: hvy, heading: Math.atan2(hvy, hvx) }
}

function arcPerp(dx: number, dy: number): { x: number; y: number } {
  let px = -dy
  let py = dx
  if (py > 0 || (py === 0 && px < 0)) {
    px = -px
    py = -py
  }
  const len = Math.hypot(px, py) || 1
  return { x: px / len, y: py / len }
}

function explodeShell(state: GameState, shell: Mortar, events: StepEvents): void {
  const color = shell.storm ? '#ff2d3a' : '#ffffff'
  state.shocks.push({ x: shell.tx, y: shell.ty, life: 0.38, max: 0.38, color, square: true })
  burst(state, shell.tx, shell.ty, color, shell.storm ? 4 : 9, 170)
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const enemy = state.enemies[j]
    if (!enemy) continue
    const dx = enemy.x - shell.tx
    const dy = enemy.y - shell.ty
    const reach = shell.radius + enemy.radius
    if (dx * dx + dy * dy > reach * reach) continue
    damageEnemy(state, enemy, events, shell.damage, color, 'drone')
  }
}

function updateTesla(state: GameState, dt: number, events: StepEvents, viewH: number): void {
  const rank = state.mods.tesla
  if (rank <= 0) return
  state.teslaCd -= dt
  if (state.teslaCd > 0) return
  const reactor = arcReactor(rank)
  const targets = teslaTargets(state, teslaBolts(rank, reactor))
  if (targets.length === 0) {
    state.teslaCd = 0.2
    return
  }
  state.teslaCd = teslaInterval(rank, reactor)
  const sky = state.playerY - Math.max(80, viewH) / 2
  for (const enemy of targets) callBolt(state, enemy, events, reactor, sky)
}

function teslaTargets(state: GameState, count: number): Enemy[] {
  const pool = state.enemies.filter((enemy) => !enemy.immortal && !enemy.ballistic)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(state.rng() * (i + 1))
    const swap = pool[i]
    const other = pool[j]
    if (swap && other) {
      pool[i] = other
      pool[j] = swap
    }
  }
  return pool.slice(0, count)
}

function callBolt(state: GameState, enemy: Enemy, events: StepEvents, reactor: boolean, skyY: number): void {
  const dealt = teslaDamage(state.mods.tesla, reactor)
  const ink = reactor ? '#ff2d3a' : '#ffffff'
  const paths = [plasmaPillar(state, skyY, enemy)]
  const tendrils = impactTendrils(state, enemy.x, enemy.y)
  const taken = new Set<Enemy>([enemy])
  damageEnemy(state, enemy, events, dealt, ink, 'tesla')
  shockArc(state, enemy.x, enemy.y, reactor)
  if (reactor) {
    let from = enemy
    let hopDamage = Math.round(dealt * 0.62)
    for (let hop = 0; hop < 3 && hopDamage > 0; hop++) {
      const next = nearestArc(state, from, taken, 210)
      if (!next) break
      taken.add(next)
      paths.push(plasmaArc(state, from, next))
      tendrils.push(...impactTendrils(state, next.x, next.y))
      damageEnemy(state, next, events, hopDamage, ink, 'tesla')
      shockArc(state, next.x, next.y, true)
      from = next
      hopDamage = Math.round(hopDamage * 0.62)
    }
  }
  if (state.bolts.length > 28) state.bolts.shift()
  state.bolts.push({ life: 0.28, max: 0.28, reactor, paths, tendrils, x: enemy.x, y: enemy.y })
}

function nearestArc(state: GameState, from: Enemy, taken: Set<Enemy>, range: number): Enemy | null {
  let best: Enemy | null = null
  let bestD = range
  for (const enemy of state.enemies) {
    if (taken.has(enemy) || enemy.immortal || enemy.ballistic) continue
    const dist = Math.hypot(enemy.x - from.x, enemy.y - from.y)
    if (dist < bestD) {
      best = enemy
      bestD = dist
    }
  }
  return best
}

function shockArc(state: GameState, x: number, y: number, reactor: boolean): void {
  const color = reactor ? '#ff2d3a' : '#ffffff'
  state.shocks.push({ x, y, life: 0.28, max: 0.28, color })
  burst(state, x, y, color, reactor ? 14 : 10, reactor ? 280 : 220)
}

function plasmaPillar(state: GameState, skyY: number, enemy: Enemy): { x: number; y: number }[] {
  const from = { x: enemy.x + (state.rng() - 0.5) * 28, y: skyY - 6 }
  const to = { x: enemy.x, y: enemy.y }
  const bow = (state.rng() - 0.5) * 110
  const wobble = (state.rng() - 0.5) * 26
  const phase = state.rng() * Math.PI * 2
  return smoothBend(from, to, 16, (t) => Math.sin(t * Math.PI) * bow + Math.sin(t * Math.PI * 2 + phase) * wobble * Math.sin(t * Math.PI))
}

function plasmaArc(state: GameState, from: Enemy, to: Enemy): { x: number; y: number }[] {
  const bow = (state.rng() - 0.5) * 36
  return smoothBend(from, to, 8, (t) => Math.sin(t * Math.PI) * bow)
}

function impactTendrils(state: GameState, x: number, y: number): { x: number; y: number }[][] {
  const rays: { x: number; y: number }[][] = []
  const count = 6 + Math.floor(state.rng() * 3)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + state.rng() * 0.4
    const reach = 22 + state.rng() * 56
    const kink = 0.45 + state.rng() * 0.25
    const bend = (state.rng() - 0.5) * 0.9
    const mid = {
      x: x + Math.cos(angle + bend) * reach * kink,
      y: y + Math.sin(angle + bend) * reach * kink,
    }
    const end = {
      x: x + Math.cos(angle) * reach,
      y: y + Math.sin(angle) * reach,
    }
    rays.push([
      { x, y },
      mid,
      end,
    ])
  }
  return rays
}

function smoothBend(
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps: number,
  sway: (t: number) => number,
): { x: number; y: number }[] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push({
      x: from.x + dx * t + nx * sway(t),
      y: from.y + dy * t + ny * sway(t),
    })
  }
  return points
}

function openLevel(state: GameState): boolean {
  if (state.phase !== 'play' || state.xp < state.xpNeed) return false
  state.xp -= state.xpNeed
  state.level += 1
  state.xpNeed = xpNeedFor(state.level)
  state.hull = Math.min(state.hullMax, state.hull + levelMend(state.mods.regen))
  state.phase = 'level'
  return true
}

function rollOffers(state: GameState): Offer[] {
  const pool = (Object.keys(UPGRADE_MAX) as Exclude<UpgradeId, 'cache'>[]).filter(
    (id) => state.mods[id] < UPGRADE_MAX[id],
  )
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(state.rng() * (i + 1))
    const swap = pool[i]
    const other = pool[j]
    if (swap && other) {
      pool[i] = other
      pool[j] = swap
    }
  }
  const picked: UpgradeId[] = pool.slice(0, 3)
  if (state.mods.tesla < UPGRADE_MAX.tesla && !picked.includes('tesla')) {
    if (picked.length < 3) picked.push('tesla')
    else picked[picked.length - 1] = 'tesla'
  }
  while (picked.length < 3) picked.push('cache')
  return picked.map((id) => describeOffer(state, id))
}

function describeOffer(state: GameState, id: UpgradeId): Offer {
  if (id === 'cache') {
    return { id, title: 'Cache', detail: 'Bank 40 score.', rank: 1, max: 1, overdrive: false }
  }
  const rank = state.mods[id] + 1
  const max = UPGRADE_MAX[id]
  const overdrive = rank >= OVERDRIVE && (id === 'orbiter' || id === 'field' || id === 'ball')
  if (id === 'tesla' && arcReactor(rank)) {
    return {
      id,
      title: 'Arc Reactor',
      detail: 'Supercharged bolts fall faster and chain-arc through nearby hostiles.',
      rank,
      max,
      overdrive: true,
    }
  }
  if (id === 'drone' && droneStorm(rank)) {
    return {
      id,
      title: 'Bulletstorm',
      detail: 'The drone turns red. Each volley is a wide fan of rockets, and the wait between them is short.',
      rank,
      max,
      overdrive: true,
    }
  }
  if (id === 'orbiter' && overdrive) {
    return {
      id,
      title: "Guardian's Halo",
      detail: 'Six red discs stay out. They spin faster and throw hostiles back harder.',
      rank,
      max,
      overdrive: true,
    }
  }
  if (id === 'ball' && overdrive) {
    return {
      id,
      title: 'Quantum Core',
      detail: 'Hyper-fast red balls. They bounce off giant circles and hostiles with 1000 hull or more, and a hit replaces each one with two smaller balls.',
      rank,
      max,
      overdrive: true,
    }
  }
  if (id === 'field' && overdrive) {
    return {
      id,
      title: 'Null Zone',
      detail: 'The field turns red, reaches farther, burns harder, and slows more.',
      rank,
      max,
      overdrive: true,
    }
  }
  const copy: Record<Exclude<UpgradeId, 'cache'>, { title: string; detail: string }> = {
    pulse: { title: 'Pulse', detail: 'Shots leave the core sooner.' },
    caliber: { title: 'Caliber', detail: 'Each round hits a little harder.' },
    drift: { title: 'Drift', detail: 'Top speed climbs.' },
    magnet: { title: 'Magnet', detail: 'Nearby orbs move a little faster. Each rank reaches a little farther.' },
    fork: { title: 'Fork', detail: 'Two streams sit on the reticle. The next rank adds a third, still tight on the aim.' },
    greed: { title: 'Greed', detail: 'Every orb pays a bonus, and bigger orbs pay a little more.' },
    regen: { title: 'Regeneration', detail: 'Each level restores one health. Ranks restore more.' },
    orbiter: { title: 'Sentinel', detail: 'Two discs orbit the core, then fade out and recharge. They nudge what they hit.' },
    field: { title: 'Force Field', detail: 'A white field burns and slows anything inside.' },
    ball: { title: 'Bouncy Ball', detail: 'A glowing ball ricochets inside the screen. It bounces off giant circles and any hostile whose hull is 1000 or more, no matter how much health is left.' },
    drone: { title: 'Drone', detail: 'A drone fires a fan of rockets at once. Each one plants a reticle where it will land.' },
    tesla: { title: 'Tesla Coil', detail: 'Lightning falls on random hostiles. Each rank adds bolts, damage, and strike speed.' },
  }
  const detail =
    id === 'orbiter' && rank > 1
      ? 'One more disc. They last longer, hit harder, spin faster, and nudge harder.'
      : id === 'field' && rank > 1
        ? 'The field widens, burns harder, slows more, and pulses faster.'
        : id === 'ball' && rank > 1
          ? 'More balls. They hit harder and stay out longer.'
            : id === 'drone' && rank > 1
              ? 'More rockets in each fan, a wider blast, and a shorter wait between volleys.'
              : id === 'tesla' && rank > 1 && rank < TESLA.evolveRank
                ? 'More bolts strike at once. They hit harder and fall sooner.'
                : id === 'regen' && rank > 1
              ? 'Each level restores more health.'
              : copy[id].detail
  return { id, title: copy[id].title, detail, rank, max, overdrive: false }
}

function applyUpgrade(state: GameState, id: UpgradeId): void {
  if (id === 'cache') {
    state.score += 40
    if (state.score > state.best) state.best = state.score
    return
  }
  state.mods[id] += 1
  const mark = upgradeSource(id, state.mods[id])
  if (mark) state.upgradeMarks.push({ t: state.time, source: mark.source, name: mark.name, rank: state.mods[id] })
  if (id === 'orbiter' && state.mods.orbiter === 1) state.orbitTime = 0.35
  if (id === 'field') state.fieldTick = Math.floor(state.time / FIELD.tick)
  if (id === 'ball') state.ballCd = 0.2
  if (id === 'drone' && state.mods.drone === 1) state.droneReload = 0.25
  if (id === 'tesla' && state.mods.tesla === 1) state.teslaCd = 0.2
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
  for (let i = state.bolts.length - 1; i >= 0; i--) {
    const bolt = state.bolts[i]
    if (!bolt) continue
    bolt.life -= dt
    if (bolt.life <= 0) state.bolts.splice(i, 1)
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
