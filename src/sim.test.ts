import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BODY,
  HIT,
  TUNING,
  DISC,
  chooseUpgrade,
  createGame,
  hexRingReach,
  orbitActive,
  orbitDiscs,
  orbitRate,
  discTurn,
  discRadius,
  discOrbit,
  ballCount,
  ballDamage,
  ballSpeed,
  ballInterval,
  ballLife,
  arcReactor,
  teslaBolts,
  teslaDamage,
  teslaInterval,
  placeStrikeTop,
  BOLT_SKY_PAD,
  orbiterCount,
  orbiterDamage,
  orbiterShove,
  FIELD,
  fieldColor,
  fieldDamage,
  fieldRadius,
  fieldRipple,
  fieldSlow,
  droneBlast,
  droneDamage,
  droneBurst,
  droneInterval,
  droneVolley,
  droneReload,
  droneStorm,
  damageReport,
  shellPose,
  screenToWorld,
  step,
  worldToScreen,
  xpNeedFor,
  type Enemy,
  type Input,
  type Orb,
} from './sim.ts'

function strikeDrift(pts: { x: number; y: number }[]): number {
  const start = pts[0]
  const end = pts[pts.length - 1]
  if (!start || !end) return 0
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy) || 1
  let drift = 0
  for (const point of pts) {
    const cross = Math.abs((point.x - start.x) * dy - (point.y - start.y) * dx) / len
    if (cross > drift) drift = cross
  }
  return drift
}

function input(over: Partial<Input> = {}): Input {
  return {
    moveX: 0,
    moveY: 0,
    aimX: 240,
    aimY: 0,
    aimActive: true,
    viewRadius: 640,
    viewW: 1280,
    viewH: 720,
    ...over,
  }
}

function takeOffer(state: ReturnType<typeof createGame>, id: string) {
  for (let n = 0; n < 48; n++) {
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.phase, 'level')
    assert.equal(state.offers.length, 3)
    assert.equal(new Set(state.offers.map((offer) => offer.id)).size, 3)
    const offer = state.offers.find((item) => item.id === id)
    if (offer) return offer
    chooseUpgrade(state, 0)
  }
  throw new Error(`never offered ${id}`)
}

function enemy(over: Partial<Enemy> = {}): Enemy {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 16,
    kind: 0,
    hp: 1,
    hitCd: 0,
    flash: 0,
    orbitCd: 0,
    spin: 0,
    angle: 0,
    phase: 0,
    speed: 120,
    generation: 0,
    maxHp: 1,
    immortal: false,
    ballistic: false,
    fuse: 0,
    ...over,
    maxHp: over.maxHp ?? over.hp ?? 1,
  }
}

function orb(over: Partial<Orb> = {}): Orb {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 6,
    value: 1,
    color: '#ffffff',
    rare: false,
    homing: false,
    pulse: 0,
    ...over,
  }
}

function run(state: ReturnType<typeof createGame>, control: Input, seconds: number): void {
  const steps = Math.round(seconds * 60)
  for (let i = 0; i < steps; i++) step(state, control, 1 / 60)
}

describe('arena camera', () => {
  it('pins the core to the middle of the view', () => {
    const screen = worldToScreen(1000, 800, 50000, -20000, 50000, -20000)
    assert.equal(screen.x, 500)
    assert.equal(screen.y, 400)
  })

  it('reads the cursor as a world point from the center', () => {
    const world = screenToWorld(800, 600, 40, -10, 800, 300)
    assert.equal(world.x, 440)
    assert.equal(world.y, -10)
    const back = worldToScreen(800, 600, 40, -10, world.x, world.y)
    assert.equal(back.x, 800)
    assert.equal(back.y, 300)
  })
})

describe('drift', () => {
  it('moves up the infinite field on W and stays finite', () => {
    const state = createGame(0, 3)
    state.spawnCd = 999
    run(state, input({ moveY: -1, aimActive: false }), 0.6)
    assert.ok(state.playerY < -80)
    assert.equal(state.playerX, 0)
  })

  it('never wraps back toward the origin', () => {
    const state = createGame(0, 4)
    state.spawnCd = 999
    run(state, input({ moveX: 1, aimActive: false }), 10)
    assert.ok(state.playerX > TUNING.maxSpeed * 7)
    assert.ok(Number.isFinite(state.playerX))
  })

  it('caps a diagonal at max speed', () => {
    const state = createGame(0, 5)
    state.spawnCd = 999
    run(state, input({ moveX: 1, moveY: 1, aimActive: false }), 2)
    const speed = Math.hypot(state.playerVx, state.playerVy)
    assert.ok(speed <= TUNING.maxSpeed + 0.01)
    assert.ok(speed > TUNING.maxSpeed * 0.92)
  })

  it('bleeds speed when the keys come up', () => {
    const state = createGame(0, 6)
    state.spawnCd = 999
    run(state, input({ moveX: 1, aimActive: false }), 1)
    run(state, input({ aimActive: false }), 1.4)
    assert.ok(Math.hypot(state.playerVx, state.playerVy) < 8)
  })
})

describe('cursor stream', () => {
  it('fires toward the cursor without a click', () => {
    const state = createGame(0, 7)
    const events = step(state, input({ aimX: 0, aimY: 300 }), 1 / 60)
    assert.equal(events.shots, 1)
    assert.equal(state.bullets.length, 1)
    for (const bullet of state.bullets) {
      assert.ok(bullet.vy > 700)
      assert.ok(Math.abs(bullet.vx) < 40)
    }
  })

  it('flies straight and does not follow a later change in drift', () => {
    const state = createGame(0, 8)
    state.playerVx = 220
    state.playerVy = -80
    step(state, input({ aimX: 400, aimY: 0, moveX: 0, moveY: 0 }), 1 / 60)
    const bullet = state.bullets[0]
    assert.ok(bullet)
    assert.ok(bullet.vx > 800)
    assert.ok(Math.abs(bullet.vy) < 40)
    const vx = bullet.vx
    const vy = bullet.vy
    const x0 = bullet.x
    const y0 = bullet.y
    state.playerVx = -300
    state.playerVy = 240
    step(state, input({ aimX: 400, aimY: 0, moveX: 0, moveY: 0 }), 1 / 60)
    assert.equal(bullet.vx, vx)
    assert.equal(bullet.vy, vy)
    assert.ok(Math.abs(bullet.x - x0 - vx / 60) < 1.5)
    assert.ok(Math.abs(bullet.y - y0 - vy / 60) < 1.5)
  })

  it('adds one stream per Fork rank and stops at three', () => {
    const state = createGame(0, 3)
    state.spawnCd = 999
    state.mods.fork = 1
    state.fireCd = 0
    step(state, input({ aimX: 400, aimY: 0 }), 1 / 60)
    assert.equal(state.bullets.length, 2)
    const pair = state.bullets.map((bullet) => Math.atan2(bullet.vy, bullet.vx)).sort((a, b) => a - b)
    assert.ok(pair[0] !== undefined && pair[1] !== undefined)
    assert.ok(pair[0] < 0 && pair[1] > 0)
    assert.ok(Math.abs(pair[0] + pair[1]) < 0.02)
    assert.ok(pair[1] - pair[0] < 0.22)
    state.bullets.length = 0
    state.mods.fork = 2
    state.fireCd = 0
    step(state, input({ aimX: 400, aimY: 0 }), 1 / 60)
    assert.equal(state.bullets.length, 3)
    const fan = state.bullets.map((bullet) => Math.atan2(bullet.vy, bullet.vx)).sort((a, b) => a - b)
    assert.ok(fan[0] !== undefined && fan[1] !== undefined && fan[2] !== undefined)
    assert.ok(Math.abs(fan[1]) < 0.02)
    assert.ok(Math.abs(fan[0] + fan[2]) < 0.02)
    assert.ok(fan[2] < 0.22)
    state.bullets.length = 0
    state.mods.fork = 4
    state.fireCd = 0
    step(state, input(), 1 / 60)
    assert.equal(state.bullets.length, 3)
  })

  it('holds the last aim when the cursor sits on the core', () => {
    const state = createGame(0, 9)
    step(state, input({ aimX: 0, aimY: 220 }), 1 / 60)
    const aim = state.aim
    step(state, input({ aimX: state.playerX, aimY: state.playerY }), 1 / 60)
    assert.equal(state.aim, aim)
  })
})

describe('hostiles', () => {
  it('shatters a shape the stream touches and banks the score', () => {
    const state = createGame(0, 2)
    state.spawnCd = 50
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 24 }))
    const events = step(state, input(), 1 / 60)
    assert.equal(events.kills, 1)
    assert.equal(state.score, 10)
    assert.equal(state.best, 10)
    assert.equal(state.enemies.length, 0)
    assert.equal(state.floaters.some((floater) => floater.text.startsWith('+')), false)
  })

  it('splits a normal circle once and a big circle into normals that split again', () => {
    const state = createGame(0, 19)
    state.spawnCd = 50
    state.xpNeed = 999
    state.enemies.push(enemy({ x: TUNING.muzzle + 30, y: 0, radius: 14, kind: 2, hp: 1, generation: 0, speed: 0 }))
    step(state, input(), 1 / 60)
    assert.equal(state.enemies.length, 2)
    for (const child of state.enemies) {
      assert.equal(child.kind, 2)
      assert.equal(child.generation, 2)
      assert.equal(child.hp, 100)
      assert.ok(child.radius < 8)
    }
    const piece = state.enemies[0]
    assert.ok(piece)
    state.enemies.splice(0, state.enemies.length, piece)
    piece.x = state.playerX + TUNING.muzzle + 24
    piece.y = state.playerY
    piece.vx = 0
    piece.vy = 0
    piece.speed = 0
    piece.hitCd = 0
    state.fireCd = 0
    step(state, input({ aimX: state.playerX + 200, aimY: state.playerY }), 1 / 60)
    assert.equal(state.enemies.includes(piece), false)
    assert.equal(state.enemies.length, 0)

    state.bullets.length = 0
    state.fireCd = 0
    state.enemies.push(enemy({ x: 220, y: 0, radius: 36, kind: 2, hp: 1, generation: 0, speed: 0 }))
    for (let i = 0; i < 40 && state.enemies.length < 2; i++) {
      step(state, input({ aimX: 400, aimY: 0 }), 1 / 60)
    }
    assert.equal(state.enemies.length, 2)
    for (const child of state.enemies) {
      assert.equal(child.kind, 2)
      assert.equal(child.generation, 0)
      assert.equal(child.hp, 300)
      assert.equal(child.radius, 14)
    }
    const child = state.enemies[0]
    assert.ok(child)
    state.enemies.splice(0, state.enemies.length, child)
    child.hp = 1
    child.x = state.playerX + TUNING.muzzle + 24
    child.y = state.playerY
    child.vx = 0
    child.vy = 0
    child.speed = 0
    child.hitCd = 0
    for (let i = 0; i < 40 && state.enemies.includes(child); i++) {
      step(state, input({ aimX: state.playerX + 200, aimY: state.playerY }), 1 / 60)
    }
    assert.equal(state.enemies.includes(child), false)
    assert.equal(state.enemies.length, 2)
    assert.ok(state.enemies.every((speck) => speck.generation === 2 && speck.hp === 100 && speck.radius < 8))
  })

  it('needs two hits to break a block', () => {
    const state = createGame(0, 11)
    state.spawnCd = 50
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 26, kind: 1, hp: HIT * 2 }))
    step(state, input(), 1 / 60)
    assert.equal(state.score, 0)
    assert.equal(state.enemies.length, 1)
    assert.equal(state.enemies[0]?.hp, HIT)
    assert.ok((state.enemies[0]?.flash ?? 0) > 0.04)
    assert.ok((state.enemies[0]?.flash ?? 0) < 0.1)
    for (let i = 0; i < 40 && state.enemies.length; i++) step(state, input(), 1 / 60)
    assert.equal(state.enemies.length, 0)
    assert.equal(state.score, 20)
  })

  it('builds a combo when shapes break in a chain', () => {
    const state = createGame(0, 12)
    state.spawnCd = 50
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 24 }))
    step(state, input(), 1 / 60)
    state.enemies.push(enemy({ x: state.playerX + TUNING.muzzle, y: state.playerY, radius: 24 }))
    for (let i = 0; i < 40 && state.score < 30; i++) {
      step(state, input({ aimX: state.playerX + 200, aimY: state.playerY }), 1 / 60)
    }
    assert.equal(state.combo, 2)
    assert.equal(state.score, 30)
  })

  it('sends a rare red hex with a much thicker hull', () => {
    const early = createGame(0, 7)
    early.fireCd = 10
    const earlyCounts = [0, 0, 0, 0]
    for (let i = 0; i < 80; i++) {
      early.spawnCd = 0
      early.enemies.length = 0
      step(early, input({ viewRadius: 400, aimActive: false }), 1 / 60)
      for (const hostile of early.enemies) {
        earlyCounts[hostile.kind] += 1
        assert.equal(hostile.hp, [100, 200, 300, 1000][hostile.kind])
      }
    }
    assert.ok((earlyCounts[3] ?? 0) >= 1)
    assert.ok((earlyCounts[2] ?? 0) >= 1)
    assert.ok((earlyCounts[3] ?? 0) < (earlyCounts[0] ?? 0))
    assert.ok((earlyCounts[2] ?? 0) < (earlyCounts[1] ?? 0))
    assert.ok((earlyCounts[0] ?? 0) > 0)

    const state = createGame(0, 7)
    state.fireCd = 10
    state.time = 70
    state.level = 9
    const counts = [0, 0, 0, 0]
    let plainHex = 0
    let giantHex = 0
    for (let i = 0; i < 160; i++) {
      state.spawnCd = 0
      state.enemies.length = 0
      step(state, input({ viewRadius: 400, aimActive: false }), 1 / 60)
      for (const hostile of state.enemies) {
        if (hostile.ballistic) continue
        counts[hostile.kind] += 1
        if (hostile.kind !== 3) continue
        assert.equal(hostile.hp, 1000)
        assert.ok(hostile.speed < 66)
        if (hostile.radius > 40) giantHex += 1
        else plainHex += 1
      }
    }
    assert.ok(plainHex >= 1)
    assert.ok(giantHex >= 1)
    assert.ok(counts[3] < (counts[0] ?? 0) / 4)
    assert.ok(counts[3] < (counts[1] ?? 0))
  })

  it('spawns outside the view', () => {
    const state = createGame(0, 13)
    state.spawnCd = 0
    step(state, input({ viewRadius: 400, aimActive: false }), 1 / 60)
    assert.ok(state.enemies.length >= 1)
    for (const hostile of state.enemies) {
      const dist = Math.hypot(hostile.x - state.playerX, hostile.y - state.playerY)
      assert.ok(dist >= 400)
    }
  })

  it('keeps hostiles from sitting on each other', () => {
    const state = createGame(0, 21)
    state.spawnCd = 999
    state.enemies.push(enemy({ x: 240, y: 30, speed: 120, hp: 8 }))
    state.enemies.push(enemy({ x: 240, y: 30, speed: 120, hp: 8, phase: 2 }))
    run(state, input({ aimX: 0, aimY: -500, viewRadius: 200 }), 0.5)
    const a = state.enemies[0]
    const b = state.enemies[1]
    assert.ok(a)
    assert.ok(b)
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius - 0.5)
  })

  it('closes distance on the core', () => {
    const state = createGame(0, 14)
    state.spawnCd = 80
    state.enemies.push(enemy({ x: 420, y: 0, hp: 30, radius: 16, speed: 160, kind: 0 }))
    run(state, input({ aimX: 0, aimY: -400, viewRadius: 220 }), 1)
    const hostile = state.enemies[0]
    assert.ok(hostile)
    assert.ok(hostile.x < 340)
  })

  it('shoves every hostile inside the hex ring when the hull cracks', () => {
    const state = createGame(0, 16)
    state.spawnCd = 999
    state.fireCd = 10
    state.invuln = 0
    state.enemies.push(enemy({ x: 0, y: 0, radius: 18, hp: 8, speed: 0, phase: 0.4 }))
    state.enemies.push(enemy({ x: 22, y: 6, radius: 14, hp: 8, speed: 0, phase: 1.7 }))
    state.enemies.push(enemy({ x: 34, y: 0, radius: 10, hp: 8, speed: 0, phase: 2.2 }))
    state.enemies.push(enemy({ x: 420, y: 30, radius: 16, hp: 8, speed: 0, phase: 0.2 }))
    const far = state.enemies[3]
    assert.ok(far)
    const beforeX = far.x
    const beforeY = far.y
    const hit = step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(hit.hurt, true)
    assert.equal(state.hull, TUNING.hullMax - 1)
    assert.equal(state.enemies.length, 4)
    for (const hostile of state.enemies.slice(0, 3)) {
      const dx = hostile.x - state.playerX
      const dy = hostile.y - state.playerY
      const dist = Math.hypot(dx, dy)
      const edge = hexRingReach(Math.atan2(dy, dx), state.time)
      assert.ok(dist > edge + hostile.radius)
    }
    const stayed = state.enemies[3]
    assert.ok(stayed)
    assert.ok(Math.hypot(stayed.x - beforeX, stayed.y - beforeY) < 1)
  })

  it('keeps a blinking giant hex fixed while others push', () => {
    const state = createGame(0, 21)
    state.spawnCd = 999
    state.fireCd = 10
    state.invuln = 0
    state.mods.orbiter = 1
    state.orbitTime = 0.4
    const hex = enemy({
      x: 0,
      y: 0,
      vx: 90,
      vy: -40,
      kind: 3,
      hp: 1,
      maxHp: 1000,
      radius: 80,
      speed: 40,
      fuse: 1.4,
      immortal: true,
    })
    state.enemies.push(hex, enemy({ x: 10, y: 4, radius: 30, hp: 80, speed: 0 }))
    state.balls.push({
      x: 20,
      y: 0,
      vx: -700,
      vy: 0,
      life: 3,
      max: 3,
      radius: 16,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 8,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    })
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(hex.x, 0)
    assert.equal(hex.y, 0)
    assert.equal(hex.vx, 0)
    assert.equal(hex.vy, 0)
  })

  it('bursts a shard on the core and knocks the core back', () => {
    const state = createGame(0, 4)
    state.spawnCd = 999
    state.fireCd = 10
    state.invuln = 0
    state.enemies.push(
      enemy({
        x: 12,
        y: 0,
        vx: -40,
        vy: 0,
        radius: 14,
        kind: 3,
        hp: 1,
        ballistic: true,
        immortal: true,
        orbitCd: 1,
        speed: 190,
      }),
    )
    const events = step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(events.hurt, true)
    assert.equal(state.hull, TUNING.hullMax - 1)
    assert.equal(state.enemies.length, 0)
    assert.ok(state.playerVx < -400)
    assert.ok(state.flash > 0.5)
    assert.ok(state.shocks.some((shock) => shock.color === '#ff2d3a'))
  })

  it('cracks the hull once, then goes dark at zero', () => {
    const state = createGame(0, 15)
    state.spawnCd = 80
    state.invuln = 0
    state.enemies.push(enemy({ x: 0, y: 0, radius: 20, hp: 8 }))
    const hit = step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(hit.hurt, true)
    assert.equal(state.hull, TUNING.hullMax - 1)
    const hull = state.hull
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.hull, hull)

    state.invuln = 0
    state.hull = 1
    state.enemies.push(enemy({ x: state.playerX, y: state.playerY, radius: 20, hp: 8 }))
    const fatal = step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(fatal.died, true)
    assert.equal(state.phase, 'dead')
    const x = state.playerX
    run(state, input({ moveX: 1 }), 1)
    assert.equal(state.playerX, x)
  })
})

describe('orbs', () => {
  it('drops a richer orb from a healthier shape', () => {
    const state = createGame(0, 31)
    state.spawnCd = 999
    state.xpNeed = 9999
    state.enemies.push(enemy({ x: 220, y: 0, kind: 1, hp: 200, speed: 0, radius: 16 }))
    state.enemies.push(enemy({ x: 320, y: 0, kind: 2, hp: 300, speed: 0, radius: 14, generation: 2 }))
    run(state, input({ aimX: 900, aimY: 0 }), 3)
    const square = state.orbs.find((item) => item.value === 2)
    const circle = state.orbs.find((item) => item.value === 3)
    assert.ok(square)
    assert.ok(circle)
    assert.ok(circle.radius > square.radius)
    assert.equal(square.color, '#7dff9a')
    assert.equal(circle.color, '#ffe14a')
    assert.notEqual(circle.color, square.color)
  })

  it('pulls a nearby orb into the bar and ignores one out of range', () => {
    const state = createGame(0, 32)
    state.spawnCd = 999
    state.orbs.push(orb({ x: 70, value: 1 }))
    state.orbs.push(orb({ x: 420, value: 4 }))
    run(state, input({ aimActive: false }), 1)
    assert.equal(state.xp, 1)
    assert.equal(state.orbs.length, 1)
    assert.equal(state.orbs[0]?.x, 420)
    assert.equal(state.orbs[0]?.homing, false)
  })

  it('asks for more experience on every level', () => {
    const first = xpNeedFor(1)
    const second = xpNeedFor(2)
    const third = xpNeedFor(3)
    assert.ok(first <= 10)
    assert.ok(second > first)
    assert.ok(third > second)
    assert.ok(third < first * 3)
    assert.ok(xpNeedFor(10) < xpNeedFor(6) * 2.4)
  })

  it('sends thicker waves as the run goes on', () => {
    const early = createGame(0, 11)
    early.spawnCd = 0
    early.fireCd = 10
    step(early, input({ viewRadius: 400, aimActive: false }), 1 / 60)
    const late = createGame(0, 11)
    late.time = 70
    late.level = 8
    late.spawnCd = 0
    late.fireCd = 10
    step(late, input({ viewRadius: 400, aimActive: false }), 1 / 60)
    assert.ok(late.enemies.length > early.enemies.length)
    assert.ok(late.spawnCd < early.spawnCd)
  })

  it('hardens late shapes and throws hex pieces that cannot break', () => {
    const state = createGame(0, 23)
    state.fireCd = 10
    state.time = 56
    state.level = 8
    const best = [0, 0, 0, 0]
    const pace = [0, 0, 0, 0]
    const size = [0, 0, 0, 0]
    const giant = [0, 0, 0, 0]
    const plain = [0, 0, 0, 0]
    for (let n = 0; n < 100; n++) {
      state.spawnCd = 0
      state.enemies.length = 0
      step(state, input({ viewRadius: 400, aimActive: false }), 1 / 60)
      for (const hostile of state.enemies) {
        if (hostile.ballistic) continue
        best[hostile.kind] = Math.max(best[hostile.kind] ?? 0, hostile.hp)
        pace[hostile.kind] = Math.max(pace[hostile.kind] ?? 0, hostile.speed)
        size[hostile.kind] = Math.max(size[hostile.kind] ?? 0, hostile.radius)
        const huge = hostile.radius > [18, 28, 24, 40][hostile.kind]
        if (huge) giant[hostile.kind] += 1
        else plain[hostile.kind] += 1
      }
    }
    assert.ok((best[1] ?? 0) >= 1000)
    assert.ok((best[2] ?? 0) >= 750)
    assert.ok((best[0] ?? 0) >= 250)
    assert.ok((pace[0] ?? 0) > 110)
    assert.ok((size[2] ?? 0) > 30)
    assert.ok((giant[0] ?? 0) > 0)
    assert.ok((giant[1] ?? 0) > 0)
    assert.ok((giant[0] ?? 0) < (plain[0] ?? 0) / 4)
    assert.ok((giant[1] ?? 0) < (plain[1] ?? 0) / 4)

    state.spawnCd = 999
    state.fireCd = 0
    state.enemies.length = 0
    state.bullets.length = 0
    const originX = TUNING.muzzle
    state.enemies.push(enemy({ x: originX, y: 0, kind: 3, hp: 1, radius: 28, speed: 0 }))
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.enemies.some((hostile) => hostile.ballistic), false)

    state.fireCd = 0
    state.enemies.length = 0
    state.bullets.length = 0
    state.enemies.push(enemy({ x: 360, y: 0, kind: 3, hp: 1, radius: 54, speed: 0, angle: -Math.PI / 2 }))
    let bits = state.enemies.filter((hostile) => hostile.ballistic && hostile.kind === 3)
    let blinked = 0
    for (let i = 0; i < 200 && bits.length < 6; i++) {
      step(state, input({ aimX: 400, aimY: 0 }), 1 / 60)
      const body = state.enemies.find((hostile) => hostile.kind === 3 && !hostile.ballistic)
      if (body?.immortal && body.flash > 0) blinked += 1
      bits = state.enemies.filter((hostile) => hostile.ballistic && hostile.kind === 3)
    }
    assert.ok(blinked >= 8)
    assert.equal(bits.length, 6)
    const angles = bits
      .map((hostile) => Math.atan2(hostile.vy, hostile.vx))
      .sort((a, b) => a - b)
    for (let i = 0; i < angles.length; i++) {
      const a = angles[i] ?? 0
      const b = angles[(i + 1) % angles.length] ?? 0
      const gap = Math.atan2(Math.sin(b - a), Math.cos(b - a))
      assert.ok(Math.abs(Math.abs(gap) - Math.PI / 3) < 0.08)
      const piece = bits[i]
      assert.ok(piece)
      assert.equal(piece.immortal, true)
      assert.ok(piece.speed < 250)
      assert.ok(piece.speed * piece.orbitCd > 480)
      assert.ok(piece.speed * piece.orbitCd < 700)
      assert.equal(piece.phase, 54)
    }
    const chip = bits[0]
    assert.ok(chip)
    chip.x = 240
    chip.y = 0
    chip.vx = 0
    chip.vy = 0
    chip.hitCd = 0
    state.enemies.splice(0, state.enemies.length, chip)
    state.bullets.length = 0
    state.fireCd = 0
    step(state, input(), 1 / 60)
    assert.equal(chip.hp, 1)
    assert.equal(state.enemies.includes(chip), true)
    chip.orbitCd = 0.01
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.enemies.includes(chip), false)
  })

  it('offers any three upgrades that are still available', () => {
    const state = createGame(0, 90)
    state.spawnCd = 999
    state.fireCd = 10
    const seen = new Set<string>()
    for (let n = 0; n < 36; n++) {
      state.phase = 'play'
      state.xp = state.xpNeed
      step(state, input({ aimActive: false }), 1 / 60)
      assert.equal(state.offers.length, 3)
      assert.equal(new Set(state.offers.map((offer) => offer.id)).size, 3)
      for (const offer of state.offers) seen.add(offer.id)
      state.xp = 0
    }
    assert.ok(seen.has('pulse') || seen.has('magnet') || seen.has('regen') || seen.has('greed'))
    assert.ok(seen.has('orbiter') || seen.has('field') || seen.has('ball') || seen.has('drone'))
    assert.ok(seen.size >= 8)
    state.mods.pulse = 5
    state.phase = 'play'
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.offers.some((offer) => offer.id === 'pulse'), false)
  })

  it('always offers Tesla Coil, then Arc Reactor at the last rank', () => {
    const state = createGame(0, 5)
    state.spawnCd = 999
    state.fireCd = 10
    for (let n = 0; n < 4; n++) {
      state.phase = 'play'
      state.xp = state.xpNeed
      step(state, input({ aimActive: false }), 1 / 60)
      const card = state.offers.find((offer) => offer.id === 'tesla')
      assert.ok(card)
      assert.equal(card.title, 'Tesla Coil')
      assert.match(card.detail, /one (lightning )?bolt/i)
      assert.equal(teslaBolts(n + 1, false), 1)
      chooseUpgrade(state, state.offers.indexOf(card))
    }
    assert.equal(state.mods.tesla, 4)
    state.phase = 'play'
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    const evolved = state.offers.find((offer) => offer.id === 'tesla')
    assert.ok(evolved)
    assert.equal(evolved.title, 'Arc Reactor')
    assert.match(evolved.detail, /one red bolt/i)
    assert.match(evolved.detail, /chain-arcs/i)
    assert.equal(evolved.overdrive, true)
    chooseUpgrade(state, state.offers.indexOf(evolved))
    assert.equal(state.mods.tesla, 5)
    assert.equal(arcReactor(state.mods.tesla), true)
    state.phase = 'play'
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.offers.some((offer) => offer.id === 'tesla'), false)
    assert.equal(teslaBolts(4, false), 1)
    assert.equal(teslaBolts(5, true), 1)
    assert.ok(teslaDamage(4, false) > teslaDamage(1, false))
    assert.ok(teslaDamage(5, true) > teslaDamage(4, false))
    assert.ok(teslaInterval(1, false) > 1.6)
    assert.ok(teslaInterval(4, false) < teslaInterval(1, false))
    assert.ok(teslaInterval(5, true) < teslaInterval(4, false))
  })

  it('drops lightning on a hostile and chain-arcs Arc Reactor', () => {
    const state = createGame(0, 8)
    state.spawnCd = 999
    state.fireCd = 10
    state.mods.tesla = 1
    state.teslaCd = 0
    const foe = enemy({ x: 220, y: 30, hp: 500, radius: 16, speed: 0 })
    state.enemies.push(foe)
    step(state, input({ aimActive: false }), 1 / 60)
    assert.ok(foe.hp < 500)
    assert.ok(state.dealt.tesla > 0)
    assert.equal(state.bolts.length, 1)
    const sky = state.bolts[0]?.strike.pts
    const widths = state.bolts[0]?.strike.half ?? []
    assert.ok(sky && sky.length >= 8)
    assert.ok(Math.abs((sky[0]?.y ?? 0) - (state.playerY - 720 / 2)) < 12)
    assert.ok((sky[sky.length - 1]?.y ?? 0) > (sky[0]?.y ?? 0))
    assert.ok(Math.max(...widths) > Math.min(...widths) * 2)
    assert.ok(strikeDrift(sky) > 24)
    assert.ok((state.bolts[0]?.splinters.length ?? 0) >= 3)
    assert.ok((state.bolts[0]?.bursts.length ?? 0) >= 7)
    assert.ok((state.bolts[0]?.shards.length ?? 0) >= 8)
    const cameraTop = state.playerY - 400
    const lifted = placeStrikeTop(sky, cameraTop)
    assert.equal(lifted[0]?.y, cameraTop - BOLT_SKY_PAD)
    assert.equal(lifted[lifted.length - 1]?.y, sky[sky.length - 1]?.y)
    const born = state.bolts[0]?.shards[0]
    assert.ok(born)
    const speed = Math.hypot(born.vx, born.vy)
    const bornX = born.x
    const bornY = born.y
    step(state, input({ aimActive: false, moveY: -1 }), 0.1)
    const flown = state.bolts[0]?.shards[0]
    assert.ok(flown)
    assert.ok(Math.hypot(flown.x - bornX, flown.y - bornY) > 8)
    assert.ok(Math.hypot(flown.vx, flown.vy) < speed)

    const single = createGame(0, 3)
    single.spawnCd = 999
    single.fireCd = 10
    single.mods.tesla = 4
    single.teslaCd = 0
    single.enemies.push(
      enemy({ x: 80, y: 20, hp: 900, radius: 16, speed: 0 }),
      enemy({ x: 160, y: -30, hp: 900, radius: 16, speed: 0 }),
      enemy({ x: -40, y: 50, hp: 900, radius: 16, speed: 0 }),
    )
    step(single, input({ aimActive: false }), 1 / 60)
    assert.equal(single.bolts.length, 1)

    const reactor = createGame(0, 9)
    reactor.spawnCd = 999
    reactor.fireCd = 10
    reactor.mods.tesla = 5
    reactor.teslaCd = 0
    const near = enemy({ x: 180, y: 0, hp: 900, radius: 18, speed: 0 })
    const beside = enemy({ x: 250, y: 16, hp: 900, radius: 18, speed: 0 })
    const third = enemy({ x: 140, y: 36, hp: 900, radius: 18, speed: 0 })
    const fourth = enemy({ x: 300, y: -24, hp: 900, radius: 18, speed: 0 })
    reactor.enemies.push(near, beside, third, fourth)
    step(reactor, input({ aimActive: false }), 1 / 60)
    assert.equal(reactor.bolts.length, 1)
    assert.ok(near.hp < 900)
    assert.ok(beside.hp < 900)
    assert.ok(
      reactor.bolts.some((bolt) =>
        bolt.arcs.some((arc) => {
          const ys = arc.pts.map((point) => point.y)
          const top = Math.max(...ys)
          const bottom = Math.min(...ys)
          return top - bottom < 180
        }),
      ),
    )
  })

  it('strikes only enemies inside the camera', () => {
    const state = createGame(0, 4)
    state.spawnCd = 999
    state.fireCd = 10
    state.mods.tesla = 1
    state.teslaCd = 0
    const seen = enemy({ x: 180, y: 40, hp: 500, radius: 16, speed: 0 })
    const hidden = enemy({ x: 1400, y: 40, hp: 500, radius: 16, speed: 0 })
    state.enemies.push(seen, hidden)
    step(state, input({ aimActive: false }), 1 / 60)
    assert.ok(seen.hp < 500)
    assert.equal(hidden.hp, 500)
    assert.ok(state.bolts.every((bolt) => Math.hypot(bolt.x - hidden.x, bolt.y - hidden.y) > 40))
  })

  it('leans toward a tougher hostile without always striking it', () => {
    let strongHits = 0
    const trials = 80
    for (let n = 0; n < trials; n++) {
      const state = createGame(0, n + 1)
      state.spawnCd = 999
      state.fireCd = 10
      state.mods.tesla = 1
      state.teslaCd = 0
      const strong = enemy({ x: 90, y: -10, hp: 8000, maxHp: 1200, radius: 28, speed: 0 })
      state.enemies.push(
        enemy({ x: -80, y: 20, hp: 8000, maxHp: 120, radius: 12, speed: 0 }),
        strong,
      )
      step(state, input({ aimActive: false }), 1 / 60)
      if (state.bolts.some((bolt) => Math.hypot(bolt.x - strong.x, bolt.y - strong.y) < 4)) strongHits += 1
    }
    assert.ok(strongHits > trials * 0.55)
    assert.ok(strongHits < trials)
  })

  it('opens three upgrades when the bar fills and freezes the pit', () => {
    const state = createGame(0, 42)
    state.spawnCd = 999
    assert.equal(state.xpNeed, xpNeedFor(1))
    state.fireCd = 10
    state.orbs.push(orb({ value: state.xpNeed }))
    const events = step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(events.pickups, 1)
    assert.equal(events.leveled, true)
    assert.equal(state.phase, 'level')
    assert.equal(state.level, 2)
    assert.equal(state.offers.length, 3)
    assert.equal(new Set(state.offers.map((offer) => offer.id)).size, 3)
    const chosen = state.offers[0]
    assert.ok(chosen)
    const x = state.playerX
    step(state, input({ moveX: 1 }), 0.4)
    assert.equal(state.playerX, x)
    assert.equal(state.bullets.length, 0)
    chooseUpgrade(state, 0)
    if (chosen.id === 'cache') assert.equal(state.score, 40)
    else assert.equal(state.mods[chosen.id], 1)
    assert.equal(state.phase, 'play')
  })

  it('adds a disc on every Orbiter rank', () => {
    const state = createGame(0, 11)
    state.spawnCd = 999
    state.fireCd = 10
    for (let n = 0; n < 6; n++) {
      const offer = takeOffer(state, 'orbiter')
      assert.equal(offer.title, n === 5 ? "Guardian's Halo" : 'Sentinel')
      assert.equal(offer.overdrive, n === 5)
      chooseUpgrade(state, state.offers.indexOf(offer))
      state.orbitTime = 0.8
      assert.equal(orbitDiscs(state).length, orbiterCount(n + 1))
      assert.ok(orbitDiscs(state).length <= 6)
    }
    assert.equal(state.mods.orbiter, 6)
    assert.equal(orbitDiscs(state).length, 6)
    assert.equal(orbitDiscs(state).every((disc) => disc.halo), true)
    assert.ok(discRadius(6) > discRadius(5) * 1.15)
    assert.ok(discOrbit(6) > discOrbit(5) * 1.15)
    assert.ok(discRadius(5) > DISC.radius)
    assert.ok(discOrbit(5) > DISC.orbit)
    const haloDisc = orbitDiscs(state)[0]
    assert.ok(haloDisc)
    assert.ok(Math.hypot(haloDisc.x - state.playerX, haloDisc.y - state.playerY) > DISC.orbit * 1.3)
    state.orbitTime = DISC.active + DISC.recharge + 3
    assert.equal(orbitDiscs(state).length, 6)
    assert.ok(discTurn(6) > discTurn(5))
    assert.ok(orbiterShove(6) > orbiterShove(5))
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.offers.length, 3)
    assert.equal(state.offers.some((offer) => offer.id === 'orbiter'), false)
  })

  it('ricochets, pierces, and splits a Bouncy Ball', () => {
    const state = createGame(0, 5)
    state.spawnCd = 999
    state.fireCd = 10
    for (let n = 0; n < 6; n++) {
      const offer = takeOffer(state, 'ball')
      assert.equal(offer.title, n === 5 ? 'Quantum Core' : 'Bouncy Ball')
      assert.equal(offer.overdrive, n === 5)
      chooseUpgrade(state, state.offers.indexOf(offer))
    }
    assert.equal(state.mods.ball, 6)
    assert.equal(ballCount(1), 1)
    assert.equal(ballCount(4), 2)
    assert.equal(ballCount(5), 3)
    assert.equal(ballCount(6), 2)
    assert.equal(ballSpeed(1), ballSpeed(5))
    assert.ok(ballSpeed(1) > 500)
    assert.ok(ballSpeed(6) > ballSpeed(1))
    assert.equal(ballLife(1), 4.6)
    assert.equal(ballLife(6), 5.6)
    assert.ok(ballInterval(6) < ballInterval(1))
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.offers.some((offer) => offer.id === 'ball'), false)

    const pierce = createGame(0, 6)
    pierce.spawnCd = 999
    pierce.fireCd = 10
    pierce.invuln = 5
    pierce.balls.push({
      x: 0,
      y: 0,
      vx: 900,
      vy: 0,
      life: 3,
      max: 3,
      radius: 10,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 2.2,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    })
    const first = enemy({ x: 40, y: 0, hp: 200, radius: 18, kind: 1 })
    pierce.enemies.push(first)
    const pebble = pierce.balls[0]
    assert.ok(pebble)
    run(pierce, input({ aimActive: false }), 0.3)
    assert.ok(first.hp < 200)
    assert.ok(pebble.vx > 0)
    assert.ok(pebble.x > first.x)
    assert.equal(pebble.flex, 0)
    assert.ok(pierce.balls.some((ball) => !ball.echo))

    const stuck = createGame(0, 7)
    stuck.spawnCd = 999
    stuck.fireCd = 10
    stuck.invuln = 5
    const sitting = enemy({ x: 0, y: 0, hp: 200, radius: 20, kind: 1, speed: 0 })
    stuck.enemies.push(sitting)
    stuck.balls.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 2,
      max: 2,
      radius: 10,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 2.2,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    })
    step(stuck, input({ aimActive: false }), 1 / 60)
    step(stuck, input({ aimActive: false }), 1 / 60)
    assert.equal(sitting.hp, 180)

    const wall = createGame(0, 8)
    wall.spawnCd = 999
    wall.fireCd = 10
    const shot = {
      x: wall.playerX + 640 - 14,
      y: wall.playerY,
      vx: 900,
      vy: 0,
      life: 2,
      max: 2,
      radius: 10,
      damage: 40,
      echo: false,
      quantum: true,
      knock: 8,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    }
    wall.balls.push(shot)
    step(wall, input({ aimActive: false, viewW: 1280, viewH: 720 }), 1 / 60)
    assert.ok(shot.vx < 0)
    assert.equal(shot.flex, 1)
    assert.ok(Math.cos(shot.flexAngle) < -0.9)
    assert.ok(shot.spin !== 0)
    assert.equal(wall.balls.filter((ball) => ball.echo).length, 0)

    const split = createGame(0, 9)
    split.spawnCd = 999
    split.fireCd = 10
    split.invuln = 5
    split.enemies.push(enemy({ x: 0, y: 0, hp: 500, radius: 20, kind: 1, speed: 0 }))
    split.balls.push({
      x: 0,
      y: 0,
      vx: 40,
      vy: 0,
      life: 2,
      max: 2,
      radius: 10,
      damage: 40,
      echo: false,
      quantum: true,
      knock: 8,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    })
    step(split, input({ aimActive: false }), 1 / 60)
    const echoes = split.balls.filter((ball) => ball.echo)
    assert.equal(split.balls.filter((ball) => !ball.echo).length, 0)
    assert.equal(echoes.length, 2)
    assert.ok(echoes.every((ball) => ball.vx > 0))
    assert.equal(echoes[0]?.damage, Math.round(40 * 0.45))
    assert.equal(echoes[0]?.max, 2)
    assert.equal(echoes[0]?.life, 2)
    assert.ok((echoes[0]?.radius ?? 99) < 10)
    assert.equal(ballDamage(6), 36)

    const tank = createGame(0, 10)
    tank.spawnCd = 999
    tank.fireCd = 10
    tank.invuln = 5
    const brute = enemy({ x: 30, y: 0, hp: 1000, radius: 22, kind: 3, speed: 0 })
    tank.enemies.push(brute)
    const incoming = {
      x: 0,
      y: 0,
      vx: 240,
      vy: 0,
      life: 2,
      max: 2,
      radius: 12,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 2.2,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    }
    tank.balls.push(incoming)
    step(tank, input({ aimActive: false }), 1 / 60)
    assert.ok(incoming.vx < 0)
    assert.ok(brute.hp < 1000)
    assert.ok(incoming.x < brute.x)

    const blob = createGame(0, 12)
    blob.spawnCd = 999
    blob.fireCd = 10
    blob.invuln = 5
    const giant = enemy({ x: 40, y: 0, hp: 80, maxHp: 750, radius: 36, kind: 2, speed: 0 })
    const plain = enemy({ x: 40, y: 80, hp: 300, maxHp: 300, radius: 14, kind: 2, speed: 0 })
    blob.enemies.push(giant, plain)
    const offGiant = {
      x: 0,
      y: 0,
      vx: 240,
      vy: 0,
      life: 2,
      max: 2,
      radius: 12,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 2.2,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    }
    blob.balls.push(offGiant)
    step(blob, input({ aimActive: false }), 1 / 60)
    assert.ok(offGiant.vx < 0)
    assert.ok(giant.hp < 80)
    assert.equal(plain.hp, 300)

    const chipped = createGame(0, 11)
    chipped.spawnCd = 999
    chipped.fireCd = 10
    chipped.invuln = 5
    const wounded = enemy({ x: 36, y: 0, hp: 80, maxHp: 1200, radius: 22, kind: 1, speed: 0 })
    chipped.enemies.push(wounded)
    const again = {
      x: 0,
      y: 0,
      vx: 240,
      vy: 0,
      life: 2,
      max: 2,
      radius: 12,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 2.2,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    }
    chipped.balls.push(again)
    step(chipped, input({ aimActive: false }), 1 / 60)
    assert.ok(again.vx < 0)
    assert.ok(again.x < wounded.x)
    assert.ok(wounded.hp < 80)
  })

  it('burns and slows inside a wider Force Field ring', () => {
    const state = createGame(0, 3)
    state.spawnCd = 999
    state.fireCd = 10
    for (let n = 0; n < 6; n++) {
      const offer = takeOffer(state, 'field')
      assert.equal(offer.title, n === 5 ? 'Null Zone' : 'Force Field')
      assert.equal(offer.overdrive, n === 5)
      chooseUpgrade(state, state.offers.indexOf(offer))
    }
    assert.equal(state.mods.field, 6)
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.offers.some((offer) => offer.id === 'field'), false)
    assert.ok(fieldRadius(2) > fieldRadius(1) * 1.3)
    assert.ok(fieldRadius(5) > fieldRadius(1) * 2.5)
    assert.ok(Math.abs(fieldRadius(5) / ((128 + 4 * 64) * BODY * 0.8) - 1) < 0.001)
    assert.ok(fieldRadius(6) > fieldRadius(5))
    assert.equal(fieldDamage(1), 6)
    assert.ok(fieldDamage(5) > fieldDamage(1))
    assert.ok(fieldDamage(5) < 6 + 4 * 3)
    assert.ok(fieldDamage(6) > fieldDamage(5))
    assert.ok(fieldSlow(5) < fieldSlow(1))
    assert.ok(fieldSlow(1) > 0.76)
    assert.ok(fieldSlow(6) < fieldSlow(5))
    assert.equal(fieldColor(5), '#ffffff')
    assert.equal(fieldColor(6), '#ff2d3a')
    assert.ok(fieldRipple(5) < fieldRipple(1))
    assert.ok(fieldRipple(1) < 0.5)

    const burn = createGame(0, 4)
    burn.spawnCd = 999
    burn.fireCd = 10
    burn.invuln = 5
    burn.mods.field = 1
    const inside = enemy({ x: 20, y: 0, hp: 400, speed: 180, vx: -180, radius: 10 })
    const far = enemy({ x: 700, y: 40, hp: 400, speed: 180, vx: -180, radius: 10 })
    burn.enemies.push(inside, far)
    run(burn, input({ aimActive: false }), 0.7)
    const ticks = Math.floor(burn.time / FIELD.tick)
    assert.ok(FIELD.tick < 0.35)
    assert.ok(fieldDamage(1) < 10)
    assert.ok(ticks >= 2)
    assert.equal(inside.hp, 400 - ticks * fieldDamage(1))
    assert.equal(far.hp, 400)
    assert.ok(Math.hypot(inside.vx, inside.vy) < Math.hypot(far.vx, far.vy) * 0.9)
    assert.ok(burn.floaters.some((floater) => floater.text === String(fieldDamage(1)) && floater.color === '#ffffff'))
  })

  it('lets the discs bite, then hides them while they recharge', () => {
    const state = createGame(0, 12)
    state.spawnCd = 999
    state.fireCd = 10
    state.invuln = 5
    state.mods.orbiter = 1
    state.orbitTime = 0.8
    state.time = 0.5
    const live = orbitDiscs(state)
    assert.equal(live.length, 2)
    const disc = live[0]
    assert.ok(disc)
    const facing = Math.atan2(disc.y - state.playerY, disc.x - state.playerX)
    const drift = Math.atan2(Math.sin(disc.spin - facing * discTurn(1)), Math.cos(disc.spin - facing * discTurn(1)))
    assert.ok(Math.abs(drift) < 1e-6)
    assert.ok(DISC.turn > 1)
    state.enemies.push(enemy({ x: 0, y: 0, radius: 240, hp: HIT, speed: 0, kind: 0 }))
    step(state, input({ aimActive: false }), 1 / 60)
    const bitten = state.enemies[0]
    assert.ok(bitten)
    assert.equal(bitten.hp, HIT - orbiterDamage(1))
    assert.ok(orbiterDamage(1) > 40)
    assert.ok(orbiterDamage(1) < HIT)
    assert.ok(orbiterDamage(6) > orbiterDamage(5) + 15)
    assert.ok(state.floaters.some((floater) => floater.text === String(orbiterDamage(1))))
    assert.equal(state.floaters.some((floater) => floater.text.startsWith('+')), false)
    assert.ok(orbitActive(2) > orbitActive(1))
    assert.ok(orbitRate(2) > orbitRate(1))
    const held = createGame(0, 18)
    held.mods.orbiter = 2
    held.time = 0.4
    held.orbitTime = orbitActive(1) + 0.12
    assert.ok(orbitDiscs(held).length >= 3)

    const quiet = createGame(0, 13)
    quiet.spawnCd = 999
    quiet.fireCd = 10
    quiet.invuln = 5
    quiet.mods.orbiter = 1
    quiet.orbitTime = DISC.active + 0.4
    assert.equal(orbitDiscs(quiet).length, 0)
    quiet.enemies.push(enemy({ x: 0, y: 0, radius: 240, hp: 8, speed: 0 }))
    step(quiet, input({ aimActive: false }), 1 / 60)
    assert.equal(quiet.enemies[0]?.hp, 8)
  })

  it('nudges a hostile off a disc, a little harder at each rank', () => {
    const bump = (rank: number) => {
      const state = createGame(0, 4)
      state.spawnCd = 999
      state.fireCd = 10
      state.invuln = 5
      state.mods.orbiter = rank
      state.orbitTime = 0.8
      const disc = orbitDiscs(state)[0]
      assert.ok(disc)
      const hostile = enemy({ x: disc.x, y: disc.y, radius: 10, hp: HIT * 3, speed: 0, kind: 1 })
      state.enemies.push(hostile)
      step(state, input({ aimActive: false }), 1 / 60)
      return Math.hypot(hostile.x - disc.x, hostile.y - disc.y)
    }
    const low = bump(1)
    const high = bump(6)
    assert.ok(Math.abs(low - orbiterShove(1)) < 0.05)
    assert.ok(high > low)
    assert.ok(orbiterShove(6) > orbiterShove(5))
    assert.ok(orbiterShove(6) < 8)
  })

  it('lets a hostile walk through the discs', () => {
    for (const rank of [1, 6]) {
      const state = createGame(0, 8)
      state.spawnCd = 999
      state.fireCd = 10
      state.invuln = 30
      state.mods.orbiter = rank
      state.orbitTime = 0.6
      const hostile = enemy({
        x: state.playerX + DISC.orbit + 90,
        y: state.playerY,
        hp: 8000,
        speed: 66,
        radius: 22 * BODY,
        kind: 1,
      })
      state.enemies.push(hostile)
      run(state, input({ aimActive: false }), 3)
      const dist = Math.hypot(hostile.x - state.playerX, hostile.y - state.playerY)
      assert.ok(dist < DISC.orbit, `rank ${rank} held the hostile at ${dist}`)
    }
  })

  it('never offers Reach', () => {
    const state = createGame(0, 9)
    state.spawnCd = 999
    state.fireCd = 10
    const titles = new Set<string>()
    for (let n = 0; n < 16; n++) {
      state.xp = state.xpNeed
      step(state, input({ aimActive: false }), 1 / 60)
      assert.equal(state.phase, 'level')
      for (const offer of state.offers) titles.add(offer.title)
      chooseUpgrade(state, 0)
    }
    assert.equal(titles.has('Reach'), false)
    assert.ok(titles.size >= 3)
  })

  it('queues another choice when one orb covers two levels', () => {
    const state = createGame(0, 43)
    state.spawnCd = 999
    state.orbs.push(orb({ value: 70 }))
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.phase, 'level')
    assert.equal(state.level, 2)
    chooseUpgrade(state, 0)
    assert.equal(state.phase, 'level')
    assert.equal(state.level, 3)
    assert.equal(state.offers.length, 3)
  })

  it('paints a collision burst when a round hits', () => {
    const state = createGame(0, 44)
    state.spawnCd = 999
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, kind: 1, hp: HIT * 2, radius: 22 }))
    step(state, input(), 1 / 60)
    assert.ok(state.impacts.length >= 1)
    assert.equal(state.enemies.length, 1)
    assert.equal(state.enemies[0]?.hp, HIT)
  })

  it('offers Drone, then Bulletstorm at rank 5, and shells only burst when they land', () => {
    const state = createGame(0, 46)
    state.spawnCd = 999
    state.fireCd = 10
    for (let n = 0; n < 5; n++) {
      const offer = takeOffer(state, 'drone')
      assert.equal(offer.title, n === 4 ? 'Bulletstorm' : 'Drone')
      assert.equal(offer.overdrive, n === 4)
      chooseUpgrade(state, state.offers.indexOf(offer))
    }
    assert.equal(state.mods.drone, 5)
    assert.equal(droneStorm(4), false)
    assert.equal(droneStorm(5), true)
    assert.ok(droneBurst(4) > droneBurst(1))
    assert.ok(droneBurst(1) > 2)
    assert.ok(droneReload(1) > 1)
    assert.ok(droneReload(1) < 1.4)
    assert.ok(droneReload(4) < droneReload(1))
    assert.ok(droneReload(5) < 0.6)
    assert.ok(droneInterval(4) < droneInterval(1))
    assert.ok(droneInterval(5) < droneInterval(4))
    assert.ok(droneInterval(1) > 0.28)
    assert.ok(droneInterval(1) < 0.36)
    assert.ok(droneInterval(1) - droneInterval(5) < 0.12)
    assert.equal(droneVolley(1), 2)
    assert.ok(droneVolley(5) > droneVolley(4))
    assert.ok(droneVolley(4) > droneVolley(1))
    assert.ok(droneBlast(4) > droneBlast(1))
    assert.ok(droneBlast(5) > droneBlast(4))
    assert.ok(droneDamage(1) > 0)
    assert.ok(droneDamage(1) < 11)
    assert.ok(droneDamage(5) > droneDamage(4))
    assert.ok(droneDamage(5) < droneDamage(1) + 12)

    const lob = createGame(0, 47)
    lob.spawnCd = 999
    lob.fireCd = 10
    lob.invuln = 5
    lob.mods.drone = 1
    lob.droneCd = 0
    lob.droneReload = 0
    lob.droneBurst = 0
    lob.enemies.push(enemy({ x: 220, y: 0, hp: 800, radius: 70, speed: 0 }))
    step(lob, input({ aimActive: false }), 1 / 60)
    assert.equal(lob.reticleOn, true)
    assert.equal(lob.reticleX, 220)
    assert.equal(lob.enemies[0]?.hp, 800)
    assert.equal(lob.mortars.length, 0)
    let turned = 0
    while (lob.mortars.length < 1 && turned < 90) {
      step(lob, input({ aimActive: false }), 1 / 60)
      turned += 1
    }
    assert.ok(lob.mortars.length >= 1)
    const aim = Math.atan2(lob.reticleY - lob.droneY, lob.reticleX - lob.droneX)
    const gap = Math.atan2(Math.sin(aim - lob.droneFace), Math.cos(aim - lob.droneFace))
    assert.ok(Math.abs(gap) < 0.16)
    const first = lob.mortars[0]
    assert.ok(first)
    const lockedX = lob.reticleX
    const markX = first.tx
    const markY = first.ty
    if (lob.enemies[0]) lob.enemies[0].x = 40
    lob.playerX += 36
    step(lob, input({ aimActive: false }), 1 / 60)
    assert.equal(lob.reticleX, lockedX)
    assert.equal(first.tx, markX)
    assert.equal(first.ty, markY)
    assert.ok(Math.hypot(first.sx - lob.droneX, first.sy - lob.droneY) > 8)
    assert.ok(Math.hypot(first.tx - lockedX, first.ty - lob.reticleY) < 230)
    if (lob.enemies[0]) {
      lob.enemies[0].x = markX
      lob.enemies[0].y = markY
    }
    const hits = (shell: { tx: number; ty: number; radius: number }) => {
      const foe = lob.enemies[0]
      if (!foe) return false
      const dx = foe.x - shell.tx
      const dy = foe.y - shell.ty
      const reach = shell.radius + foe.radius
      return dx * dx + dy * dy <= reach * reach
    }
    let guard = 0
    while (guard < 180) {
      const soonest = lob.mortars.filter(hits).reduce((best, shell) => Math.min(best, shell.flight - shell.age), Infinity)
      if (soonest <= 1 / 60) break
      step(lob, input({ aimActive: false }), 1 / 60)
      guard += 1
    }
    assert.equal(lob.enemies[0]?.hp, 800)
    const landing = lob.mortars.filter(hits).reduce((soon, shell) => (shell.flight - shell.age < soon.flight - soon.age ? shell : soon))
    step(lob, input({ aimActive: false }), 0.2)
    assert.ok((lob.enemies[0]?.hp ?? 800) < 800)
    assert.equal(lob.mortars.includes(landing), false)

    const rich = createGame(0, 49)
    rich.spawnCd = 999
    rich.fireCd = 10
    rich.invuln = 5
    rich.mods.drone = 1
    rich.droneReload = 0
    rich.enemies.push(
      enemy({ x: 260, y: 0, hp: 400, radius: 16, speed: 0 }),
      enemy({ x: -180, y: 0, hp: 180, radius: 16, speed: 0 }),
      enemy({ x: -150, y: 24, hp: 180, radius: 16, speed: 0 }),
      enemy({ x: -200, y: -20, hp: 180, radius: 16, speed: 0 }),
    )
    step(rich, input({ aimActive: false }), 1 / 60)
    assert.ok(rich.reticleX < 0)

    const ahead = createGame(0, 50)
    ahead.spawnCd = 999
    ahead.fireCd = 10
    ahead.invuln = 5
    ahead.mods.drone = 1
    ahead.droneReload = 0
    ahead.enemies.push(enemy({ x: 220, y: 0, hp: 500, radius: 16, speed: 90, vx: -110, vy: 0 }))
    step(ahead, input({ aimActive: false }), 1 / 60)
    assert.ok(ahead.reticleX < 180)
    assert.ok(ahead.reticleX > 90)

    const round = createGame(0, 54)
    round.spawnCd = 999
    round.fireCd = 10
    round.invuln = 5
    round.mods.drone = 1
    round.droneReload = 0
    round.droneBurst = 0.6
    round.droneCd = 0.02
    round.reticleOn = true
    round.reticleX = round.droneX + 180
    round.reticleY = round.droneY
    round.droneFace = 0
    const started = round.mortars.length
    for (let n = 0; n < 20; n++) step(round, input({ aimActive: false }), 1 / 60)
    assert.ok(round.mortars.length > started)
    assert.equal(round.droneReload, 0)
    assert.ok(round.droneBurst > 0.2)

    const shift = createGame(0, 56)
    shift.spawnCd = 999
    shift.fireCd = 10
    shift.invuln = 5
    shift.mods.drone = 5
    shift.droneReload = 0
    shift.droneBurst = 3
    shift.droneCd = 0.02
    shift.droneAreaCd = 1
    shift.reticleOn = true
    shift.reticleX = shift.droneX + 200
    shift.reticleY = shift.droneY
    shift.droneFace = 0
    shift.enemies.push(
      enemy({ x: shift.reticleX, y: shift.reticleY, hp: 40, radius: 16, speed: 0 }),
      enemy({ x: shift.droneX, y: shift.droneY - 220, hp: 900, radius: 16, speed: 0 }),
    )
    for (let n = 0; n < 30; n++) step(shift, input({ aimActive: false }), 1 / 60)
    assert.ok(shift.reticleX > shift.droneX + 80)
    for (let n = 0; n < 50; n++) step(shift, input({ aimActive: false }), 1 / 60)
    assert.ok(shift.reticleY < shift.droneY - 40)

    const moving = createGame(0, 58)
    moving.spawnCd = 999
    moving.fireCd = 10
    moving.invuln = 5
    moving.mods.drone = 5
    moving.droneReload = 0
    moving.droneBurst = 4
    moving.droneCd = 0
    moving.droneAreaCd = 1
    moving.reticleOn = true
    moving.reticleX = moving.droneX + 180
    moving.reticleY = moving.droneY
    moving.droneFace = 0
    moving.enemies.push(
      enemy({ x: moving.reticleX, y: moving.reticleY, hp: 40, radius: 16, speed: 0 }),
      enemy({ x: moving.droneX - 40, y: moving.droneY + 260, hp: 900, radius: 16, speed: 0 }),
    )
    step(moving, input({ aimActive: false }), 1 / 60)
    const parkedX = moving.reticleX
    const parkedY = moving.reticleY
    for (let n = 0; n < 80; n++) {
      moving.droneFace = Math.PI
      step(moving, input({ moveX: 1, aimActive: false }), 1 / 60)
    }
    assert.ok(Math.hypot(moving.reticleX - parkedX, moving.reticleY - parkedY) > 160)

    const quiet = createGame(0, 59)
    quiet.spawnCd = 999
    quiet.fireCd = 10
    quiet.invuln = 5
    quiet.mods.drone = 5
    quiet.droneReload = 0
    quiet.droneCd = 0
    quiet.enemies.push(enemy({ x: 180, y: 30, hp: 2000, radius: 16, speed: 0 }))
    for (let n = 0; n < 40; n++) step(quiet, input({ aimActive: false }), 1 / 30)
    assert.ok(quiet.mortars.length >= 1)
    quiet.enemies.length = 0
    for (let n = 0; n < 40; n++) {
      step(quiet, input({ aimActive: false }), 1 / 30)
      assert.ok(quiet.mortars.every((shell) => shell.age > 0))
    }
    assert.equal(quiet.reticleOn, false)
    quiet.enemies.push(enemy({ x: 200, y: -20, hp: 2000, radius: 16, speed: 0 }))
    let resumed = false
    for (let n = 0; n < 50; n++) {
      step(quiet, input({ aimActive: false }), 1 / 30)
      if (quiet.mortars.some((shell) => shell.age === 0)) resumed = true
    }
    assert.equal(resumed, true)

    const slide = createGame(0, 55)
    slide.spawnCd = 999
    slide.fireCd = 10
    slide.invuln = 5
    slide.mods.drone = 1
    slide.droneReload = 0
    slide.droneBurst = 1
    slide.droneCd = 0
    slide.reticleOn = true
    slide.reticleX = slide.droneX + 200
    slide.reticleY = slide.droneY
    slide.droneFace = 0
    slide.droneVx = 0
    slide.droneVy = 240
    step(slide, input({ aimActive: false, moveY: -1 }), 1 / 60)
    const shot = slide.mortars[0]
    assert.ok(shot)
    const leave = shellPose(shot, 0.02)
    const along = leave.vx * shot.bx + leave.vy * shot.by
    const across = Math.abs(leave.vx * -shot.by + leave.vy * shot.bx)
    assert.ok(along > across)

    const storm = createGame(0, 48)
    storm.spawnCd = 999
    storm.fireCd = 10
    storm.invuln = 5
    storm.mods.drone = 5
    storm.droneCd = 0
    storm.droneReload = 0
    storm.enemies.push(enemy({ x: 180, y: 40, hp: 2000, radius: 16, speed: 0 }))
    for (let n = 0; n < 40; n++) step(storm, input({ aimActive: false }), 1 / 30)
    assert.ok(storm.mortars.length >= 3)
    const tail = createGame(0, 51)
    tail.spawnCd = 999
    tail.fireCd = 10
    tail.mods.drone = 1
    const parked = tail.droneX
    const origin = tail.playerX
    for (let n = 0; n < 6; n++) step(tail, input({ moveX: 1, aimActive: false }), 1 / 60)
    assert.ok(Math.abs(tail.droneX - parked) < 2)
    assert.ok(tail.playerX > origin + 8)
    for (let n = 0; n < 30; n++) step(tail, input({ moveX: 1, aimActive: false }), 1 / 60)
    assert.ok(tail.droneX > parked + 40)
    const yaw = createGame(0, 52)
    yaw.mods.drone = 1
    yaw.spawnCd = 999
    yaw.fireCd = 10
    yaw.enemies.push(enemy({ x: yaw.droneX, y: yaw.droneY - 240, hp: 400, radius: 16, speed: 0 }))
    yaw.droneFace = 0
    for (let n = 0; n < 8; n++) step(yaw, input({ aimActive: false }), 1 / 60)
    assert.ok(yaw.droneFace < -0.2)
    assert.ok(yaw.droneFace > -0.7)
    let up = 0
    let down = 0
    let near = storm.mortars[0]
    let far = storm.mortars[0]
    for (const shell of storm.mortars) {
      const travel = Math.hypot(shell.tx - shell.sx, shell.ty - shell.sy)
      const height = Math.abs(shell.arc)
      if (shell.arc < 0) down += 1
      else up += 1
      assert.ok(height >= 28)
      assert.ok(height <= 72)
      if (near && travel < Math.hypot(near.tx - near.sx, near.ty - near.sy)) near = shell
      if (far && travel > Math.hypot(far.tx - far.sx, far.ty - far.sy)) far = shell
      for (const mark of [0.35, 0.7]) {
        const pose = shellPose(shell, mark)
        const ahead = pose.heading
        const vx = Math.cos(ahead)
        const vy = Math.sin(ahead)
        const forward = (shell.tx - shell.sx) * vx + (shell.ty - shell.sy) * vy
        assert.ok(forward > 0)
      }
    }
    assert.ok(up > 0)
    assert.ok(down > 0)
    assert.ok(near && far)
    assert.ok(Math.hypot(near.tx - near.sx, near.ty - near.sy) <= Math.hypot(far.tx - far.sx, far.ty - far.sy))

    const farAim = createGame(0, 53)
    farAim.spawnCd = 999
    farAim.fireCd = 10
    farAim.invuln = 5
    farAim.mods.drone = 5
    farAim.droneCd = 0
    farAim.droneReload = 0
    farAim.enemies.push(enemy({ x: 240, y: 0, hp: 9000, radius: 16, speed: 0 }))
    const lands: { x: number; y: number; d: number }[] = []
    for (let n = 0; n < 180 && lands.length < 24; n++) {
      const before = farAim.mortars.length
      step(farAim, input({ aimActive: false }), 1 / 60)
      if (farAim.mortars.length > before) {
        for (let i = before; i < farAim.mortars.length && lands.length < 24; i++) {
          const shell = farAim.mortars[i]
          if (shell) lands.push({ x: shell.tx, y: shell.ty, d: Math.hypot(shell.tx - shell.sx, shell.ty - shell.sy) })
        }
      }
    }
    assert.ok(lands.length >= 16)
    const onArc = lands.filter((mark) => mark.d > 356).length
    assert.ok(onArc <= 2)
    let closest = Infinity
    for (let i = 0; i < lands.length; i++) {
      for (let j = i + 1; j < lands.length; j++) {
        const a = lands[i]
        const b = lands[j]
        if (!a || !b) continue
        closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y))
      }
    }
    assert.ok(closest > 0.5)

    const nearCrowd = createGame(0, 60)
    nearCrowd.spawnCd = 999
    nearCrowd.fireCd = 10
    nearCrowd.invuln = 5
    nearCrowd.mods.drone = 1
    nearCrowd.droneReload = 0
    nearCrowd.droneBurst = 2.2
    nearCrowd.droneCd = 0
    nearCrowd.droneFace = 0
    nearCrowd.reticleOn = true
    nearCrowd.reticleX = nearCrowd.playerX + 100
    nearCrowd.reticleY = nearCrowd.playerY
    nearCrowd.enemies.push(enemy({ x: nearCrowd.reticleX, y: nearCrowd.reticleY, hp: 9000, radius: 14, speed: 0 }))
    const farCrowd = createGame(0, 60)
    farCrowd.spawnCd = 999
    farCrowd.fireCd = 10
    farCrowd.invuln = 5
    farCrowd.mods.drone = 1
    farCrowd.droneReload = 0
    farCrowd.droneBurst = 2.2
    farCrowd.droneCd = 0
    farCrowd.droneFace = 0
    farCrowd.reticleOn = true
    farCrowd.reticleX = farCrowd.playerX + 280
    farCrowd.reticleY = farCrowd.playerY
    farCrowd.enemies.push(enemy({ x: farCrowd.reticleX, y: farCrowd.reticleY, hp: 9000, radius: 14, speed: 0 }))
    const reachOf = (state: ReturnType<typeof createGame>) => {
      let reach = 0
      for (let n = 0; n < 100; n++) {
        const before = state.mortars.length
        step(state, input({ aimActive: false }), 1 / 60)
        if (state.mortars.length <= before) continue
        const shell = state.mortars[state.mortars.length - 1]
        if (!shell) continue
        reach = Math.max(reach, Math.hypot(shell.tx - state.reticleX, shell.ty - state.reticleY))
      }
      return reach
    }
    const tight = reachOf(nearCrowd)
    const wide = reachOf(farCrowd)
    assert.ok(tight < 80)
    assert.ok(wide > tight + 30)

    const turning = createGame(0, 61)
    turning.spawnCd = 999
    turning.fireCd = 10
    turning.invuln = 5
    turning.mods.drone = 5
    turning.droneReload = 0
    turning.droneBurst = 3
    turning.droneCd = 0
    turning.droneFace = Math.PI
    turning.reticleOn = true
    turning.reticleX = turning.droneX + 220
    turning.reticleY = turning.droneY
    turning.enemies.push(enemy({ x: turning.reticleX, y: turning.reticleY, hp: 9000, radius: 16, speed: 0 }))
    for (let n = 0; n < 40; n++) step(turning, input({ aimActive: false }), 1 / 60)
    assert.ok(turning.mortars.length >= 3)
    const want = Math.atan2(turning.reticleY - turning.droneY, turning.reticleX - turning.droneX)
    const still = Math.atan2(Math.sin(want - turning.droneFace), Math.cos(want - turning.droneFace))
    assert.ok(Math.abs(still) > 0.4)

    const away = createGame(0, 62)
    away.spawnCd = 999
    away.fireCd = 10
    away.invuln = 5
    away.mods.drone = 5
    away.droneReload = 0
    away.droneBurst = 4
    away.droneCd = 0
    away.droneFace = 0
    away.reticleOn = true
    away.reticleX = away.playerX + 260
    away.reticleY = away.playerY
    away.droneAreaHot = true
    away.droneAreaCd = 4
    away.droneMarkX = away.droneX
    away.droneMarkY = away.droneY
    away.enemies.push(
      enemy({ x: away.reticleX, y: away.reticleY, hp: 9000, radius: 16, speed: 0 }),
      enemy({ x: away.playerX, y: away.playerY + 30, hp: 9000, radius: 16, speed: 220 }),
    )
    const marks: { x: number; y: number }[] = []
    const seen = new Set<object>()
    for (let n = 0; n < 70; n++) {
      step(away, input({ moveX: -1, aimActive: false }), 1 / 60)
      for (const shell of away.mortars) {
        if (shell.age !== 0 || seen.has(shell)) continue
        seen.add(shell)
        marks.push({ x: shell.tx, y: shell.ty })
      }
    }
    const ys = marks.map((mark) => mark.y).sort((a, b) => a - b)
    const mid = ys[ys.length >> 1] ?? 0
    let side = 0
    for (const y of ys) side = Math.max(side, Math.abs(y - mid))
    assert.ok(marks.length >= 8)
    assert.ok(side > 24)
    assert.ok(away.playerX < 0)
  })

  it('counts damage from the stream and each ability', () => {
    const state = createGame(0, 70)
    state.spawnCd = 999
    state.fireCd = 0
    state.invuln = 5
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, hp: 500, radius: 22 }))
    step(state, input(), 1 / 60)
    assert.ok(state.dealt.stream >= HIT)
    state.mods.field = 1
    state.fieldTick = -1
    state.enemies.push(enemy({ x: 20, y: 0, hp: 400, radius: 10, speed: 0 }))
    step(state, input({ aimActive: false }), 1 / 60)
    assert.ok(state.dealt.field >= fieldDamage(1))
    state.mods.orbiter = 6
    state.orbitTime = 0.8
    state.time = 0.5
    const disc = orbitDiscs(state)[0]
    assert.ok(disc)
    state.enemies.push(enemy({ x: disc.x, y: disc.y, hp: 800, radius: 12, speed: 0 }))
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.dealt.orbiter, orbiterDamage(6))
    state.mods.ball = 1
    state.fireCd = 10
    state.balls.push({
      x: 400,
      y: 0,
      vx: 0,
      vy: 0,
      life: 2,
      max: 2,
      radius: 12,
      damage: 20,
      echo: false,
      quantum: false,
      knock: 0,
      spin: 0,
      flex: 0,
      flexAngle: 0,
      touched: [],
    })
    state.enemies.push(enemy({ x: 400, y: 0, hp: 80, radius: 16, speed: 0 }))
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.dealt.ball, 20)
    state.mods.drone = 5
    const report = damageReport(state)
    assert.equal(report.some((row) => row.name === 'Stream' && row.amount === state.dealt.stream), true)
    assert.equal(report.some((row) => row.name === "Guardian's Halo"), true)
    assert.equal(report.some((row) => row.name === 'Force Field'), true)
    assert.equal(report.some((row) => row.name === 'Bouncy Ball'), true)
    assert.equal(report.some((row) => row.name === 'Bulletstorm' && row.amount === 0), true)
    assert.ok(report[0] && report[0].amount >= (report[1]?.amount ?? 0))
  })

  it('restores health only when you level, and Regeneration restores more', () => {
    const quiet = createGame(0, 80)
    quiet.spawnCd = 999
    quiet.fireCd = 10
    quiet.hull = 4
    run(quiet, input({ aimActive: false }), 8.5)
    assert.equal(quiet.hull, 4)

    const state = createGame(0, 81)
    state.spawnCd = 999
    state.fireCd = 10
    state.hull = 6
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.phase, 'level')
    assert.equal(state.hull, 7)
    state.offers = [{ id: 'regen', title: 'Regeneration', detail: '', rank: 1, max: 3, overdrive: false }]
    chooseUpgrade(state, 0)
    assert.equal(state.mods.regen, 1)
    assert.equal(state.hullMax, TUNING.hullMax)
    assert.equal(state.phase, 'play')

    state.hull = 2
    state.xp = state.xpNeed
    step(state, input({ aimActive: false }), 1 / 60)
    assert.equal(state.hull, 4)

    const bite = createGame(0, 82)
    bite.spawnCd = 999
    bite.mods.caliber = 1
    bite.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 26, kind: 1, hp: 200 }))
    step(bite, input(), 1 / 60)
    assert.equal(bite.enemies[0]?.hp, 75)
  })

  it('bins damage by time and marks weapon upgrades', () => {
    const state = createGame(0, 71)
    state.spawnCd = 999
    state.fireCd = 0
    state.invuln = 5
    state.time = 4.2
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, hp: 500, radius: 22 }))
    step(state, input(), 1 / 60)
    assert.ok(state.damageBins.length >= 1)
    assert.equal(state.damageBins[0]?.t, 4)
    const binned = state.damageBins.reduce(
      (sum, bin) => sum + bin.stream + bin.orbiter + bin.field + bin.ball + bin.drone,
      0,
    )
    const dealt = state.dealt.stream + state.dealt.orbiter + state.dealt.field + state.dealt.ball + state.dealt.drone
    assert.equal(binned, dealt)
    assert.ok(dealt > 0)

    state.phase = 'level'
    state.time = 12
    state.offers = [{ id: 'drone', title: 'Drone', detail: '', rank: 1, max: 5, overdrive: false }]
    chooseUpgrade(state, 0)
    assert.deepEqual(state.upgradeMarks[0], { t: 12, source: 'drone', name: 'Drone', rank: 1 })

    state.phase = 'level'
    state.time = 40
    state.mods.drone = 4
    state.offers = [{ id: 'drone', title: 'Drone', detail: '', rank: 5, max: 5, overdrive: false }]
    chooseUpgrade(state, 0)
    assert.equal(state.upgradeMarks[1]?.name, 'Bulletstorm')
    assert.equal(state.upgradeMarks[1]?.rank, 5)
    assert.equal(state.upgradeMarks[1]?.t, 40)

    state.phase = 'level'
    state.offers = [{ id: 'pulse', title: 'Pulse', detail: '', rank: 1, max: 5, overdrive: false }]
    chooseUpgrade(state, 0)
    assert.equal(state.upgradeMarks[2]?.source, 'stream')
    assert.equal(state.upgradeMarks[2]?.name, 'Pulse')
  })
})

describe('clock', () => {
  it('ignores a backwards tick', () => {
    const state = createGame(0, 16)
    step(state, input({ moveX: 1 }), -2)
    assert.equal(state.playerX, 0)
    assert.equal(state.bullets.length, 0)
  })
})
