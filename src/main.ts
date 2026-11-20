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
  sourceLabel,
  step,
  type DamageSource,
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
const advancedBtn = must<HTMLButtonElement>('#advanced')
const timelineEl = must<HTMLElement>('#timeline')
const timelineClose = must<HTMLButtonElement>('#timeline-close')
const timelineChart = must<HTMLCanvasElement>('#timeline-chart')
const timelineLegend = must<HTMLElement>('#timeline-legend')
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
  ? 'Left stick drifts · right stick aims · orbs fill the bar'
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
let aimStick: TouchStick | null = null
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
window.addEventListener('blur', () => {
  keys.clear()
  releaseSticks()
})
window.addEventListener('pointerdown', onPointerDown, { passive: false })
window.addEventListener('pointermove', onPointerMove)
window.addEventListener('pointerup', onPointerUp)
window.addEventListener('pointercancel', onPointerUp)
window.addEventListener('touchstart', onTouchStart, { passive: false })
window.addEventListener('touchmove', onTouchMove, { passive: false })
window.addEventListener('touchend', onTouchEnd, { passive: false })
window.addEventListener('touchcancel', onTouchEnd, { passive: false })
window.addEventListener('selectstart', (event) => event.preventDefault())
window.addEventListener('dragstart', (event) => event.preventDefault())
window.addEventListener('contextmenu', (event) => event.preventDefault())
document.addEventListener('visibilitychange', () => {
  last = performance.now()
  if (document.hidden) {
    audio.suspend()
    releaseSticks()
  } else audio.resume()
})
againBtn.addEventListener('click', reform)
advancedBtn.addEventListener('click', openTimeline)
timelineClose.addEventListener('click', closeTimeline)
timelineEl.addEventListener('click', (event) => {
  if (event.target === timelineEl) closeTimeline()
})
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
    const aim = readAim()
    const aimed = screenToWorld(width, height, state.playerX, state.playerY, aim.x, aim.y)
    const events = step(
      state,
      {
        moveX: move.x,
        moveY: move.y,
        aimX: aimed.x,
        aimY: aimed.y,
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
      aimStick: aim.stick,
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

function readAim(): { x: number; y: number; stick: StickView | null } {
  if (!aimStick) {
    return {
      x: pointerOn ? pointerX : width / 2 + 150,
      y: pointerOn ? pointerY : height / 2,
      stick: null,
    }
  }
  const analog = stickVector(aimStick)
  analog.view.aim = true
  if (analog.x !== 0 || analog.y !== 0) {
    const reach = Math.min(width, height) * 0.46
    pointerX = width / 2 + analog.x * reach
    pointerY = height / 2 + analog.y * reach
    pointerOn = true
  }
  return { x: pointerOn ? pointerX : width / 2 + 150, y: pointerOn ? pointerY : height / 2, stick: analog.view }
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
          : `Level ${game.level}. Health ${game.hull} of ${game.hullMax}.`
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
    rank.textContent =
      offer.id === 'cache' ? 'Bonus' : `lvl ${offer.rank - 1} --> lvl ${offer.rank}/${offer.max}`
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

const SERIES: { source: DamageSource; color: string }[] = [
  { source: 'stream', color: '#ffffff' },
  { source: 'orbiter', color: '#7ecbff' },
  { source: 'field', color: '#c9a6ff' },
  { source: 'ball', color: '#ffd166' },
  { source: 'drone', color: '#ff5d73' },
]
const TOTAL_COLOR = '#9dffb0'

function openTimeline(): void {
  if (state.phase !== 'dead') return
  timelineEl.hidden = false
  paintTimeline(state)
  requestAnimationFrame(() => {
    if (!timelineEl.hidden) paintTimeline(state)
  })
  timelineClose.focus()
}

function closeTimeline(): void {
  timelineEl.hidden = true
  if (state.phase === 'dead') againBtn.focus()
}

function paintTimeline(game: GameState): void {
  const chart = timelineChart.getContext('2d')
  if (!chart) return
  const widthCss = Math.max(280, timelineChart.clientWidth || timelineChart.parentElement?.clientWidth || 640)
  const heightCss = Math.max(180, timelineChart.clientHeight || 280)
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  timelineChart.width = Math.round(widthCss * ratio)
  timelineChart.height = Math.round(heightCss * ratio)
  chart.setTransform(ratio, 0, 0, ratio, 0, 0)
  chart.imageSmoothingEnabled = true
  chart.clearRect(0, 0, widthCss, heightCss)
  chart.fillStyle = '#07080c'
  chart.fillRect(0, 0, widthCss, heightCss)

  const owned = SERIES.filter(
    (series) =>
      series.source === 'stream' ||
      rankOf(game, series.source) > 0 ||
      game.dealt[series.source] > 0 ||
      game.upgradeMarks.some((mark) => mark.source === series.source),
  )
  const samples = damageSamples(game)
  const duration = Math.max(game.time, samples[samples.length - 1]?.t ?? 0, 1)
  const peak = samples.reduce((max, sample) => Math.max(max, sample.total), 0)
  const yMax = niceCeiling(peak)
  const pad = { left: 52, right: 16, top: 16, bottom: 28 }
  const plotW = Math.max(1, widthCss - pad.left - pad.right)
  const plotH = Math.max(1, heightCss - pad.top - pad.bottom)
  const xOf = (t: number) => pad.left + (t / duration) * plotW
  const yOf = (value: number) => pad.top + (1 - value / yMax) * plotH

  chart.strokeStyle = 'rgba(255, 255, 255, 0.14)'
  chart.fillStyle = 'rgba(255, 255, 255, 0.55)'
  chart.font = '11px Oxanium, sans-serif'
  chart.lineWidth = 1
  chart.textAlign = 'right'
  chart.textBaseline = 'middle'
  for (let i = 0; i <= 4; i++) {
    const value = (yMax * i) / 4
    const y = yOf(value)
    chart.beginPath()
    chart.moveTo(pad.left, y)
    chart.lineTo(widthCss - pad.right, y)
    chart.stroke()
    chart.fillText(formatDamage(value), pad.left - 8, y)
  }
  chart.textAlign = 'center'
  chart.textBaseline = 'top'
  const ticks = duration <= 8 ? 4 : 5
  for (let i = 0; i <= ticks; i++) {
    const t = (duration * i) / ticks
    const x = xOf(t)
    chart.fillText(`${t < 10 ? t.toFixed(1) : Math.round(t)}s`, x, heightCss - pad.bottom + 8)
  }

  const drawLine = (color: string, read: (sample: (typeof samples)[number]) => number, dashed: boolean) => {
    const points: { x: number; y: number }[] = []
    for (const sample of samples) {
      const x = xOf(sample.t)
      const y = yOf(read(sample))
      const last = points[points.length - 1]
      if (last && Math.abs(last.x - x) < 0.4 && Math.abs(last.y - y) < 0.4) continue
      points.push({ x, y })
    }
    if (points.length === 0) return
    chart.beginPath()
    chart.moveTo(points[0].x, points[0].y)
    if (points.length === 1) {
      chart.lineTo(points[0].x + 0.01, points[0].y)
    } else {
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const span = curr.x - prev.x
        chart.bezierCurveTo(prev.x + span * 0.5, prev.y, curr.x - span * 0.5, curr.y, curr.x, curr.y)
      }
    }
    chart.strokeStyle = color
    chart.lineWidth = dashed ? 3.25 : 3
    chart.lineCap = 'round'
    chart.lineJoin = 'round'
    chart.setLineDash(dashed ? [8, 6] : [])
    chart.stroke()
    chart.setLineDash([])
  }

  for (const series of owned) drawLine(series.color, (sample) => sample[series.source], false)
  drawLine(TOTAL_COLOR, (sample) => sample.total, true)

  chart.font = '10px Oxanium, sans-serif'
  chart.textAlign = 'center'
  chart.textBaseline = 'bottom'
  const labeled = new Map<DamageSource, number>()
  for (const mark of game.upgradeMarks) {
    const series = owned.find((item) => item.source === mark.source)
    if (!series) continue
    const x = xOf(Math.min(mark.t, duration))
    const y = yOf(valueAt(samples, mark.source, mark.t))
    chart.save()
    chart.translate(x, y)
    chart.rotate(Math.PI / 4)
    chart.fillStyle = series.color
    chart.strokeStyle = '#05060a'
    chart.lineWidth = 1.5
    chart.fillRect(-4, -4, 8, 8)
    chart.strokeRect(-4, -4, 8, 8)
    chart.restore()
    const previous = labeled.get(mark.source) ?? -Infinity
    if (x - previous < 36) continue
    labeled.set(mark.source, x)
    chart.fillStyle = series.color
    chart.fillText(`${mark.name} ${mark.rank}`, x, y - 8)
  }

  timelineLegend.replaceChildren()
  for (const series of owned) {
    timelineLegend.append(legendItem(series.color, sourceLabel(series.source, rankOf(game, series.source)), game.dealt[series.source], false))
  }
  const total = owned.reduce((sum, series) => sum + game.dealt[series.source], 0)
  timelineLegend.append(legendItem(TOTAL_COLOR, 'Total', total, true))
}

function rankOf(game: GameState, source: DamageSource): number {
  if (source === 'stream') return Math.max(game.mods.pulse, game.mods.caliber, game.mods.fork)
  return game.mods[source]
}

function legendItem(color: string, name: string, amount: number, total: boolean): HTMLLIElement {
  const item = document.createElement('li')
  const swatch = document.createElement('i')
  swatch.setAttribute('aria-hidden', 'true')
  swatch.style.color = color
  if (total) swatch.className = 'swatch-total'
  else swatch.style.background = color
  const label = document.createElement('span')
  label.className = 'legend-name'
  label.textContent = name
  const value = document.createElement('span')
  value.className = 'legend-amount'
  const figure = document.createElement('b')
  figure.textContent = formatDamage(amount)
  const unit = document.createElement('small')
  unit.textContent = 'damage'
  value.append(figure, unit)
  item.append(swatch, label, value)
  return item
}

type DamageSample = Record<DamageSource, number> & { t: number; total: number }

function damageSamples(game: GameState): DamageSample[] {
  const acc: Record<DamageSource, number> = { stream: 0, orbiter: 0, field: 0, ball: 0, drone: 0 }
  const samples: DamageSample[] = []
  const push = (t: number) => {
    samples.push({
      t,
      stream: acc.stream,
      orbiter: acc.orbiter,
      field: acc.field,
      ball: acc.ball,
      drone: acc.drone,
      total: acc.stream + acc.orbiter + acc.field + acc.ball + acc.drone,
    })
  }
  push(0)
  for (const bin of game.damageBins) {
    acc.stream += bin.stream
    acc.orbiter += bin.orbiter
    acc.field += bin.field
    acc.ball += bin.ball
    acc.drone += bin.drone
    const at = Math.min(Math.max(game.time, 0), bin.t + 0.5)
    if (at > samples[samples.length - 1].t) push(at)
  }
  const end = Math.max(game.time, 0)
  if (samples[samples.length - 1].t < end) push(end)
  return samples
}

function valueAt(samples: DamageSample[], source: DamageSource, t: number): number {
  let value = 0
  for (const sample of samples) {
    if (sample.t > t + 0.0001) break
    value = sample[source]
  }
  return value
}

function niceCeiling(value: number): number {
  if (value <= 0) return 4
  const padded = value * 1.08
  const pow = 10 ** Math.floor(Math.log10(padded))
  const unit = padded / pow
  const step = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10
  return step * pow
}

function formatDamage(value: number): string {
  if (value >= 1000) return `${Math.round(value).toLocaleString('en-US')}`
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

function reform(): void {
  closeTimeline()
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
  if (key === 'escape' && !timelineEl.hidden) {
    closeTimeline()
    return
  }
  if (state.phase === 'level' && (key === '1' || key === '2' || key === '3')) {
    pickUpgrade(Number(key) - 1)
    return
  }
  if (key === 'r' && state.phase === 'dead') reform()
  if (key === 'f') toggleFull()
}

function touchControl(event: PointerEvent): boolean {
  return event.pointerType === 'touch' || event.pointerType === 'pen'
}

function gestureTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, a, input, textarea, #level, #overlay, #timeline'))
}

function releaseSticks(): void {
  stick = null
  aimStick = null
}

function releaseMissing(live: Set<number>): void {
  if (stick && !live.has(stick.id)) stick = null
  if (aimStick && !live.has(aimStick.id)) aimStick = null
}

function placeStick(id: number, x: number, y: number): void {
  const next = { id, originX: x, originY: y, x, y }
  const left = x < window.innerWidth * 0.5
  if (left) {
    if (!stick || stick.id === id) stick = next
    return
  }
  if (!aimStick || aimStick.id === id) aimStick = next
}

function moveStick(id: number, x: number, y: number): void {
  if (stick && stick.id === id) {
    stick.x = x
    stick.y = y
  }
  if (aimStick && aimStick.id === id) {
    aimStick.x = x
    aimStick.y = y
  }
}

function onTouchStart(event: TouchEvent): void {
  audio.ensure()
  if (!gestureTarget(event.target)) event.preventDefault()
  releaseMissing(new Set(Array.from(event.touches, (touch) => touch.identifier)))
  if (gestureTarget(event.target)) return
  for (const touch of event.changedTouches) placeStick(touch.identifier, touch.clientX, touch.clientY)
}

function onTouchMove(event: TouchEvent): void {
  if (!gestureTarget(event.target)) event.preventDefault()
  releaseMissing(new Set(Array.from(event.touches, (touch) => touch.identifier)))
  for (const touch of event.touches) moveStick(touch.identifier, touch.clientX, touch.clientY)
}

function onTouchEnd(event: TouchEvent): void {
  if (!gestureTarget(event.target)) event.preventDefault()
  releaseMissing(new Set(Array.from(event.touches, (touch) => touch.identifier)))
}

function onPointerDown(event: PointerEvent): void {
  audio.ensure()
  if (!touchControl(event)) {
    pointerX = event.clientX
    pointerY = event.clientY
    pointerOn = true
    return
  }
  if (event.pointerType === 'touch') return
  if (gestureTarget(event.target)) return
  event.preventDefault()
  placeStick(event.pointerId, event.clientX, event.clientY)
}

function onPointerMove(event: PointerEvent): void {
  if (touchControl(event)) {
    moveStick(event.pointerId, event.clientX, event.clientY)
    return
  }
  pointerX = event.clientX
  pointerY = event.clientY
  pointerOn = true
}

function onPointerUp(event: PointerEvent): void {
  if (stick && event.pointerId === stick.id) stick = null
  if (aimStick && event.pointerId === aimStick.id) aimStick = null
}

function resize(): void {
  if (!timelineEl.hidden) paintTimeline(state)
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
