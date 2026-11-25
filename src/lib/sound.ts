/* ==========================================================================
   Optica Optical Glass Acoustics — Web Audio API Synthesizer
   Zero external audio assets. Synthesizes crisp crystal transients, warm
   optical housing thocks, micro-detents, and popup harmonic pings.
   ========================================================================== */

export type Voice =
  | "down"
  | "down-primary"
  | "up"
  | "latch-down"
  | "latch-up"
  | "tick"
  | "blip"
  | "open"
  | "success"
  | "error"

const STORAGE_KEY = "optica01:sound"
let enabled =
  typeof localStorage === "undefined" || localStorage.getItem(STORAGE_KEY) !== "off"
const listeners = new Set<(on: boolean) => void>()

export function soundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(on: boolean): void {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off")
  } catch {
    // ignore storage failures
  }
  listeners.forEach((fn) => fn(on))
}

export function onSoundChange(listener: (on: boolean) => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let lastPlayed = 0

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (ctx?.state === "closed") ctx = null
  if (!ctx) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return null
    ctx = new AudioCtor({ latencyHint: "interactive" })
    master = ctx.createGain()
    master.gain.value = 0.45
    master.connect(ctx.destination)
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state !== "running") {
    ctx.resume().catch(() => {})
  }
  return ctx
}

export function unlockAudio(): void {
  if (enabled && typeof window !== "undefined") audio()
}

const vary = (amt: number) => 1 + (Math.random() * 2 - 1) * amt

function burst(
  at: number,
  {
    type = "bandpass",
    freq,
    q = 1,
    level,
    decay,
  }: {
    type?: BiquadFilterType
    freq: number
    q?: number
    level: number
    decay: number
  }
) {
  if (!ctx || !master || !noise) return
  const source = ctx.createBufferSource()
  source.buffer = noise
  source.playbackRate.value = vary(0.08)

  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq * vary(0.05)
  filter.Q.value = q

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(level * vary(0.12), at + 0.0008)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)

  source.connect(filter).connect(gain).connect(master)
  source.start(at, Math.random() * 0.25)
  source.stop(at + decay + 0.02)
}

function tone(
  at: number,
  {
    type = "sine",
    freq,
    to = freq,
    level,
    decay,
    attack = 0.001,
  }: {
    type?: OscillatorType
    freq: number
    to?: number
    level: number
    decay: number
    attack?: number
  }
) {
  if (!ctx || !master) return
  const osc = ctx.createOscillator()
  osc.type = type
  const f = freq * vary(0.03)
  osc.frequency.setValueAtTime(f, at)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, (to / freq) * f), at + decay)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(level * vary(0.1), at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)

  osc.connect(gain).connect(master)
  osc.start(at)
  osc.stop(at + decay + 0.02)
}

const voices: Record<Voice, (at: number) => void> = {
  down: (at) => {
    burst(at, { freq: 3100, q: 1.2, level: 0.22, decay: 0.018 })
    tone(at, { type: "triangle", freq: 320, to: 170, level: 0.22, decay: 0.036 })
  },
  "down-primary": (at) => {
    burst(at, { freq: 2500, q: 1.0, level: 0.26, decay: 0.022 })
    tone(at, { type: "triangle", freq: 240, to: 120, level: 0.28, decay: 0.048 })
  },
  up: (at) => {
    burst(at, { freq: 4400, q: 1.4, level: 0.14, decay: 0.01 })
    tone(at, { freq: 640, to: 420, level: 0.08, decay: 0.018 })
  },
  "latch-down": (at) => {
    burst(at, { freq: 2400, q: 1.1, level: 0.15, decay: 0.015 })
    tone(at, { freq: 240, to: 150, level: 0.14, decay: 0.032 })
  },
  "latch-up": (at) => {
    burst(at, { freq: 3600, q: 1.3, level: 0.12, decay: 0.012 })
    tone(at, { freq: 920, to: 680, level: 0.06, decay: 0.016 })
  },
  tick: (at) => {
    burst(at, { type: "highpass", freq: 3800, q: 0.8, level: 0.14, decay: 0.006 })
    tone(at, { freq: 2200, to: 980, level: 0.04, decay: 0.012 })
  },
  blip: (at) => {
    tone(at, { type: "sine", freq: 1540, to: 1120, level: 0.045, decay: 0.032, attack: 0.0015 })
  },
  open: (at) => {
    burst(at, { freq: 3200, q: 1.2, level: 0.08, decay: 0.01 })
    tone(at, { freq: 680, to: 1080, level: 0.045, decay: 0.055, attack: 0.002 })
  },
  success: (at) => {
    tone(at, { freq: 1175, level: 0.055, decay: 0.08, attack: 0.003 })
    tone(at + 0.065, { freq: 1568, level: 0.055, decay: 0.13, attack: 0.003 })
  },
  error: (at) => {
    tone(at, { type: "triangle", freq: 310, level: 0.07, decay: 0.08 })
    tone(at + 0.09, { type: "triangle", freq: 240, level: 0.07, decay: 0.12 })
  },
}

export function playVoice(voice: Voice): void {
  if (!enabled || typeof window === "undefined") return
  const c = audio()
  if (!c || !master) return
  lastPlayed = performance.now()
  voices[voice](c.currentTime + 0.002)
}

let pointerTarget: Element | null = null
let pointerAt = 0
let downKey: Element | null = null

const keyLike = '[data-kit="button"], [data-kit="step-dot"]'
const screenLike = '[data-kit="wheel"], [data-kit="command-list"], [data-kit="select-content"]'

export function soundFor(
  kind: "selection" | "light" | "medium" | "heavy" | "soft" | "rigid" | "success" | "warning" | "error"
): void {
  const el = performance.now() - pointerAt < 1500 ? pointerTarget : document.activeElement
  switch (kind) {
    case "selection":
      return playVoice(el?.closest?.(screenLike) ? "blip" : "tick")
    case "light":
    case "medium":
    case "heavy": {
      const key = el?.closest?.(keyLike)
      if (key && key === downKey) {
        downKey = null
        return playVoice("up")
      }
      return playVoice(kind === "light" ? "down" : "down-primary")
    }
    case "rigid":
      return playVoice("latch-down")
    case "soft":
      return playVoice("latch-up")
    case "success":
      return playVoice("success")
    case "warning":
    case "error":
      return playVoice("error")
  }
}

const soundingSlots = /-(content|popup|positioner)$/
const silentSlots = /^(hover-card|tooltip)-/

export function installSound(): void {
  if (typeof document === "undefined") return

  for (const type of ["pointerdown", "pointerup", "touchend", "keydown", "click"]) {
    document.addEventListener(type, unlockAudio, { capture: true, passive: true })
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx && ctx.state !== "running") {
      ctx.resume().catch(() => {})
    }
  })

  // Watch UI SDK popups/dialogs opening via [data-open][data-slot]
  const heard = new WeakSet<Element>()
  const opened = (el: Element) => {
    const slot = el.getAttribute("data-slot") ?? ""
    if (!el.hasAttribute("data-open") || !soundingSlots.test(slot) || silentSlots.test(slot) || heard.has(el)) {
      return false
    }
    heard.add(el)
    return true
  }
  new MutationObserver((records) => {
    let shouldOpen = false
    for (const record of records) {
      if (record.type === "attributes") {
        const el = record.target as Element
        if (!el.hasAttribute("data-open")) heard.delete(el)
        else if (opened(el)) shouldOpen = true
      } else {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          if (opened(node)) shouldOpen = true
          for (const el of node.querySelectorAll("[data-open][data-slot]")) {
            if (opened(el)) shouldOpen = true
          }
        }
      }
    }
    if (shouldOpen && performance.now() - lastPlayed >= 150) {
      playVoice("open")
    }
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-open"],
  })

  document.addEventListener(
    "pointerdown",
    (event) => {
      pointerTarget = event.target as Element | null
      pointerAt = performance.now()
      if (event.button !== 0) return
      const key = (event.target as Element | null)?.closest?.(keyLike)
      if (!key || key.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return
      downKey = key
      playVoice(key.matches('[data-variant="track"]') ? "down-primary" : "down")
    },
    true
  )
}
