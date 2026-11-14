import '@fontsource/oxanium/400.css'
import '@fontsource/oxanium/600.css'
import '@fontsource/oxanium/700.css'
import './style.css'
import { AudioBus } from './audio.ts'
import { render, type StickView } from './render.ts'
import {
  chooseUpgrade,
  createGame,
  screenToWorld,
  step,
  type GameState,
} from './sim.ts'

const canvas = must<HTMLCanvasElement>('#view')
const scoreEl = must<HTMLElement>('#score')
const bestEl = must<HTMLElement>('#best')
const comboEl = must<HTMLElement>('#combo')
const hullEl = must<HTMLElement>('#hull')
const heatEl = must<HTMLElement>('#heat')
const hintEl = must<HTMLElement>('#hint')
const liveEl = must<HTMLElement>('#live')
const flashEl = must<HTMLElement>('#flash')
const overlay = must<HTMLElement>('#overlay')
const finalEl = must<HTMLElement>('#final')
const againBtn = must<HTMLButtonElement>('#again')
const xpEl = must<HTMLElement>('#xp')
const xpFill = must<HTMLElement>('#xp-fill')
const xpLabel = must<HTMLElement>('#xp-label')
const levelEl = must<HTMLElement>('#level')
const levelKicker = must<HTMLElement>('#level-kicker')
const levelHint = must<HTMLElement>('#level-hint')
const offersEl = must<HTMLElement>('#offers')
const muteBtn = must<HTMLButtonElement>('#mute')
const fullBtn = must<HTMLButtonElement>('#full')

const ctx = canvas.getContext('2d', { alpha: false })
if (!ctx) throw new Error('Canvas unavailable')

const audio = new AudioBus()
const keys = new Set<string>()
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = window.matchMedia('(pointer: coarse)').matches

hintEl.textContent = coarse
  ? 'Drag the left side to drift · touch the right side to aim · orbs fill the bar'
  : 'WASD drifts · cursor aims · orbs fill the bar'
levelHint.textContent = coarse
  ? 'The pit holds still until you tap a card.'
  : 'The pit holds still until you pick. Press 1, 2, or 3.'

let state = createGame(loadBest(), seed())
let width = 1
let height = 1
let dpr = 1
let pointerX = 0
let pointerY = 0
let pointerOn = false
let stick: { id: number; originX: number; originY: number; x: number; y: number } | null = null
let aimTouch: number | null = null
let shownScore = 0
let shownBest = -1
let shownCombo = ''
let shownHeat = -1
let shownHull = -1
let deathShown = false
let liveAt = 0
let liveHull = -1
let livePhase = ''
let shownXp = -1
let shownLevel = -1
let shownOffers = ''
let last = performance.now()

syncAudioButton()
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

function stickVector(active: NonNullable<typeof stick>): { x: number; y: number; view: StickView } {
  const max = 58
  const dx = active.x - active.originX
  const dy = active.y - active.originY
  const mag = Math.hypot(dx, dy)
  const nx = mag > 0 ? dx / mag : 0
  const ny = mag > 0 ? dy / mag : 0
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
  if (game.score !== shownScore) {
    scoreEl.textContent = game.score.toLocaleString('en-US')
    scoreEl.classList.remove('pop')
    void scoreEl.offsetWidth
    scoreEl.classList.add('pop')
    shownScore = game.score
  }
  if (game.best !== shownBest) {
    bestEl.textContent = `Best ${game.best.toLocaleString('en-US')}`
    shownBest = game.best
    saveBest(game.best)
  }
  const combo = game.combo >= 2 && game.comboTime > 0 ? `x${game.combo}` : ''
  if (combo !== shownCombo) {
    comboEl.textContent = combo
    shownCombo = combo
  }
  if (game.heat !== shownHeat) {
    heatEl.textContent = `Heat ${String(game.heat).padStart(2, '0')}`
    shownHeat = game.heat
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
  if (game.hull !== shownHull || hullEl.children.length !== game.hullMax) {
    while (hullEl.children.length > game.hullMax) hullEl.lastElementChild?.remove()
    while (hullEl.children.length < game.hullMax) {
      const pip = document.createElement('span')
      pip.className = 'pip'
      hullEl.append(pip)
    }
    const pips = hullEl.children
    for (let i = 0; i < pips.length; i++) {
      const pip = pips[i]
      if (!(pip instanceof HTMLElement)) continue
      pip.classList.toggle('spent', i >= game.hull)
      pip.classList.toggle('warn', game.hull > 0 && game.hull <= 2 && i < game.hull)
    }
    shownHull = game.hull
  }
  document.body.classList.toggle('critical', game.phase === 'play' && game.hull <= 2)
  flashEl.style.opacity = String(Math.min(0.45, game.flash * 0.45))

  if (game.phase === 'dead' && !deathShown) {
    deathShown = true
    finalEl.textContent = `Score ${game.score.toLocaleString('en-US')} · Best ${game.best.toLocaleString('en-US')} · ${game.kills.toLocaleString('en-US')} shattered`
    overlay.hidden = false
    againBtn.focus()
  }

  if (now > liveAt || game.hull !== liveHull || game.phase !== livePhase) {
    liveAt = now + 1600
    liveHull = game.hull
    livePhase = game.phase
    liveEl.textContent =
      game.phase === 'dead'
        ? `Core lost. Score ${game.score}. Best ${game.best}.`
        : game.phase === 'level'
          ? `Level ${game.level}. Choose an upgrade.`
          : `Score ${game.score}. Level ${game.level}. Hull ${game.hull} of ${game.hullMax}.`
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
    button.className = 'offer'
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
    rank.textContent = offer.id === 'cache' ? 'Bonus' : `Rank ${offer.rank} of ${offer.max}`
    button.append(keyEl, title, detail, rank)
    button.addEventListener('click', () => pickUpgrade(index))
    offersEl.append(button)
  })
  const first = offersEl.querySelector('button')
  if (first instanceof HTMLButtonElement) first.focus()
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
  shownScore = -1
  shownBest = -1
  shownHull = -1
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
  const left = event.clientX < window.innerWidth * 0.42
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
  dpr = Math.min(window.devicePixelRatio || 1, 2)
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
