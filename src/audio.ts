export class AudioBus {
  muted: boolean
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private droneOn = false

  constructor() {
    this.muted = readFlag('lumen-pit-mute')
  }

  ensure(): void {
    if (this.muted) return
    const ctx = this.context()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  }

  toggle(): boolean {
    this.muted = !this.muted
    writeFlag('lumen-pit-mute', this.muted)
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.22
    if (!this.muted) this.ensure()
    return this.muted
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend()
  }

  resume(): void {
    if (!this.muted && this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
  }

  shot(): void {
    this.blip(1460, 0.032, 'sine', 0.028, 420)
  }

  kill(): void {
    this.blip(340, 0.09, 'triangle', 0.05, 240)
  }

  hurt(): void {
    this.blip(96, 0.2, 'sine', 0.07, -50)
  }

  die(): void {
    this.blip(168, 0.42, 'sawtooth', 0.055, -120)
  }

  private context(): AudioContext | null {
    if (this.ctx && this.master) return this.ctx
    try {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = this.muted ? 0 : 0.22
      master.connect(ctx.destination)
      this.ctx = ctx
      this.master = master
      if (!this.droneOn) {
        this.droneOn = true
        this.drone(ctx, master)
      }
      return ctx
    } catch {
      this.muted = true
      return null
    }
  }

  private drone(ctx: AudioContext, master: GainNode): void {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 160
    const gain = ctx.createGain()
    gain.gain.value = 0.16
    filter.connect(gain)
    gain.connect(master)
    for (const freq of [55, 82.4]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(filter)
      osc.start()
    }
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    gainValue: number,
    slide: number,
  ): void {
    if (this.muted || !this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(40, freq), t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur)
    gain.gain.setValueAtTime(gainValue, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch {
    /* private mode */
  }
}
