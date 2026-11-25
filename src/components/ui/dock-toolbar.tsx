import * as React from "react"
import { playVoice } from "@/lib/sound"
import { Toggle } from "@ui-sdk/react/toggle"
import { Toolbar } from "@ui-sdk/react/toolbar"

export interface DockToolItem<T extends string = string> {
  id: T
  label: string
  icon: React.ReactNode
}

export function GlassDock<T extends string = string>({
  label = "Optical tools",
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
}: {
  label?: string
  items: readonly DockToolItem<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
}) {
  const [stored, setStored] = React.useState<T>(defaultValue ?? items[0].id)
  const activeId = controlledValue ?? stored
  const activeIdx = Math.max(
    0,
    items.findIndex((i) => i.id === activeId)
  )
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const lensIdx = hoverIdx ?? activeIdx

  const dockRef = React.useRef<HTMLDivElement>(null)
  const pillRef = React.useRef<HTMLSpanElement>(null)
  const lensRef = React.useRef<HTMLSpanElement>(null)
  const lastBoxRef = React.useRef<{ x: number; w: number } | null>(null)
  const animsRef = React.useRef<Animation[]>([])

  const moveLens = React.useCallback((idx: number, animate: boolean) => {
    const dock = dockRef.current
    const pill = pillRef.current
    const lens = lensRef.current
    if (!dock) return

    const btns = [...dock.querySelectorAll<HTMLElement>('[data-kit="dock-item"]')]
    const btn = btns[idx]
    if (!btn) return

    const nextBox = { x: btn.offsetLeft, w: btn.offsetWidth }
    const prevBox = lastBoxRef.current
    lastBoxRef.current = nextBox

    dock.style.setProperty("--dock-x", `${nextBox.x}px`)
    dock.style.setProperty("--dock-w", `${nextBox.w}px`)

    if (animate && prevBox && prevBox.x !== nextBox.x && pill) {
      for (const a of animsRef.current) a.cancel()
      const noSquish = Boolean(dock.closest('[data-no-squish="true"]'))
      const movingRight = nextBox.x > prevBox.x
      const midX = prevBox.x + (nextBox.x - prevBox.x) * (movingRight ? 0.25 : 0.75)
      const midR =
        prevBox.x +
        prevBox.w +
        (nextBox.x + nextBox.w - (prevBox.x + prevBox.w)) * (movingRight ? 0.75 : 0.25)

      const frames = noSquish
        ? [
            { x: prevBox.x, w: prevBox.w, offset: 0 },
            { x: nextBox.x, w: nextBox.w, offset: 1 },
          ]
        : [
            { x: prevBox.x, w: prevBox.w, offset: 0 },
            { x: midX, w: Math.max(prevBox.w, midR - midX), offset: 0.35 },
            { x: nextBox.x, w: nextBox.w, offset: 1 },
          ]
      const timing = { duration: 440, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      const nextAnims = [
        pill.animate(
          frames.map(({ x, w, offset }) => ({
            translate: `${x}px 0`,
            width: `${w}px`,
            offset,
          })),
          timing
        ),
      ]
      if (lens) {
        nextAnims.push(
          lens.animate(
            frames.map(({ x, offset }) => ({
              translate: `${4 - x}px 0`,
              offset,
            })),
            timing
          )
        )
      }
      animsRef.current = nextAnims
    }
  }, [])

  React.useLayoutEffect(() => {
    moveLens(lensIdx, Boolean(lastBoxRef.current))
  }, [lensIdx, moveLens])

  return (
    <Toolbar
      ref={dockRef}
      data-kit="dock"
      aria-label={label}
      onPointerLeave={() => setHoverIdx(null)}
    >
      <span ref={pillRef} data-kit="dock-pill" aria-hidden="true">
        <span ref={lensRef} data-kit="dock-lens">
          {items.map((item, idx) => (
            <span
              key={item.id}
              data-kit="dock-lens-item"
              style={{ "--shift": lensIdx - idx } as React.CSSProperties}
            >
              {item.icon}
            </span>
          ))}
        </span>
      </span>

      {items.map((item, idx) => {
        const pressed = item.id === activeId
        return (
          <Toggle
            key={item.id}
            data-kit="dock-item"
            data-under-lens={idx === lensIdx ? "true" : undefined}
            aria-label={item.label}
            pressed={pressed}
            onPressedChange={(next) => {
              if (!next && pressed) return
              if (controlledValue === undefined) setStored(item.id)
              onValueChange?.(item.id)
              setHoverIdx(idx)
            }}
            onPointerEnter={() => {
              if (idx !== lensIdx) {
                playVoice("tick")
                setHoverIdx(idx)
              }
            }}
            onFocus={() => setHoverIdx(idx)}
          >
            {item.icon}
          </Toggle>
        )
      })}
    </Toolbar>
  )
}
