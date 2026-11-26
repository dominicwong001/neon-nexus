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
  invuln: 0.58,
  hitCooldown: 0.05,
  mercy: 2,
} as const

export const HIT = 100

export const ENEMY_COLOR = ['#ff3df2', '#ffd23a', '#8dff6a', '#ff2d3a'] as const

export type EnemyKind = 0 | 1 | 2 | 3
export type Phase = 'play' | 'dead' | 'level'
export type UpgradeId = 'pulse' | 'caliber' | 'drift' | 'magnet' | 'fork' | 'greed' | 'regen' | 'orbiter' | 'field' | 'ball' | 'drone' | 'tesla' | 'hole' | 'cache'
export type DamageSource = 'stream' | 'orbiter' | 'field' | 'ball' | 'drone' | 'tesla' | 'hole'

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
  /** Pentagon turret: locked in place and firing. */
  parked: boolean
  /** Charge-up remaining before a volley (0 = idle). */
  windup: number
  /** Cooldown until the next charge starts. */
  shotCd: number
  /** Giant Pentagon alternates double-fan vs radial. */
  salvo: number
  /** Delay before a staggered follow-up fan. */
  pendingCd: number
  /** Shots in the pending staggered fan (0 = none). */
  pendingFan: number
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
  /** Broken enemy chip — visual only, no collision. */
  shard?: boolean
  ang?: number
  spin?: number
}

export interface Shock {
  x: number
  y: number
  life: number
  max: number
  color: string
  square?: boolean
  /** Expanding ring radius (shockwave). Defaults to a small burst. */
  span?: number
  width?: number
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
  hole: number
}

export interface Hole {
  x: number
  y: number
  life: number
  max: number
  radius: number
  pull: number
  damage: number
  tickCd: number
  absorbed: number
  crimson: boolean
  closing: number
  closeMax: number
  blast: number
  blastMax: number
  blastRadius: number
}

export interface Jagged {
  pts: { x: number; y: number }[]
  half: number[]
}

export interface Shard {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  size: number
}

export interface Burst {
  jag: Jagged
  vx: number
  vy: number
}

export interface Bolt {
  life: number
  max: number
  reactor: boolean
  strike: Jagged
  arcs: Jagged[]
  splinters: Jagged[]
  bursts: Burst[]
  shards: Shard[]
  x: number
  y: number
}

export const BOLT_SKY_PAD = 250

export function placeStrikeTop(
  pts: { x: number; y: number }[],
  cameraTop: number,
): { x: number; y: number }[] {
  const top = pts[0]
  const bottom = pts[pts.length - 1]
  if (!top || !bottom) return pts
  const origin = cameraTop - BOLT_SKY_PAD
  const span = bottom.y - top.y
  if (Math.abs(span) < 1) {
    return pts.map((point, index) => (index === 0 ? { x: point.x, y: origin } : { x: point.x, y: point.y }))
  }
  const scale = (bottom.y - origin) / span
  return pts.map((point) => ({
    x: point.x,
    y: origin + (point.y - top.y) * scale,
  }))
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
  hole: number
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
  droneAimX: number
  droneAimY: number
  teslaCd: number
  holeCd: number
  mods: Mods
  dealt: Record<DamageSource, number>
  damageBins: DamageBin[]
  upgradeMarks: UpgradeMark[]
  offers: Offer[]
  bullets: Bullet[]
  balls: Ricochet[]
  mortars: Mortar[]
  bolts: Bolt[]
  holes: Hole[]
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
  hole: 5,
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

export const HOLE = {
  evolveRank: 5,
  tick: 0.2,
  spawn: 0.32,
  close: 0.45,
  /** Singularity winds down fully, then detonates. */
  closeCrimson: 1.15,
} as const

export function singularity(rank: number): boolean {
  return rank >= HOLE.evolveRank
}

export function holeCloseTime(crimson: boolean): number {
  return crimson ? HOLE.closeCrimson : HOLE.close
}

export function holeRadius(rank: number): number {
  if (rank <= 0) return 0
  // Larger base well; each rank adds a modest radius bump (no Singularity extra).
  return (210 + Math.max(0, rank - 1) * 48) * BODY
}

export function holeDuration(rank: number): number {
  if (rank <= 0) return 0
  const life = 2 + Math.max(0, rank - 1) * 0.4
  return singularity(rank) ? life + 0.55 : life
}

export function holeDamage(rank: number): number {
  if (rank <= 0) return 0
  // Light tick while sucking — Singularity banks most damage in the collapse blast.
  const dealt = 3 + Math.max(0, rank - 1) * 1
  return singularity(rank) ? dealt + 1 : dealt
}

export function holePull(rank: number): number {
  if (rank <= 0) return 0
  const force = 320 + Math.max(0, rank - 1) * 95
  return singularity(rank) ? force * 1.35 : force
}

export function holeInterval(rank: number): number {
  if (rank <= 0) return 0
  // Higher ranks hit harder and wider — spawn less often to keep pressure fair.
  const wait = 5.8 + Math.max(0, rank - 1) * 0.75
  return singularity(rank) ? wait + 0.8 : wait
}

export function holeBlastRadius(absorbed: number): number {
  return Math.min(380 * BODY, (120 + absorbed * 0.1) * BODY)
}

export function holeBlastDamage(absorbed: number): number {
  return Math.min(300, 18 + Math.round(absorbed * 0.2))
}

export function teslaBolts(rank: number, _reactor: boolean): number {
  if (rank <= 0) return 0
  return 1
}

export function teslaDamage(rank: number, reactor: boolean): number {
  if (rank <= 0) return 0
  const dealt = 140 + Math.max(0, rank - 1) * 40
  return reactor ? Math.round(dealt * 1.3) : dealt
}

export function teslaInterval(rank: number, reactor: boolean): number {
  if (rank <= 0) return 0
  const wait = Math.max(0.95, 1.9 - Math.max(0, rank - 1) * 0.16)
  return reactor ? Math.max(0.62, wait * 0.7) : wait
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
  faceDrone(state)
}

function faceDrone(state: GameState): void {
  const want = state.reticleOn
    ? Math.atan2(state.reticleY - state.droneY, state.reticleX - state.droneX)
    : state.aim
  state.droneFace = want
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
  if (rank <= 0) return 1
  return 1 + Math.ceil(rank / 2)
}

export function orbGain(value: number, rank: number): number {
  return Math.max(1, Math.round(value * (1 + Math.max(0, rank) * 0.12)) + Math.max(0, rank))
}

function freshMods(): Mods {
  return { pulse: 0, caliber: 0, drift: 0, magnet: 0, fork: 0, greed: 0, regen: 0, orbiter: 0, field: 0, ball: 0, drone: 0, tesla: 0, hole: 0 }
}

/** Pentagon / Giant Pentagon stand-off bands (px). */
export const PENT = {
  stopMin: 370,
  stopMax: 450,
  resume: 490,
  charge: 0.75,
  reload: 1.4,
  shotSpeed: 300,
  shotLife: 2.4,
  shotRadius: 7 * BODY,
  fanSpread: 0.38,
} as const

export const GIANT_PENT = {
  stopMin: 410,
  stopMax: 490,
  resume: 530,
  charge: 0.85,
  reload: 1.65,
  shotSpeed: 340,
  fanSpread: 0.52,
  stagger: 0.16,
} as const

export function giantPentagon(enemy: Enemy): boolean {
  return enemy.kind === 1 && !enemy.ballistic && enemy.maxHp >= 1000
}

export function isPentagon(enemy: Enemy): boolean {
  return enemy.kind === 1 && !enemy.ballistic
}

export function pentChargeMax(enemy: Enemy): number {
  return giantPentagon(enemy) ? GIANT_PENT.charge : PENT.charge
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
    droneAimX: 0,
    droneAimY: 0,
    teslaCd: 0.45,
    holeCd: 0.8,
    mods: freshMods(),
    dealt: { stream: 0, orbiter: 0, field: 0, ball: 0, drone: 0, tesla: 0, hole: 0 },
    damageBins: [],
    upgradeMarks: [],
    offers: [],
    bullets: [],
    balls: [],
    mortars: [],
    bolts: [],
    holes: [],
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
  faceDrone(state)
  updateTesla(state, dt, events, input.viewW, input.viewH)
  updateHoles(state, dt, events, input.viewW, input.viewH)
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
  if (state.mods.hole > 0 || state.dealt.hole > 0) {
    rows.push({ name: singularity(state.mods.hole) ? 'Singularity' : 'Black Hole', amount: state.dealt.hole })
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
  if (source === 'hole') return singularity(rank) ? 'Singularity' : 'Black Hole'
  return droneStorm(rank) ? 'Bulletstorm' : 'Drone'
}

function noteDamage(state: GameState, source: DamageSource, amount: number): void {
  if (amount <= 0) return
  const slot = Math.floor(state.time / 0.5) * 0.5
  let bin = state.damageBins[state.damageBins.length - 1]
  if (!bin || bin.t !== slot) {
    bin = { t: slot, stream: 0, orbiter: 0, field: 0, ball: 0, drone: 0, tesla: 0, hole: 0 }
    state.damageBins.push(bin)
  }
  bin[source] += amount
}

function upgradeSource(id: UpgradeId, rank: number): { source: DamageSource; name: string } | null {
  if (id === 'pulse') return { source: 'stream', name: 'Pulse' }
  if (id === 'caliber') return { source: 'stream', name: 'Caliber' }
  if (id === 'fork') return { source: 'stream', name: 'Fork' }
  if (id === 'orbiter' || id === 'field' || id === 'ball' || id === 'drone' || id === 'tesla' || id === 'hole') {
    return { source: id, name: sourceLabel(id, rank) }
  }
  return null
}

export function orbiterDamage(rank: number): number {
  if (rank >= OVERDRIVE) return 90
  return 46 + Math.max(0, rank - 1) * 11
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
  const step = Math.min(Math.max(rank, 1), OVERDRIVE)
  return 1.4 + Math.max(0, step - 1) * 0.55
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

export function discRadius(_rank: number): number {
  // Sentinel matches Halo disc size.
  return DISC.radius * 1.42
}

export function discOrbit(_rank: number): number {
  // Sentinel matches Halo orbit distance.
  return DISC.orbit * 1.38
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
    // Invulnerable husks / flying hex shards take no damage — no hit flash.
    enemy.hitCd = TUNING.hitCooldown
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
  burst(state, enemy.x, enemy.y, ENEMY_COLOR[enemy.kind], 10, 240)
  shatterEnemyDebris(state, enemy)
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
  const beat = elapsed * (3.4 + elapsed * 7.2)
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
      parked: false,
      windup: 0,
      shotCd: 0,
      salvo: 0,
      pendingCd: 0,
      pendingFan: 0,
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
      parked: false,
      windup: 0,
      shotCd: 0,
      salvo: 0,
      pendingCd: 0,
      pendingFan: 0,
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
    // Giant Pentagon elite — 1000+ hull turret.
    hp = Math.max(1000, spec.hp * 6)
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
    spin: kind === 1 ? 0 : spec.spin * (state.rng() < 0.5 ? -1 : 1),
    angle: state.rng() * Math.PI * 2,
    phase: state.rng() * Math.PI * 2,
    speed,
    generation: 0,
    immortal: false,
    ballistic: false,
    fuse: 0,
    parked: false,
    windup: 0,
    shotCd: kind === 1 ? 0.55 + state.rng() * 0.45 : 0,
    salvo: 0,
    pendingCd: 0,
    pendingFan: 0,
  })
}

function turnToward(enemy: Enemy, want: number, dt: number, rate = 9): void {
  let diff = want - enemy.angle
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  enemy.angle += diff * (1 - Math.exp(-rate * dt))
  enemy.spin = 0
}

function spawnPentShot(state: GameState, x: number, y: number, angle: number, speed: number): void {
  state.enemies.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: PENT.shotRadius,
    kind: 1,
    hp: 1,
    maxHp: 1,
    hitCd: 0,
    flash: 0,
    orbitCd: PENT.shotLife,
    spin: 0,
    angle,
    phase: 0,
    speed,
    generation: 0,
    immortal: true,
    ballistic: true,
    fuse: 0,
    parked: false,
    windup: 0,
    shotCd: 0,
    salvo: 0,
    pendingCd: 0,
    pendingFan: 0,
  })
}

function firePentFan(state: GameState, enemy: Enemy, count: number, spread: number, speed: number): void {
  const tipX = enemy.x + Math.cos(enemy.angle) * enemy.radius
  const tipY = enemy.y + Math.sin(enemy.angle) * enemy.radius
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1) - 0.5
    spawnPentShot(state, tipX, tipY, enemy.angle + t * spread, speed)
  }
}

function firePentRadial(state: GameState, enemy: Enemy, speed: number): void {
  const spread = 0.2
  for (let i = 0; i < 5; i++) {
    const a = enemy.angle + (i * Math.PI * 2) / 5
    const tipX = enemy.x + Math.cos(a) * enemy.radius
    const tipY = enemy.y + Math.sin(a) * enemy.radius
    spawnPentShot(state, tipX, tipY, a - spread, speed)
    spawnPentShot(state, tipX, tipY, a + spread, speed)
  }
}

function tickPentagon(state: GameState, enemy: Enemy, dt: number, dist: number, dx: number, dy: number, inside: boolean, fieldRank: number): void {
  const giant = giantPentagon(enemy)
  const band = giant ? GIANT_PENT : PENT
  const want = Math.atan2(dy, dx)
  turnToward(enemy, want, dt, giant ? 7.5 : 9)

  if (!enemy.parked) {
    if (dist <= band.stopMax) {
      enemy.parked = true
      enemy.vx = 0
      enemy.vy = 0
    } else {
      const speed = enemy.speed * (inside ? fieldSlow(fieldRank) : 1)
      const steer = 1 - Math.exp(-3.1 * dt)
      enemy.vx += ((dx / dist) * speed - enemy.vx) * steer
      enemy.vy += ((dy / dist) * speed - enemy.vy) * steer
      enemy.x += enemy.vx * dt
      enemy.y += enemy.vy * dt
    }
  } else {
    // Stand your ground — never back away; only resume if the player flees past resume range.
    enemy.vx = 0
    enemy.vy = 0
    if (dist > band.resume) enemy.parked = false
  }

  if (enemy.pendingFan > 0) {
    enemy.pendingCd -= dt
    if (enemy.pendingCd <= 0) {
      firePentFan(state, enemy, enemy.pendingFan, band.fanSpread, giant ? GIANT_PENT.shotSpeed : PENT.shotSpeed)
      enemy.pendingFan = 0
      enemy.shotCd = band.reload
    }
    return
  }

  if (!enemy.parked) return

  if (enemy.windup > 0) {
    enemy.windup = Math.max(0, enemy.windup - dt)
    const chargeMax = pentChargeMax(enemy)
    enemy.flash = Math.max(enemy.flash, 0.06 + (1 - enemy.windup / chargeMax) * 0.2)
    if (enemy.windup > 0) return
    const speed = giant ? GIANT_PENT.shotSpeed : PENT.shotSpeed
    if (giant) {
      if (enemy.salvo % 2 === 0) {
        firePentFan(state, enemy, 7, GIANT_PENT.fanSpread, speed)
        enemy.pendingFan = 6
        enemy.pendingCd = GIANT_PENT.stagger
      } else {
        firePentRadial(state, enemy, speed)
        enemy.shotCd = band.reload
      }
      enemy.salvo += 1
    } else {
      firePentFan(state, enemy, 3, PENT.fanSpread, speed)
      enemy.shotCd = band.reload
    }
    return
  }

  enemy.shotCd = Math.max(0, enemy.shotCd - dt)
  if (enemy.shotCd <= 0) enemy.windup = band.charge
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
        shatterEnemyDebris(state, e)
        state.enemies.splice(j, 1)
      }
      continue
    }
    if (e.ballistic && e.orbitCd <= 0) {
      burst(state, e.x, e.y, ENEMY_COLOR[e.kind], 6, 140)
      shatterEnemyDebris(state, e)
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
    const fieldRank = state.mods.field
    const inside = fieldRank > 0 && dist < fieldRadius(fieldRank) + e.radius
    if (isPentagon(e)) {
      tickPentagon(state, e, dt, dist, dx, dy, inside, fieldRank)
      continue
    }
    if (!e.ballistic) {
      const speed = e.speed * (inside ? fieldSlow(fieldRank) : 1)
      const steer = 1 - Math.exp(-3.1 * dt)
      e.vx += ((dx / dist) * speed - e.vx) * steer
      e.vy += ((dy / dist) * speed - e.vy) * steer
      e.x += e.vx * dt
      e.y += e.vy * dt
    } else {
      const crawl = inside && fieldOverdrive(fieldRank) ? fieldSlow(fieldRank) : 1
      e.x += e.vx * dt * crawl
      e.y += e.vy * dt * crawl
    }
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
    } else if (e.ballistic && e.kind === 1) {
      burst(state, e.x, e.y, ENEMY_COLOR[1], 10, 200)
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

function moveOrbs(state: GameState, _input: Input, dt: number, events: StepEvents): void {
  const magnet = 72 + state.mods.magnet * 28
  for (let i = state.orbs.length - 1; i >= 0; i--) {
    const orb = state.orbs[i]
    const dx = state.playerX - orb.x
    const dy = state.playerY - orb.y
    const dist = Math.hypot(dx, dy) || 1
    if (dist < magnet) orb.homing = true
    if (orb.homing) {
      const speed = 260 + state.mods.magnet * 110 + (1 - Math.min(1, dist / magnet)) * 120
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
      const bounced = thickHull(enemy) && deflectOffEnemy(ball, enemy)
      if (bounced) ball.flex = 1
      shoveFromBall(enemy, ball)
      damageEnemy(state, enemy, events, ball.damage, ball.quantum ? '#ff2d3a' : '#8dff4a', 'ball')
      enemy.hitCd = 0.14
      // Pierce hits do not split — only a real bounce (thick hull / giant) does.
      if (bounced && splitBall(state, ball)) {
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
      const shove = orbiterShove(state.mods.orbiter)
      if (shove > 0) shoveFromDisc(state, enemy, disc.x, disc.y, shove)
      spawnImpact(state, disc.x, disc.y)
      damageEnemy(state, enemy, events, orbiterDamage(state.mods.orbiter), disc.halo ? '#ff2d3a' : '#ffffff', 'orbiter')
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
  glideDroneReticle(state, dt)
  if (state.droneReload > 0) {
    state.droneReload = Math.max(0, state.droneReload - dt)
    faceDrone(state)
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
      const settled = droneAimSettled(state)
      if (settled && (state.droneAreaCd <= 0 || left > 220 || !stormAreaLive(state))) {
        hopStormArea(state, true)
      }
    }
  }
  faceDrone(state)
  if (!storm && !roundOpen && !droneAimed(state)) return
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
  setDroneAim(state, spot.x, spot.y, live.vx, live.vy)
  state.droneAreaCd = 1
}

function setDroneAim(state: GameState, x: number, y: number, vx: number, vy: number): void {
  const first = !state.reticleOn
  state.droneAimX = x
  state.droneAimY = y
  state.reticleVx = vx
  state.reticleVy = vy
  state.reticleOn = true
  if (first) {
    state.reticleX = x
    state.reticleY = y
  }
}

function glideDroneReticle(state: GameState, dt: number): void {
  if (!state.reticleOn) return
  const dx = state.droneAimX - state.reticleX
  const dy = state.droneAimY - state.reticleY
  const dist = Math.hypot(dx, dy)
  if (dist < 1.5) {
    state.reticleX = state.droneAimX
    state.reticleY = state.droneAimY
    return
  }
  const pace = 480 + Math.min(420, dist * 1.1)
  const step = Math.min(dist, pace * dt)
  state.reticleX += (dx / dist) * step
  state.reticleY += (dy / dist) * step
}

function droneAimSettled(state: GameState): boolean {
  return Math.hypot(state.droneAimX - state.reticleX, state.droneAimY - state.reticleY) < 28
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
  const elsewhere = areas.find((area) => Math.hypot(area.x - state.droneAimX, area.y - state.droneAimY) > minShift)
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
  if (Math.hypot(spot.x - state.droneAimX, spot.y - state.droneAimY) >= minShift) return spot
  let ang = Math.atan2(state.droneAimY - live.y, state.droneAimX - live.x) + 2.2
  for (let n = 0; n < 6; n++) {
    const x = state.droneAimX + Math.cos(ang) * minShift
    const y = state.droneAimY + Math.sin(ang) * minShift
    if (Math.hypot(x - state.playerX, y - state.playerY) >= 72) return { x, y }
    ang += 1.05
  }
  return { x: state.droneAimX + minShift, y: state.droneAimY }
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
  setDroneAim(state, spot.x, spot.y, live.vx, live.vy)
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

function updateHoles(state: GameState, dt: number, events: StepEvents, viewW: number, viewH: number): void {
  const rank = state.mods.hole
  for (let i = state.holes.length - 1; i >= 0; i--) {
    const well = state.holes[i]
    if (!well) continue
    if (well.blast > 0) {
      well.blast -= dt
      if (well.blast <= 0) state.holes.splice(i, 1)
      continue
    }
    if (well.closing > 0) {
      well.closing = Math.max(0, well.closing - dt)
      if (well.closing > 0) {
        // Singularity keeps yanking while it pinches shut; base Black Hole just fades.
        if (well.crimson) {
          const closeFrac = well.closeMax > 0 ? well.closing / well.closeMax : 0
          // Match render closeScale so pull reach tracks the visible vortex into the pin.
          const closeScale = closeFrac > 0.14
            ? 0.16 + 0.84 * Math.pow((closeFrac - 0.14) / 0.86, 0.7)
            : Math.max(0.04, 0.16 * (closeFrac / 0.14))
          pullIntoHole(state, well, dt, Math.max(0.08, closeScale), true)
        }
        continue
      }
      if (well.crimson) collapseHole(state, well, events)
      else state.holes.splice(i, 1)
      continue
    }
    well.life -= dt
    well.tickCd -= dt
    pullIntoHole(state, well, dt)
    if (well.tickCd <= 0) {
      well.tickCd += HOLE.tick
      tickHole(state, well, events)
    }
    if (well.life > 0) continue
    const close = holeCloseTime(well.crimson)
    well.closing = close
    well.closeMax = close
  }
  if (rank <= 0) return
  state.holeCd -= dt
  if (state.holeCd > 0 || state.holes.length >= 1) return
  spawnHole(state, rank, viewW, viewH)
  state.holeCd = holeInterval(rank)
}

function spawnHole(state: GameState, rank: number, viewW: number, viewH: number): void {
  const spot = holeSpot(state, viewW, viewH)
  const life = holeDuration(rank)
  state.holes.push({
    x: spot.x,
    y: spot.y,
    life,
    max: life,
    radius: holeRadius(rank),
    pull: holePull(rank),
    damage: holeDamage(rank),
    tickCd: HOLE.tick * 0.35,
    absorbed: 0,
    crimson: singularity(rank),
    closing: 0,
    closeMax: holeCloseTime(singularity(rank)),
    blast: 0,
    blastMax: 0,
    blastRadius: 0,
  })
}

function holeSpot(state: GameState, viewW: number, viewH: number): { x: number; y: number } {
  const halfW = Math.max(80, viewW) / 2
  const halfH = Math.max(80, viewH) / 2
  let best: Enemy | null = null
  let bestScore = -1
  for (const enemy of state.enemies) {
    if (enemy.immortal && enemy.fuse > 0) continue
    if (!enemyOnScreen(state, enemy, viewW, viewH)) continue
    let score = Math.max(1, enemy.maxHp)
    for (const other of state.enemies) {
      if (other === enemy) continue
      const dist = Math.hypot(other.x - enemy.x, other.y - enemy.y)
      if (dist < 150) score += Math.max(1, other.maxHp) * 0.45
    }
    if (score > bestScore) {
      bestScore = score
      best = enemy
    }
  }
  let x = best ? best.x : state.playerX + (state.rng() - 0.5) * halfW * 1.2
  let y = best ? best.y : state.playerY + (state.rng() - 0.5) * halfH * 1.2
  const dx = x - state.playerX
  const dy = y - state.playerY
  const dist = Math.hypot(dx, dy)
  if (dist < 96) {
    const ang = dist < 0.01 ? state.rng() * Math.PI * 2 : Math.atan2(dy, dx)
    x = state.playerX + Math.cos(ang) * 110
    y = state.playerY + Math.sin(ang) * 110
  }
  x = Math.max(state.playerX - halfW + 40, Math.min(state.playerX + halfW - 40, x))
  y = Math.max(state.playerY - halfH + 40, Math.min(state.playerY + halfH - 40, y))
  return { x, y }
}

function pullIntoHole(
  state: GameState,
  well: Hole,
  dt: number,
  reachScale = 1,
  collapse = false,
): void {
  const reach = well.radius * Math.max(0.05, reachScale)
  for (const enemy of state.enemies) {
    // Hostiles only — never yank projectiles (hex shards / ballistic pieces).
    if (enemy.fuse > 0 || enemy.ballistic) continue
    const dx = well.x - enemy.x
    const dy = well.y - enemy.y
    const dist = Math.hypot(dx, dy)
    if (dist > reach + enemy.radius || dist < 0.01) continue
    const fall = 1 - Math.min(1, dist / (reach + enemy.radius))
    const force = well.pull * (0.55 + fall * 1.35) * (collapse ? 1.45 : 1)
    const nx = dx / dist
    const ny = dy / dist
    // Mostly radial suck; orbit matches the well (counter-clockwise on canvas).
    const swirl = force * (collapse ? 0.12 : 0.55 + fall * 0.85)
    enemy.vx += (nx * force - ny * swirl) * dt
    enemy.vy += (ny * force + nx * swirl) * dt
    enemy.x += (nx * force - ny * swirl * 0.35) * dt * (collapse ? 0.75 : 0.55)
    enemy.y += (ny * force + nx * swirl * 0.35) * dt * (collapse ? 0.75 : 0.55)
  }
}

function tickHole(state: GameState, well: Hole, events: StepEvents): void {
  const ink = well.crimson ? '#ff2d3a' : '#ffffff'
  const before = state.dealt.hole
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const enemy = state.enemies[j]
    if (!enemy || enemy.immortal) continue
    const dist = Math.hypot(enemy.x - well.x, enemy.y - well.y)
    const edge = well.radius + enemy.radius
    if (dist > edge) continue
    // Full burn near the void; outer rim of the well ticks for much less.
    const t = Math.min(1, dist / Math.max(1, edge))
    const falloff = 0.18 + Math.pow(1 - t, 1.55) * 0.82
    const dealt = Math.max(1, Math.round(well.damage * falloff))
    damageEnemy(state, enemy, events, dealt, ink, 'hole')
  }
  well.absorbed += Math.max(0, state.dealt.hole - before)
}

function collapseHole(state: GameState, well: Hole, events: StepEvents): void {
  const radius = holeBlastRadius(well.absorbed)
  const dealt = holeBlastDamage(well.absorbed)
  well.blastRadius = radius
  well.blastMax = 0.7
  well.blast = well.blastMax
  well.life = 0
  well.radius = 0
  state.shake = Math.min(18, state.shake + 6.5 + Math.min(8, well.absorbed * 0.008))
  // No global red hurt-flash — dust, rings, and shake already sell the detonation.
  // Layered expanding shockwave rings.
  state.shocks.push({
    x: well.x,
    y: well.y,
    life: 0.85,
    max: 0.85,
    color: '#ff2d3a',
    span: radius,
    width: 7,
  })
  state.shocks.push({
    x: well.x,
    y: well.y,
    life: 0.7,
    max: 0.7,
    color: '#ffb040',
    span: radius * 0.82,
    width: 4.5,
  })
  state.shocks.push({
    x: well.x,
    y: well.y,
    life: 0.55,
    max: 0.55,
    color: '#ffffff',
    span: radius * 0.55,
    width: 2.8,
  })
  singularityDust(state, well.x, well.y, well.absorbed)
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const enemy = state.enemies[j]
    if (!enemy || enemy.immortal) continue
    const dist = Math.hypot(enemy.x - well.x, enemy.y - well.y)
    if (dist > radius + enemy.radius) continue
    damageEnemy(state, enemy, events, dealt, '#ff2d3a', 'hole')
    if (enemy.fuse > 0) continue
    const dx = enemy.x - well.x
    const dy = enemy.y - well.y
    const span = Math.hypot(dx, dy) || 1
    const kick = 240 + Math.min(300, well.absorbed * 0.08)
    enemy.vx += (dx / span) * kick
    enemy.vy += (dy / span) * kick
  }
}

const SINGULARITY_DUST = [
  '#ffffff',
  '#fff4e8',
  '#ffe0b0',
  '#ffb040',
  '#ff7a28',
  '#ff4a20',
  '#ff2d3a',
  '#d01830',
  '#8a1020',
  '#ff9860',
  '#ffd090',
  '#ff6060',
]

function singularityDust(state: GameState, x: number, y: number, absorbed: number): void {
  const count = Math.min(1800, 1100 + Math.floor(absorbed * 2.4))
  // Travel matches the blast ring (particle update damps at ~2.2, so speed is compensated).
  const reach = holeBlastRadius(absorbed)
  const damp = 2.2
  for (let i = 0; i < count; i++) {
    const a = state.rng() * Math.PI * 2
    const life = 0.45 + state.rng() * 0.55
    const travel = reach * (0.88 + state.rng() * 0.14)
    const frac = 1 - Math.exp(-damp * life)
    const s = (travel * damp) / Math.max(0.2, frac)
    pushParticle(state, {
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      max: life,
      size: (0.7 + state.rng() * 11 + (i % 7 === 0 ? 6 : 0) + (i % 13 === 0 ? 9 : 0)) * BODY,
      color: SINGULARITY_DUST[(i + Math.floor(state.rng() * SINGULARITY_DUST.length)) % SINGULARITY_DUST.length]!,
    })
  }
}

function updateTesla(state: GameState, dt: number, events: StepEvents, viewW: number, viewH: number): void {
  const rank = state.mods.tesla
  if (rank <= 0) return
  state.teslaCd -= dt
  if (state.teslaCd > 0) return
  const reactor = arcReactor(rank)
  const targets = teslaTargets(state, teslaBolts(rank, reactor), viewW, viewH)
  if (targets.length === 0) {
    state.teslaCd = 0.2
    return
  }
  state.teslaCd = teslaInterval(rank, reactor)
  const sky = state.playerY - Math.max(80, viewH) / 2
  for (const enemy of targets) callBolt(state, enemy, events, reactor, sky, viewW, viewH)
}

function enemyOnScreen(state: GameState, enemy: Enemy, viewW: number, viewH: number): boolean {
  const halfW = Math.max(80, viewW) / 2
  const halfH = Math.max(80, viewH) / 2
  const left = state.playerX - halfW
  const right = state.playerX + halfW
  const top = state.playerY - halfH
  const bottom = state.playerY + halfH
  return enemy.x >= left && enemy.x <= right && enemy.y >= top && enemy.y <= bottom
}

function teslaTargets(state: GameState, count: number, viewW: number, viewH: number): Enemy[] {
  const pool = state.enemies.filter(
    (enemy) => !enemy.immortal && !enemy.ballistic && enemyOnScreen(state, enemy, viewW, viewH),
  )
  const open = pool.slice()
  const picked: Enemy[] = []
  while (picked.length < count && open.length > 0) {
    const tough = state.rng() < 0.68
    const choice = tough ? weightedByHull(state, open) : open[Math.floor(state.rng() * open.length)]
    if (!choice) break
    picked.push(choice)
    const at = open.indexOf(choice)
    if (at >= 0) open.splice(at, 1)
  }
  return picked
}

function weightedByHull(state: GameState, pool: Enemy[]): Enemy | undefined {
  let total = 0
  for (const enemy of pool) total += Math.max(1, enemy.maxHp)
  let roll = state.rng() * total
  for (const enemy of pool) {
    roll -= Math.max(1, enemy.maxHp)
    if (roll <= 0) return enemy
  }
  return pool[pool.length - 1]
}

function callBolt(
  state: GameState,
  enemy: Enemy,
  events: StepEvents,
  reactor: boolean,
  skyY: number,
  viewW: number,
  viewH: number,
): void {
  const dealt = teslaDamage(state.mods.tesla, reactor)
  const ink = reactor ? '#ff2d3a' : '#ffffff'
  const strike = jaggedStrike(state, skyY, enemy)
  const splinters = sideSplinters(state, strike)
  const bursts = impactBursts(state, enemy.x, enemy.y)
  const shards = impactShards(state, enemy.x, enemy.y)
  const arcs: Jagged[] = []
  const taken = new Set<Enemy>([enemy])
  damageEnemy(state, enemy, events, dealt, ink, 'tesla')
  shockArc(state, enemy.x, enemy.y, reactor)
  if (reactor) {
    let from = enemy
    let hopDamage = Math.round(dealt * 0.35)
    for (let hop = 0; hop < 3 && hopDamage > 0; hop++) {
      const next = nearestArc(state, from, taken, 135, viewW, viewH)
      if (!next) break
      taken.add(next)
      const arc = jaggedArc(state, from, next)
      arcs.push(arc)
      splinters.push(...sideSplinters(state, arc).slice(0, 2))
      bursts.push(...impactBursts(state, next.x, next.y))
      shards.push(...impactShards(state, next.x, next.y))
      damageEnemy(state, next, events, hopDamage, ink, 'tesla')
      shockArc(state, next.x, next.y, true)
      from = next
      hopDamage = Math.round(hopDamage * 0.35)
    }
  }
  if (state.bolts.length > 28) state.bolts.shift()
  state.bolts.push({ life: 0.42, max: 0.42, reactor, strike, arcs, splinters, bursts, shards, x: enemy.x, y: enemy.y })
}

function nearestArc(
  state: GameState,
  from: Enemy,
  taken: Set<Enemy>,
  range: number,
  viewW: number,
  viewH: number,
): Enemy | null {
  let best: Enemy | null = null
  let bestD = range
  for (const enemy of state.enemies) {
    if (taken.has(enemy) || enemy.immortal || enemy.ballistic) continue
    if (!enemyOnScreen(state, enemy, viewW, viewH)) continue
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
  burst(state, x, y, color, reactor ? 14 : 10, reactor ? 280 : 220)
}

function jaggedStrike(state: GameState, skyY: number, enemy: Enemy): Jagged {
  const fromX = enemy.x + (state.rng() - 0.5) * 36
  const fromY = Math.min(skyY - BOLT_SKY_PAD, enemy.y - BOLT_SKY_PAD - 40)
  const drop = Math.max(120, enemy.y - fromY)
  const spread = Math.min(78, drop * 0.2)
  const pts = displace(state, fromX, fromY, enemy.x, enemy.y, 4, spread)
  return { pts, half: inkWidths(state, pts.length, 6.6, 0.16) }
}

function jaggedArc(state: GameState, from: Enemy, to: Enemy): Jagged {
  const pts = displace(state, from.x, from.y, to.x, to.y, 3, 38)
  return { pts, half: inkWidths(state, pts.length, 4.4, 0.28) }
}

function sideSplinters(state: GameState, jag: Jagged): Jagged[] {
  const out: Jagged[] = []
  const n = jag.pts.length
  if (n < 4) return out
  const count = 3 + Math.floor(state.rng() * 3)
  for (let i = 0; i < count; i++) {
    const idx = 1 + Math.floor(state.rng() * (n - 2))
    const point = jag.pts[idx]
    const prev = jag.pts[Math.max(0, idx - 1)]
    const next = jag.pts[Math.min(n - 1, idx + 1)]
    if (!point || !prev || !next) continue
    const heading = Math.atan2(next.y - prev.y, next.x - prev.x)
    const side = state.rng() < 0.5 ? 1 : -1
    const angle = heading + side * (0.55 + state.rng() * 1.05)
    const reach = 14 + state.rng() * 46
    const pts = displace(
      state,
      point.x,
      point.y,
      point.x + Math.cos(angle) * reach,
      point.y + Math.sin(angle) * reach,
      2,
      reach * 0.55,
    )
    out.push({ pts, half: inkWidths(state, pts.length, 2.15, 0.12) })
  }
  return out
}

function impactBursts(state: GameState, x: number, y: number): Burst[] {
  const rays: Burst[] = []
  const count = 7 + Math.floor(state.rng() * 3)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (state.rng() - 0.5) * 0.85
    const reach = 18 + state.rng() * 48
    const pts = displace(
      state,
      x,
      y,
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach,
      2,
      reach * 0.42,
    )
    const speed = 280 + state.rng() * 360
    rays.push({
      jag: { pts, half: inkWidths(state, pts.length, 2.35, 0.1) },
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
  return rays
}

function displace(
  state: GameState,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  depth: number,
  spread: number,
): { x: number; y: number }[] {
  const walk = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    d: number,
    spr: number,
  ): { x: number; y: number }[] => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (d <= 0 || len < 16) return [a, b]
    const kick = (state.rng() - 0.5) * 2 * spr
    const mid = {
      x: (a.x + b.x) / 2 + (-dy / len) * kick,
      y: (a.y + b.y) / 2 + (dx / len) * kick,
    }
    const left = walk(a, mid, d - 1, spr * 0.58)
    const right = walk(mid, b, d - 1, spr * 0.58)
    return left.concat(right.slice(1))
  }
  return walk({ x: ax, y: ay }, { x: bx, y: by }, depth, spread)
}

function impactShards(state: GameState, x: number, y: number): Shard[] {
  const shards: Shard[] = []
  const count = 8 + Math.floor(state.rng() * 4)
  for (let i = 0; i < count; i++) {
    const angle = state.rng() * Math.PI * 2
    const speed = 240 + state.rng() * 420
    shards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      spin: (state.rng() - 0.5) * 16,
      size: 8 + state.rng() * 16,
    })
  }
  return shards
}

function inkWidths(state: GameState, count: number, base: number, taperEnd: number): number[] {
  const half: number[] = []
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    const taper = 1 - t * (1 - taperEnd)
    let lump = 0.38 + state.rng() * 1.35
    const roll = state.rng()
    if (roll < 0.24) lump *= 0.3
    else if (roll > 0.82) lump *= 1.55
    half.push(Math.max(0.4, base * taper * lump))
  }
  if (count > 0) half[count - 1] = Math.max(0.32, base * taperEnd * 0.5)
  return half
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
  const picked: UpgradeId[] = []
  for (const id of pool) {
    if (picked.length >= 3) break
    picked.push(id)
  }
  while (picked.length < 3) picked.push('cache')
  return picked.map((id) => describeOffer(state, id))
}

const OFFER_COPY: Record<Exclude<UpgradeId, 'cache'>, { title: string; detail: string }> = {
  pulse: { title: 'Pulse', detail: 'Shots leave the core sooner.' },
  caliber: { title: 'Caliber', detail: 'Each round hits a little harder.' },
  drift: { title: 'Drift', detail: 'Top speed climbs.' },
  magnet: { title: 'Magnet', detail: 'Orbs race toward the core faster. Each rank pulls harder and reaches a little farther.' },
  fork: { title: 'Fork', detail: 'Two streams sit on the reticle. The next rank adds a third, still tight on the aim.' },
  greed: { title: 'Greed', detail: 'Every orb pays a bonus, and bigger orbs pay a little more.' },
  regen: { title: 'Regeneration', detail: 'Each level restores one health. Ranks restore more.' },
  orbiter: { title: 'Sentinel', detail: 'Two discs orbit the core, then fade out and recharge. They nudge what they hit.' },
  field: { title: 'Force Field', detail: 'A white field burns and slows anything inside.' },
  ball: { title: 'Bouncy Ball', detail: 'A glowing ball ricochets inside the screen. It bounces off giant circles and any hostile whose hull is 1000 or more, no matter how much health is left.' },
  drone: { title: 'Drone', detail: 'A drone fires a fan of rockets at once. Each one plants a reticle where it will land.' },
  tesla: { title: 'Tesla Coil', detail: 'One lightning bolt falls on a hostile in view, leaning toward the tougher ones. Later ranks hit harder and strike again sooner.' },
  hole: { title: 'Black Hole', detail: 'A pitch-black core wrapped in a dense white swirling vortex. It violently pulls hostiles across its full reach and burns them lightly while it lasts.' },
}

const OFFER_RANK_UP: Partial<Record<Exclude<UpgradeId, 'cache'>, string>> = {
  orbiter: 'One more disc. They last longer, hit harder, spin faster, and nudge harder.',
  field: 'The field widens, burns harder, slows more, and pulses faster.',
  ball: 'More balls. They hit harder and stay out longer.',
  drone: 'More rockets in each fan, a wider blast, and a shorter wait between volleys.',
  tesla: 'Still one bolt. It hits harder, and the pause before the next strike is shorter.',
  hole: 'A wider well, a longer burn, and a more violent pull — it also appears less often.',
  magnet: 'Orbs snap in faster, and the pull reaches a little farther.',
  regen: 'Each level restores a little more health.',
}

const OFFER_EVOLVE: Partial<Record<Exclude<UpgradeId, 'cache'>, { title: string; detail: string }>> = {
  tesla: { title: 'Arc Reactor', detail: 'One red bolt strikes, then chain-arcs through nearby hostiles. It hits harder and falls again sooner.' },
  drone: { title: 'Bulletstorm', detail: 'The drone turns red. Each volley is a wide fan of rockets, and the wait between them is short.' },
  orbiter: { title: "Guardian's Halo", detail: 'Six red discs stay out and spin faster. They carve hostiles and shove them aside.' },
  ball: { title: 'Quantum Core', detail: 'Hyper-fast red balls. They bounce off giant circles and hostiles with 1000 hull or more, and bouncing off those hostiles replaces one with two smaller balls.' },
  field: { title: 'Null Zone', detail: 'The field turns red, reaches farther, burns harder, and slows hostiles and flying shards inside it.' },
  hole: { title: 'Singularity', detail: 'Same-size crimson vortex: red to orange to white into a black core. It yanks hostiles in hard, then collapses into a storm of dust and a blast that grows with everything it absorbed.' },
}

function describeOffer(state: GameState, id: UpgradeId): Offer {
  if (id === 'cache') return { id, title: 'Cache', detail: 'Bank 40 score.', rank: 1, max: 1, overdrive: false }
  const rank = state.mods[id] + 1
  const max = UPGRADE_MAX[id]
  const evolved =
    (id === 'tesla' && arcReactor(rank)) ||
    (id === 'drone' && droneStorm(rank)) ||
    (id === 'hole' && singularity(rank)) ||
    ((id === 'orbiter' || id === 'field' || id === 'ball') && rank >= OVERDRIVE)
  if (evolved) {
    const evo = OFFER_EVOLVE[id]!
    return { id, title: evo.title, detail: evo.detail, rank, max, overdrive: true }
  }
  const base = OFFER_COPY[id]
  const ranked = rank > 1 && (id === 'tesla' ? rank < TESLA.evolveRank : id === 'hole' ? rank < HOLE.evolveRank : true)
  return { id, title: base.title, detail: ranked && OFFER_RANK_UP[id] ? OFFER_RANK_UP[id]! : base.detail, rank, max, overdrive: false }
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
  if (id === 'hole' && state.mods.hole === 1) state.holeCd = 0.25
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

const SHARD_INK: Record<number, string[]> = {
  0: ['#ff3df2', '#ff7af5', '#c010a8', '#ffffff'],
  1: ['#ffd23a', '#ffe080', '#c9a010', '#ffffff'],
  2: ['#8dff6a', '#b8ff9a', '#4cb828', '#ffffff'],
  3: ['#ff2d3a', '#ff6a70', '#b01020', '#ffffff'],
}

/** Visual-only broken chips of the enemy body — never deal damage. */
function shatterEnemyDebris(state: GameState, enemy: Enemy): void {
  const palette = SHARD_INK[enemy.kind] ?? ['#ffffff']
  const count = Math.min(36, 12 + Math.floor(enemy.radius * 0.9))
  for (let i = 0; i < count; i++) {
    const a = state.rng() * Math.PI * 2
    const s = (90 + state.rng() * 280) * (0.55 + enemy.radius / 40)
    const life = 0.28 + state.rng() * 0.42
    const chip = 1.4 + state.rng() * Math.max(2.2, enemy.radius * 0.22)
    pushParticle(state, {
      x: enemy.x + (state.rng() - 0.5) * enemy.radius * 0.6,
      y: enemy.y + (state.rng() - 0.5) * enemy.radius * 0.6,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      max: life,
      size: chip * BODY,
      color: palette[Math.floor(state.rng() * palette.length)]!,
      shard: true,
      ang: a + (state.rng() - 0.5) * 0.8,
      spin: (state.rng() - 0.5) * 14,
    })
  }
}

function pushParticle(state: GameState, particle: Particle): void {
  if (state.particles.length > 1900) state.particles.shift()
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
    if (p.shard && p.spin) p.ang = (p.ang ?? 0) + p.spin * dt
    const damp = Math.exp(-2.2 * dt)
    p.vx *= damp
    p.vy *= damp
  }
  for (let i = state.bolts.length - 1; i >= 0; i--) {
    const bolt = state.bolts[i]
    if (!bolt) continue
    bolt.life -= dt
    if (bolt.life <= 0) {
      state.bolts.splice(i, 1)
      continue
    }
    const damp = Math.exp(-5.4 * dt)
    for (const shard of bolt.shards) {
      shard.x += shard.vx * dt
      shard.y += shard.vy * dt
      shard.angle += shard.spin * dt
      shard.vx *= damp
      shard.vy *= damp
      shard.spin *= damp
    }
    for (const ray of bolt.bursts) {
      ray.vx *= damp
      ray.vy *= damp
      const dx = ray.vx * dt
      const dy = ray.vy * dt
      for (const point of ray.jag.pts) {
        point.x += dx
        point.y += dy
      }
    }
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
