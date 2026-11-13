import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  TUNING,
  createGame,
  screenToWorld,
  step,
  worldToScreen,
  type Enemy,
  type Input,
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
    assert.ok(events.shots >= 1)
    assert.ok(state.bullets.length >= 2)
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

  it('needs two hits to break a block', () => {
    const state = createGame(0, 11)
    state.spawnCd = 50
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 26, kind: 1, hp: 2 }))
    step(state, input(), 1 / 60)
    assert.equal(state.score, 0)
    assert.equal(state.enemies.length, 1)
    assert.equal(state.enemies[0]?.hp, 1)
    for (let i = 0; i < 20 && state.enemies.length; i++) step(state, input(), 1 / 60)
    assert.equal(state.enemies.length, 0)
    assert.equal(state.score, 20)
  })

  it('builds a combo when shapes break in a chain', () => {
    const state = createGame(0, 12)
    state.spawnCd = 50
    state.enemies.push(enemy({ x: TUNING.muzzle, y: 0, radius: 24 }))
    step(state, input(), 1 / 60)
    state.enemies.push(enemy({ x: state.playerX + TUNING.muzzle, y: state.playerY, radius: 24 }))
    for (let i = 0; i < 20 && state.score < 30; i++) {
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

describe('clock', () => {
  it('ignores a backwards tick', () => {
    const state = createGame(0, 16)
    step(state, input({ moveX: 1 }), -2)
    assert.equal(state.playerX, 0)
    assert.equal(state.bullets.length, 0)
  })
})
