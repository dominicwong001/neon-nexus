import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  TUNING,
  chooseUpgrade,
  createGame,
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
    ...over,
  }
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
    assert.ok(state.playerX > 4000)
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

  it('keeps the stream on the cursor line while the core is moving', () => {
    const state = createGame(0, 8)
    state.playerVx = 220
    state.playerVy = -80
    step(state, input({ aimX: 400, aimY: 0, moveX: 0, moveY: 0 }), 1 / 60)
    const bullet = state.bullets[0]
    assert.ok(bullet)
    const rx = bullet.vx - state.playerVx
    const ry = bullet.vy - state.playerVy
    assert.ok(rx > 800)
    assert.ok(Math.abs(ry) < 40)
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
      assert.equal(child.hp, 1)
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
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 26, kind: 1, hp: 2 }))
    step(state, input(), 1 / 60)
    assert.equal(state.score, 0)
    assert.equal(state.enemies.length, 1)
    assert.equal(state.enemies[0]?.hp, 1)
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

  it('lets hostiles sit on top of each other', () => {
    const state = createGame(0, 21)
    state.spawnCd = 999
    state.enemies.push(enemy({ x: 240, y: 30, speed: 120, hp: 8 }))
    state.enemies.push(enemy({ x: 240, y: 30, speed: 120, hp: 8, phase: 2 }))
    run(state, input({ aimX: 0, aimY: -500, viewRadius: 200 }), 0.5)
    const a = state.enemies[0]
    const b = state.enemies[1]
    assert.ok(a)
    assert.ok(b)
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1)
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

  it('queues another choice when one orb covers two levels', () => {
    const state = createGame(0, 43)
    state.spawnCd = 999
    state.orbs.push(orb({ value: 30 }))
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
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, kind: 1, hp: 2, radius: 22 }))
    step(state, input(), 1 / 60)
    assert.ok(state.impacts.length >= 1)
    assert.equal(state.enemies.length, 1)
    assert.equal(state.enemies[0]?.hp, 1)
  })

  it('repairs hull when Plate is chosen', () => {
    const state = createGame(0, 45)
    state.phase = 'level'
    state.hull = 3
    state.offers = [{ id: 'plate', title: 'Plate', detail: 'Repair one hull segment and add a spare.', rank: 1, max: 3 }]
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
