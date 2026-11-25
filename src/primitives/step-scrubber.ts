import {
  createChange,
  definePrimitive,
  type ChangeDetails,
  type ChangeSource,
  type PrimitiveOptions,
} from "@ui-sdk/core"

export type StepScrubberReason = "item-press" | "list-navigation" | "drag" | "imperative"

export interface StepScrubberOptions extends PrimitiveOptions {
  value?: number
  defaultValue?: number
  count?: number
  labels?: string[]
  disabled?: boolean
  onValueChange?: (value: number, details: ChangeDetails<StepScrubberReason>) => void
}

export interface StepScrubberState {
  value: number
  count: number
  labels: string[]
  hoveredIndex: number | null
  dragging: boolean
  disabled: boolean
}

export interface StepScrubberApi {
  getValue: () => number
  setValue: (
    value: number,
    details?: { reason?: StepScrubberReason; event?: Event; source?: ChangeSource }
  ) => boolean
  internal: {
    setHovered: (index: number | null) => void
    setDragging: (dragging: boolean) => void
    stepBy: (delta: number, event?: Event) => void
    indexFromClientX: (track: HTMLElement, clientX: number) => number
  }
}

export type StepScrubberStepProps = {
  index: number
}

export type StepScrubberRootState = {
  value: number
  count: number
  dragging: boolean
  tipOpen: boolean
  tipIndex: number
  tipLabel: string
}

export type StepScrubberStepState = {
  index: number
  active: boolean
}

export const stepScrubber = definePrimitive({
  name: "step-scrubber",
  options: {
    value: "number",
    defaultValue: "number",
    count: "number",
    labels: "value",
    disabled: "boolean",
    onValueChange: "callback",
  },
  state: (options: StepScrubberOptions): StepScrubberState => ({
    value: Math.max(0, options.value ?? options.defaultValue ?? 0),
    count: Math.max(1, options.count ?? options.labels?.length ?? 12),
    labels: options.labels ?? [],
    hoveredIndex: null,
    dragging: false,
    disabled: Boolean(options.disabled),
  }),
  sync: (options) => ({
    ...(options.value !== undefined ? { value: options.value } : {}),
    ...(options.count !== undefined ? { count: Math.max(1, options.count) } : {}),
    ...(options.labels !== undefined ? { labels: options.labels } : {}),
    ...(options.disabled !== undefined ? { disabled: options.disabled } : {}),
  }),
  controlled: ["value"],
  api: (context): StepScrubberApi => {
    const change = createChange(context)
    const clamp = (v: number) => {
      const max = Math.max(0, context.store.get().count - 1)
      return Math.max(0, Math.min(max, Math.round(v)))
    }
    return {
      getValue: () => context.store.get().value,
      setValue: (
        value,
        details?: { reason?: StepScrubberReason; event?: Event; source?: ChangeSource }
      ) => {
        if (context.store.get().disabled) return false
        const next = clamp(value)
        return change("value", next, {
          reason: (details?.reason ?? "imperative") as StepScrubberReason,
          event: details?.event,
          source: details?.source,
        })
      },
      internal: {
        setHovered: (hoveredIndex) => context.store.set({ hoveredIndex }),
        setDragging: (dragging) => context.store.set({ dragging }),
        stepBy: (delta, event) => {
          const cur = context.store.get()
          if (cur.disabled) return
          const next = clamp(cur.value + delta)
          if (next !== cur.value) {
            change("value", next, { reason: "list-navigation", event })
          }
        },
        indexFromClientX: (track, clientX) => {
          const rect = track.getBoundingClientRect()
          const innerW = Math.max(1, rect.width - 8)
          const rel = Math.max(0, Math.min(1, (clientX - rect.left - 4) / innerW))
          const count = context.store.get().count
          return Math.round(rel * Math.max(0, count - 1))
        },
      },
    }
  },
  agent: {
    actions: ["setValue"],
  },
  slots: (slot) => ({
    root: slot<object, StepScrubberRootState>({
      state: (s) => {
        const tipIdx = s.hoveredIndex ?? s.value
        const lbl = s.labels[tipIdx]
        return {
          value: s.value,
          count: s.count,
          dragging: s.dragging,
          tipOpen: s.dragging || s.hoveredIndex !== null,
          tipIndex: tipIdx,
          tipLabel: lbl ? `${tipIdx + 1} · ${lbl}` : `Step ${tipIdx + 1}`,
        }
      },
      attrs: (s) => {
        const tipIdx = s.hoveredIndex ?? s.value
        return {
          "data-dragging": s.dragging ? "" : undefined,
          "data-tip-open": s.dragging || s.hoveredIndex !== null ? "" : undefined,
          style: `--step-index: ${s.value}; --tip-index: ${tipIdx};`,
        }
      },
    }),
    track: slot({
      on: {
        pointerleave: (_, { api }) => {
          api.internal.setHovered(null)
        },
        keydown: (event, { api, store }) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault()
            api.internal.stepBy(1, event)
          } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault()
            api.internal.stepBy(-1, event)
          } else if (event.key === "Home") {
            event.preventDefault()
            api.setValue(0, { reason: "list-navigation", event })
          } else if (event.key === "End") {
            event.preventDefault()
            api.setValue(store.get().count - 1, { reason: "list-navigation", event })
          }
        },
      },
      bind: (el, part) => {
        let activeId: number | null = null
        const onPointerDown = (ev: PointerEvent) => {
          if (ev.button !== 0 || part.store.get().disabled) return
          ev.preventDefault()
          activeId = ev.pointerId
          el.setPointerCapture(ev.pointerId)
          part.api.internal.setDragging(true)
          const idx = part.api.internal.indexFromClientX(el, ev.clientX)
          part.api.setValue(idx, { reason: "drag", event: ev })
        }
        const onPointerMove = (ev: PointerEvent) => {
          if (activeId !== ev.pointerId) return
          const idx = part.api.internal.indexFromClientX(el, ev.clientX)
          part.api.setValue(idx, { reason: "drag", event: ev })
        }
        const onPointerUp = (ev: PointerEvent) => {
          if (activeId !== ev.pointerId) return
          activeId = null
          part.api.internal.setDragging(false)
        }
        el.addEventListener("pointerdown", onPointerDown)
        el.addEventListener("pointermove", onPointerMove)
        el.addEventListener("pointerup", onPointerUp)
        el.addEventListener("pointercancel", onPointerUp)
        return () => {
          el.removeEventListener("pointerdown", onPointerDown)
          el.removeEventListener("pointermove", onPointerMove)
          el.removeEventListener("pointerup", onPointerUp)
          el.removeEventListener("pointercancel", onPointerUp)
        }
      },
    }),
    step: slot<StepScrubberStepProps, StepScrubberStepState>({
      props: { index: "number" },
      state: (s, { props }) => ({
        index: props.index,
        active: s.value === props.index,
      }),
      attrs: (s, { props }) => ({
        type: "button",
        "aria-pressed": String(s.value === props.index),
        tabIndex: s.value === props.index ? "0" : "-1",
      }),
      press: ({ api, props }, event) => {
        api.setValue(props.index, { reason: "item-press", event })
      },
      on: {
        pointerenter: (_, { api, props }) => {
          api.internal.setHovered(props.index)
        },
      },
    }),
    thumb: slot({
      attrs: () => ({ "aria-hidden": "true" }),
    }),
    tooltip: slot({
      attrs: () => ({ role: "status" }),
    }),
  }),
})
