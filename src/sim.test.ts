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
  droneReload,
  droneStorm,
  shellPose,
  screenToWorld,
  step,
  worldToScreen,
  xpNeedFor,
  type Enemy,
  type Input,
  type Orb,
} from './sim.ts'

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
    ...over,
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
    assert.ok(state.playerX > 2400)
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

  it('splits a circle into smaller circles that do not split again', () => {
    const state = createGame(0, 19)
    state.spawnCd = 50
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 20, kind: 2, hp: 1, generation: 0 }))
    const events = step(state, input(), 1 / 60)
    assert.equal(events.kills, 1)
    assert.equal(state.enemies.length, 2)
    for (const child of state.enemies) {
      assert.equal(child.kind, 2)
      assert.equal(child.hp, 100)
      assert.equal(child.generation, 1)
      assert.ok(child.radius < 20)
    }
    const child = state.enemies[0]
    assert.ok(child)
    state.enemies.splice(0, state.enemies.length, child)
    state.xpNeed = 999
    child.x = state.playerX + TUNING.muzzle
    child.y = state.playerY
    child.vx = 0
    child.vy = 0
    child.speed = 0
    child.hitCd = 0
    const kills = state.kills
    for (let i = 0; i < 40 && state.enemies.includes(child); i++) {
      step(state, input({ aimX: state.playerX + 200, aimY: state.playerY }), 1 / 60)
    }
    assert.equal(state.enemies.includes(child), false)
    assert.equal(state.kills, kills + 1)
    assert.equal(state.enemies.filter((e) => e.generation === 0).length, 0)
    assert.ok(state.enemies.every((e) => e.generation === 1))
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
    const state = createGame(0, 7)
    state.fireCd = 10
    const counts = [0, 0, 0, 0]
    for (let i = 0; i < 240; i++) {
      state.spawnCd = 0
      state.enemies.length = 0
      step(state, input({ viewRadius: 400, aimActive: false }), 1 / 60)
      for (const hostile of state.enemies) {
        counts[hostile.kind] += 1
        assert.equal(hostile.hp, [100, 200, 300, 1000][hostile.kind])
        if (hostile.kind !== 3) continue
        assert.ok(hostile.radius > 22 * BODY)
        assert.ok(hostile.speed < 66)
      }
    }
    assert.ok(counts[3] >= 1)
    assert.ok(counts[3] < counts[0])
    assert.ok(counts[3] < counts[1])
    assert.ok(counts[3] < counts[2])
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
  it('drops a larger lilac orb from a circle than from a square', () => {
    const state = createGame(0, 31)
    state.spawnCd = 999
    state.enemies.push(enemy({ x: 340, y: 0, kind: 1, hp: 1, speed: 0, radius: 18 }))
    state.enemies.push(enemy({ x: 560, y: 0, kind: 2, hp: 1, speed: 0, radius: 18, generation: 0 }))
    run(state, input({ aimX: 900, aimY: 0 }), 1.6)
    const common = state.orbs.filter((item) => !item.rare)
    const rare = state.orbs.filter((item) => item.rare)
    assert.ok(common.length >= 1)
    assert.ok(rare.length >= 1)
    const plain = common[0]
    const big = rare.reduce((best, item) => (item.radius > best.radius ? item : best))
    assert.ok(plain)
    assert.ok(big.radius > plain.radius)
    assert.equal(big.value, 4)
    assert.ok(big.value > plain.value)
    assert.notEqual(big.color, plain.color)
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
  })

  it('always includes one of the four main abilities', () => {
    const state = createGame(0, 90)
    state.spawnCd = 999
    state.fireCd = 10
    const mains = new Set(['orbiter', 'field', 'ball', 'drone'])
    const seen = new Set<string>()
    for (let n = 0; n < 20; n++) {
      state.xp = state.xpNeed
      step(state, input({ aimActive: false }), 1 / 60)
      assert.equal(state.offers.length, 3)
      assert.equal(state.offers.some((offer) => offer.id === 'drone'), true)
      assert.equal(state.offers.some((offer) => mains.has(offer.id)), true)
      for (const offer of state.offers) {
        if (mains.has(offer.id)) seen.add(offer.id)
      }
      const skip = state.offers.findIndex((offer) => !mains.has(offer.id))
      chooseUpgrade(state, skip >= 0 ? skip : 0)
    }
    assert.ok(seen.size >= 3)
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
    assert.ok(discRadius(6) > discRadius(5) * 1.3)
    assert.ok(discOrbit(6) > discOrbit(5) * 1.3)
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
    const second = enemy({ x: 110, y: 0, hp: 200, radius: 18, kind: 1 })
    pierce.enemies.push(first, second)
    run(pierce, input({ aimActive: false }), 0.3)
    assert.ok(first.hp < 200)
    assert.ok(second.hp < 200)
    assert.equal(first.hp, second.hp)
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
    assert.ok(orbiterDamage(1) < HIT / 3)
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
    assert.ok(droneReload(1) > 2)
    assert.ok(droneReload(4) < droneReload(1))
    assert.ok(droneReload(5) < 0.6)
    assert.ok(droneInterval(4) < droneInterval(1))
    assert.ok(droneInterval(5) < droneInterval(4))
    assert.ok(droneBlast(4) > droneBlast(1))
    assert.ok(droneBlast(5) > droneBlast(4))
    assert.ok(droneDamage(1) > 0)
    assert.ok(droneDamage(5) > droneDamage(4))

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
    assert.ok(Math.abs(lob.reticleX - 40) < 1)
    assert.ok(Math.abs(first.tx - (markX - (lockedX - 40))) < 1)
    assert.equal(first.ty, markY)
    if (lob.enemies[0]) lob.enemies[0].x = lockedX
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
    yaw.reticleOn = true
    yaw.reticleX = yaw.droneX
    yaw.reticleY = yaw.droneY - 240
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
      const reach = Math.min(1, travel / 240)
      const low = travel * (0.02 + reach * reach * 0.16)
      const high = travel * (0.07 + reach * reach * 0.16 + reach * 0.16)
      if (shell.arc < 0) down += 1
      else up += 1
      assert.ok(height + 0.001 >= low)
      assert.ok(height <= high + 0.001)
      if (near && travel < Math.hypot(near.tx - near.sx, near.ty - near.sy)) near = shell
      if (far && travel > Math.hypot(far.tx - far.sx, far.ty - far.sy)) far = shell
      for (const mark of [0, 0.35, 0.7]) {
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
    assert.ok(Math.abs(near.arc) < Math.abs(far.arc))
  })

  it('repairs hull when Plate is chosen', () => {
    const state = createGame(0, 45)
    state.phase = 'level'
    state.hull = 3
    state.offers = [{ id: 'plate', title: 'Plate', detail: 'Repair one hull segment and add a spare.', rank: 1, max: 3, overdrive: false }]
    chooseUpgrade(state, 0)
    assert.equal(state.hullMax, TUNING.hullMax + 1)
    assert.equal(state.hull, 4)
    assert.equal(state.mods.plate, 1)
    assert.equal(state.phase, 'play')
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
