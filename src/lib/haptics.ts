import { soundFor } from "@/lib/sound"

export type Haptic =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "soft"
  | "rigid"
  | "success"
  | "warning"
  | "error"

const patterns: Record<Haptic, number | number[]> = {
  selection: 8,
  light: 12,
  rigid: 14,
  soft: 18,
  medium: 22,
  heavy: 36,
  success: [14, 70, 22],
  warning: [24, 90, 24],
  error: [28, 60, 28, 60, 28],
}

const canVibrate = () =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function"

const hasSwitch = () =>
  typeof HTMLInputElement !== "undefined" && "switch" in HTMLInputElement.prototype

let hiddenLabel: HTMLLabelElement | null = null

function tapSwitch() {
  if (!hiddenLabel) {
    hiddenLabel = document.createElement("label")
    hiddenLabel.dataset.hapticSwitch = ""
    hiddenLabel.inert = true
    hiddenLabel.setAttribute("aria-hidden", "true")
    hiddenLabel.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0.01;pointer-events:none"
    const input = document.createElement("input")
    input.type = "checkbox"
    input.setAttribute("switch", "")
    input.tabIndex = -1
    hiddenLabel.append(input)
    document.body.append(hiddenLabel)
  }
  hiddenLabel.click()
}

let last = 0

export function haptic(kind: Haptic): void {
  if (typeof document === "undefined") return
  const now = performance.now()
  if (now - last < 30) return
  last = now
  soundFor(kind)
  if (canVibrate()) {
    navigator.vibrate(patterns[kind])
  } else if (hasSwitch()) {
    if (navigator.userActivation && !navigator.userActivation.isActive) return
    tapSwitch()
  }
}

export const crosses = (from: number, to: number, size: number): boolean =>
  size > 0 && Math.floor(from / size) !== Math.floor(to / size)

let pressed = { x: 0, y: 0 }
let moved = false

const presses: [string, Haptic | "none" | ((el: Element) => Haptic | "none")][] = [
  ['[data-kit="switch"]', "medium"],
  ['[data-kit="slider-control"]', () => (moved || performance.now() - last < 200 ? "none" : "selection")],
  [
    [
      '[data-kit="segment"]',
      '[data-kit="tab"]',
      '[data-kit="swatch"]',
      '[data-kit="dock-item"]',
      '[data-kit="step-dot"]',
      '[data-kit="toggle"]',
      '[role="option"]',
      '[role="menuitem"]',
      '[data-kit="accordion-trigger"]',
    ].join(", "),
    "selection",
  ],
  [
    '[data-kit="button"]',
    (el) => (el.matches('[data-variant="track"]') ? "medium" : "light"),
  ],
]

export function installHaptics(): void {
  if (typeof document === "undefined") return
  document.addEventListener(
    "pointerdown",
    (event) => {
      pressed = { x: event.clientX, y: event.clientY }
    },
    true
  )
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null
      if (!target?.closest) return
      if (target.closest("[data-haptic-switch]")) return
      moved = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 6
      for (const [selector, kind] of presses) {
        const el = target.closest(selector)
        if (!el) continue
        if (el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return
        const tap = typeof kind === "function" ? kind(el) : kind
        if (tap !== "none") haptic(tap)
        return
      }
    },
    true
  )
}
