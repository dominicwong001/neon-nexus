import '@fontsource/oxanium/400.css'
import '@fontsource/oxanium/600.css'
import '@fontsource/oxanium/700.css'
import './style.css'
import { AudioBus } from './audio.ts'
import { render, type StickView } from './render.ts'
import {
  chooseUpgrade,
  createGame,
  damageReport,
  screenToWorld,
  step,
  type GameState,
} from './sim.ts'

const canvas = must<HTMLCanvasElement>('#view')
const hullEl = must<HTMLElement>('#hull')
const hullFill = must<HTMLElement>('#hull-fill')
const hintEl = must<HTMLElement>('#hint')
const liveEl = must<HTMLElement>('#live')
const flashEl = must<HTMLElement>('#flash')
const overlay = must<HTMLElement>('#overlay')
const finalEl = must<HTMLElement>('#final')
const damageEl = must<HTMLElement>('#damage')
const againBtn = must<HTMLButtonElement>('#again')
const xpEl = must<HTMLElement>('#xp')
const xpFill = must<HTMLElement>('#xp-fill')
const xpLabel = must<HTMLElement>('#xp-label')
const levelEl = must<HTMLElement>('#level')
const levelKicker = must<HTMLElement>('#level-kicker')
const offersEl = must<HTMLElement>('#offers')
const muteBtn = must<HTMLButtonElement>('#mute')
const fullBtn = must<HTMLButtonElement>('#full')
const fastBtn = must<HTMLButtonElement>('#fast')

const ctx = canvas.getContext('2d', { alpha: false })
if (!ctx) throw new Error('Canvas unavailable')

const audio = new AudioBus()
const keys = new Set<string>()
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches

hintEl.textContent = coarse
  ? 'Stick drifts · touch aims · orbs fill the bar'
  : 'WASD drifts · cursor aims · orbs fill the bar'

let state = createGame(loadBest(), seed())
let fast = localStorage.getItem('neon-fast') === '1'
let width = 1
let height = 1
let dpr = 1
let pointerX = 0
let pointerY = 0
let pointerOn = false
type TouchStick = { id: number; originX: number; originY: number; x: number; y: number }
let stick: TouchStick | null = null
let aimTouch: number | null = null
let shownBest = -1
let shownHull = -1
let shownHullMax = -1
let deathShown = false
let liveAt = 0
let liveHull = -1
let livePhase = ''
let shownXp = -1
let shownLevel = -1
let shownOffers = ''
let last = performance.now()

syncAudioButton()
syncFastButton()
resize()
requestAnimationFrame(frame)

window.addEventListener('resize', resize)
window.addEventListener('keydown', onKeyDown)
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()))
window.addEventListener('blur', () => keys.clear())
window.addEventListener('pointerdown', onPointerDown, { passive: false })
window.addEventListener('pointermove', onPointerMove)
window.addEventListener('pointerup', onPointerUp)
window.addEventListener('pointercancel', onPointerUp)
canvas.addEventListener('contextmenu', (event) => event.preventDefault())
document.addEventListener('visibilitychange', () => {
  last = performance.now()
  if (document.hidden) audio.suspend()
  else audio.resume()
})
againBtn.addEventListener('click', reform)
muteBtn.addEventListener('click', () => {
  audio.toggle()
  syncAudioButton()
})
fullBtn.addEventListener('click', toggleFull)
fastBtn.addEventListener('click', () => {
  fast = !fast
  localStorage.setItem('neon-fast', fast ? '1' : '0')
  syncFastButton()
  resize()
})
document.addEventListener('fullscreenchange', syncFullButton)

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (!document.hidden) {
    const move = readMove()
    const aimScreenX = pointerOn ? pointerX : width / 2 + 150
    const aimScreenY = pointerOn ? pointerY : height / 2
    const aim = screenToWorld(width, height, state.playerX, state.playerY, aimScreenX, aimScreenY)
    const events = step(
      state,
      {
        moveX: move.x,
        moveY: move.y,
        aimX: aim.x,
        aimY: aim.y,
        aimActive: true,
        viewRadius: Math.max(220, Math.hypot(width, height) / 2),
        viewW: width,
        viewH: height,
      },
      dt,
    )
    if (events.shots) audio.shot()
    if (events.kills) audio.kill()
    if (events.pickups) audio.pickup()
    if (events.leveled) audio.level()
    if (events.hurt) audio.hurt()
    if (events.died) audio.die()
    render(ctx!, state, {
      width,
      height,
      dpr,
      pointerX,
      pointerY,
      pointerOn,
      stick: move.stick,
      reduceMotion,
      fast,
    })
    syncHud(state, now)
  }
  requestAnimationFrame(frame)
}

function readMove(): { x: number; y: number; stick: StickView | null } {
  let x = 0
  let y = 0
  if (keys.has('a') || keys.has('arrowleft')) x -= 1
  if (keys.has('d') || keys.has('arrowright')) x += 1
  if (keys.has('w') || keys.has('arrowup')) y -= 1
  if (keys.has('s') || keys.has('arrowdown')) y += 1
  if (!stick) return { x, y, stick: null }
  const analog = stickVector(stick)
  if (x === 0 && y === 0) return { x: analog.x, y: analog.y, stick: analog.view }
  return { x, y, stick: analog.view }
}

function stickVector(active: TouchStick): { x: number; y: number; view: StickView } {
  const max = 58
  let dx = active.x - active.originX
  let dy = active.y - active.originY
  let mag = Math.hypot(dx, dy)
  const nx = mag > 0 ? dx / mag : 0
  const ny = mag > 0 ? dy / mag : 0
  if (mag > max) {
    active.originX = active.x - nx * max
    active.originY = active.y - ny * max
    dx = active.x - active.originX
    dy = active.y - active.originY
    mag = max
  }
  const clamped = Math.min(mag, max)
  return {
    x: mag < 8 ? 0 : nx * (clamped / max),
    y: mag < 8 ? 0 : ny * (clamped / max),
    view: {
      ox: active.originX,
      oy: active.originY,
      x: active.originX + nx * clamped,
      y: active.originY + ny * clamped,
    },
  }
}

function syncHud(game: GameState, now: number): void {
  if (game.best !== shownBest) {
    shownBest = game.best
    saveBest(game.best)
  }
  const xpPct = game.xpNeed > 0 ? Math.max(0, Math.min(100, (game.xp / game.xpNeed) * 100)) : 0
  if (xpPct !== shownXp || game.level !== shownLevel) {
    xpFill.style.width = `${xpPct}%`
    xpLabel.textContent = `Lv ${game.level}`
    xpEl.setAttribute('aria-valuenow', String(Math.round(xpPct)))
    xpEl.setAttribute('aria-valuemax', '100')
    xpEl.setAttribute('aria-valuetext', `Level ${game.level}, ${Math.round(xpPct)} percent`)
    shownXp = xpPct
    shownLevel = game.level
  }
  syncLevel(game)
  if (game.hull !== shownHull || game.hullMax !== shownHullMax) {
    const hullPct = game.hullMax > 0 ? Math.max(0, Math.min(100, (game.hull / game.hullMax) * 100)) : 0
    hullFill.style.width = `${hullPct}%`
    hullEl.setAttribute('aria-valuenow', String(game.hull))
    hullEl.setAttribute('aria-valuemax', String(game.hullMax))
    hullEl.setAttribute('aria-valuetext', `${game.hull} of ${game.hullMax}`)
    hullEl.classList.toggle('warn', game.hull > 0 && game.hull * 2 <= game.hullMax)
    shownHull = game.hull
    shownHullMax = game.hullMax
  }
  document.body.classList.toggle('critical', game.phase === 'play' && game.hull <= 2)
  document.body.classList.toggle('menu', game.phase !== 'play')
  flashEl.style.opacity = String(Math.min(0.45, game.flash * 0.45))

  if (game.phase === 'dead' && !deathShown) {
    deathShown = true
    finalEl.textContent = `Reached level ${game.level}`
    damageEl.replaceChildren()
    for (const row of damageReport(game)) {
      const item = document.createElement('li')
      const name = document.createElement('span')
      name.textContent = row.name
      const amount = document.createElement('span')
      amount.textContent = String(row.amount)
      item.append(name, amount)
      damageEl.append(item)
    }
    overlay.hidden = false
    againBtn.focus()
  }

  if (now > liveAt || game.hull !== liveHull || game.phase !== livePhase) {
    liveAt = now + 1600
    liveHull = game.hull
    livePhase = game.phase
    liveEl.textContent =
      game.phase === 'dead'
        ? `Core lost. Reached level ${game.level}.`
        : game.phase === 'level'
          ? `Level ${game.level}. Choose an upgrade.`
          : `Level ${game.level}. Hull ${game.hull} of ${game.hullMax}.`
  }
}

function syncLevel(game: GameState): void {
  const open = game.phase === 'level'
  levelEl.hidden = !open
  if (!open) {
    if (shownOffers !== '') {
      shownOffers = ''
      offersEl.replaceChildren()
    }
    return
  }
  const key = `${game.level}:${game.offers.map((offer) => `${offer.id}${offer.rank}`).join('|')}`
  if (key === shownOffers) return
  shownOffers = key
  levelKicker.textContent = `Level ${game.level}`
  offersEl.replaceChildren()
  game.offers.forEach((offer, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = offer.overdrive ? 'offer overdrive' : 'offer'
    const keyEl = document.createElement('span')
    keyEl.className = 'offer-key'
    keyEl.textContent = String(index + 1)
    const title = document.createElement('span')
    title.className = 'offer-title'
    title.textContent = offer.title
    const detail = document.createElement('span')
    detail.className = 'offer-detail'
    detail.textContent = offer.detail
    const rank = document.createElement('span')
    rank.className = 'offer-rank'
    rank.textContent = offer.overdrive ? 'Overdrive' : offer.id === 'cache' ? 'Bonus' : `Rank ${offer.rank} of ${offer.max}`
    button.append(keyEl, title, detail, rank)
    button.addEventListener('click', () => pickUpgrade(index))
    offersEl.append(button)
  })
}

function pickUpgrade(index: number): void {
  if (state.phase !== 'level') return
  chooseUpgrade(state, index)
  audio.ensure()
  if (state.phase === 'level') audio.level()
  shownOffers = ''
  shownXp = -1
  shownLevel = -1
  shownHull = -1
}

function reform(): void {
  state = createGame(Math.max(state.best, loadBest()), seed())
  overlay.hidden = true
  levelEl.hidden = true
  deathShown = false
  shownBest = -1
  shownHull = -1
  shownHullMax = -1
  shownXp = -1
  shownLevel = -1
  shownOffers = ''
  audio.ensure()
}

function onKeyDown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase()
  if (key.startsWith('arrow') || key === ' ') event.preventDefault()
  keys.add(key)
  audio.ensure()
  if (event.repeat) return
  if (state.phase === 'level' && (key === '1' || key === '2' || key === '3')) {
    pickUpgrade(Number(key) - 1)
    return
  }
  if (key === 'r' && state.phase === 'dead') reform()
  if (key === 'f') toggleFull()
}

function onPointerDown(event: PointerEvent): void {
  audio.ensure()
  if (event.pointerType !== 'touch') {
    pointerX = event.clientX
    pointerY = event.clientY
    pointerOn = true
    return
  }
  if (event.target instanceof Element && event.target.closest('button')) return
  event.preventDefault()
  const left = event.clientX < window.innerWidth * 0.5
  if (left && !stick) {
    stick = {
      id: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      x: event.clientX,
      y: event.clientY,
    }
    return
  }
  aimTouch = event.pointerId
  pointerX = event.clientX
  pointerY = event.clientY
  pointerOn = true
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch') {
    if (stick && event.pointerId === stick.id) {
      stick.x = event.clientX
      stick.y = event.clientY
    }
    if (event.pointerId === aimTouch) {
      pointerX = event.clientX
      pointerY = event.clientY
      pointerOn = true
    }
    return
  }
  pointerX = event.clientX
  pointerY = event.clientY
  pointerOn = true
}

function onPointerUp(event: PointerEvent): void {
  if (stick && event.pointerId === stick.id) stick = null
  if (event.pointerId === aimTouch) aimTouch = null
}

function resize(): void {
  width = Math.max(1, window.innerWidth)
  height = Math.max(1, window.innerHeight)
  dpr = Math.min(window.devicePixelRatio || 1, fast ? 1 : 2)
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
}

function toggleFull(): void {
  if (!document.fullscreenElement) {
    void document.documentElement.requestFullscreen().catch(() => {})
  } else {
    void document.exitFullscreen()
  }
}

function syncFastButton(): void {
  fastBtn.textContent = fast ? 'Fast on' : 'Fast'
  fastBtn.setAttribute('aria-pressed', fast ? 'true' : 'false')
  fastBtn.setAttribute('aria-label', fast ? 'Fast mode on. Glows are off.' : 'Fast mode off. Turn off glows to raise frame rate.')
  document.body.classList.toggle('fast', fast)
}

function syncAudioButton(): void {
  const on = !audio.muted
  muteBtn.textContent = on ? 'Audio on' : 'Audio off'
  muteBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
}

function syncFullButton(): void {
  const on = document.fullscreenElement != null
  fullBtn.textContent = on ? 'Window' : 'Full screen'
  fullBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
}

function loadBest(): number {
  try {
    const n = Number(localStorage.getItem('lumen-pit-best'))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

function saveBest(best: number): void {
  try {
    localStorage.setItem('lumen-pit-best', String(best))
  } catch {
    /* private mode */
  }
}

function seed(): number {
  return (Math.random() * 0x7fffffff) | 0 || 1
}

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector)
  if (!el) throw new Error(`Missing ${selector}`)
  return el
}
