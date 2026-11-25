import * as React from "react"
import { haptic } from "@/lib/haptics"
import { Switch as SdkSwitch, SwitchThumb } from "@ui-sdk/react/switch"

export function GlassSwitch({
  label,
  description,
  checked: controlled,
  defaultChecked = false,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [stored, setStored] = React.useState(Boolean(defaultChecked))
  const isChecked = controlled ?? stored
  const thumbRef = React.useRef<HTMLSpanElement>(null)
  const drag = React.useRef<{ x: number; moved: boolean; from: boolean; at: number } | null>(null)
  const ignoreClick = React.useRef(false)

  const commit = (next: boolean) => {
    if (next !== isChecked) {
      haptic("medium")
      const el = thumbRef.current
      if (el && !el.closest('[data-no-squish="true"]')) {
        const fromX = next ? 0 : 24
        const toX = next ? 24 : 0
        const midX = next ? 10 : 6
        el.animate(
          [
            { translate: `${fromX}px 0`, width: "28px", offset: 0 },
            { translate: `${midX}px 0`, width: "36px", offset: 0.32 },
            { translate: `${toX}px 0`, width: "28px", offset: 1 },
          ],
          { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        )
      }
    }
    if (controlled === undefined) setStored(next)
    onCheckedChange?.(next)
  }

  return (
    <label data-kit="switch-row">
      <div data-kit="switch-meta">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </div>
      <SdkSwitch
        data-kit="switch"
        checked={isChecked}
        onCheckedChange={(next) => {
          if (ignoreClick.current) return
          commit(next)
        }}
        onPointerDown={(ev) => {
          if (ev.button !== 0) return
          drag.current = {
            x: ev.clientX,
            moved: false,
            from: isChecked,
            at: isChecked ? 1 : 0,
          }
        }}
        onPointerMove={(ev) => {
          const cur = drag.current
          if (!cur) return
          const dx = ev.clientX - cur.x
          const el = ev.currentTarget
          if (!cur.moved) {
            if (Math.abs(dx) < 3) return
            cur.moved = true
            el.setPointerCapture(ev.pointerId)
            el.dataset.dragging = ""
          }
          const thumb = thumbRef.current
          if (!thumb) return
          const travel = el.clientWidth - thumb.offsetWidth - 10
          cur.at = Math.min(1, Math.max(0, (cur.from ? 1 : 0) + dx / Math.max(1, travel)))
          el.style.setProperty("--switch-drag-x", `${cur.at * travel}px`)
        }}
        onPointerUp={(ev) => {
          const cur = drag.current
          drag.current = null
          if (!cur?.moved) return
          const el = ev.currentTarget
          delete el.dataset.dragging
          el.style.removeProperty("--switch-drag-x")
          commit(cur.at > 0.5)
          ignoreClick.current = true
          setTimeout(() => {
            ignoreClick.current = false
          })
        }}
      >
        <span data-kit="switch-marks" aria-hidden="true">
          <span>O</span>
          <span>I</span>
        </span>
        <SwitchThumb ref={thumbRef} data-kit="switch-thumb">
          <span data-kit="switch-glyph" aria-hidden="true">
            {isChecked ? "I" : "O"}
          </span>
        </SwitchThumb>
      </SdkSwitch>
    </label>
  )
}
