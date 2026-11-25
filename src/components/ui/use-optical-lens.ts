import * as React from "react"
import { haptic } from "@/lib/haptics"
import { playVoice } from "@/lib/sound"

export const SPRING = {
  stiffness: 900,
  damping: 42,
  stretch: 0.015,
  stretchMax: 22,
  thin: 0.0015,
  thinMax: 2.5,
}

const activeAnimations = new WeakMap<HTMLElement, Animation[]>()

function rubberBand(norm: number): number {
  if (norm < 0) return 1 + 0.05 * Math.log10(1 - 2 * norm)
  if (norm > 1) return 1 + 0.05 * Math.log10(1 + (norm - 1) * 2)
  return 1
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function isSquishDisabled(el: HTMLElement): boolean {
  return Boolean(el.closest('[data-no-squish="true"]'))
}

function cancelAnims(pill: HTMLElement) {
  const list = activeAnimations.get(pill)
  if (list) {
    for (const a of list) a.cancel()
    activeAnimations.delete(pill)
  }
}

function readPillBox(pill: HTMLElement) {
  const cs = getComputedStyle(pill)
  return {
    x: Number.parseFloat(cs.translate) || 0,
    w: Number.parseFloat(cs.width) || pill.offsetWidth || 0,
    top: cs.top || "4px",
  }
}

function animatePillJump(
  pill: HTMLElement,
  lens: HTMLElement | null,
  from: { x: number; w: number },
  to: { x: number; w: number },
  noSquish: boolean
) {
  cancelAnims(pill)
  if (prefersReducedMotion() || (from.x === to.x && from.w === to.w)) return

  if (noSquish) {
    const opts = { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    const anims = [
      pill.animate(
        [
          { translate: `${from.x}px 0`, width: `${from.w}px` },
          { translate: `${to.x}px 0`, width: `${to.w}px` },
        ],
        opts
      ),
    ]
    if (lens) {
      anims.push(
        lens.animate(
          [{ translate: `${4 - from.x}px 0` }, { translate: `${4 - to.x}px 0` }],
          opts
        )
      )
    }
    activeAnimations.set(pill, anims)
    return
  }

  const movingRight = to.x > from.x
  const midX = lerp(from.x, to.x, movingRight ? 0.25 : 0.75)
  const midRight = lerp(from.x + from.w, to.x + to.w, movingRight ? 0.75 : 0.25)

  const frames = [
    { x: from.x, w: from.w, offset: 0 },
    { x: midX, w: Math.max(from.w, midRight - midX), offset: 0.35 },
    { x: to.x, w: to.w, offset: 1 },
  ]
  const timing = { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }

  const anims = [
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
    anims.push(
      lens.animate(
        frames.map(({ x, offset }) => ({
          translate: `${4 - x}px 0`,
          offset,
        })),
        timing
      )
    )
  }

  activeAnimations.set(pill, anims)
}

function animatePressSquish(
  pill: HTMLElement,
  lens: HTMLElement | null,
  box: { x: number; w: number },
  index: number,
  count: number
) {
  if (prefersReducedMotion() || isSquishDisabled(pill)) return
  const cur = readPillBox(pill)
  cancelAnims(pill)

  const expand = index > 0 && index < count - 1 ? 3 : 6
  const leftExpand = index > 0 ? expand : 0
  const rightExpand = index < count - 1 ? expand : 0
  const target = {
    x: box.x - leftExpand,
    w: box.w + leftExpand + rightExpand,
  }
  const timing: KeyframeAnimationOptions = {
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards",
  }

  const anims = [
    pill.animate(
      [
        { translate: `${cur.x}px 0`, width: `${cur.w}px`, top: "4px", bottom: "4px" },
        { translate: `${target.x}px 0`, width: `${target.w}px`, top: "5px", bottom: "5px" },
      ],
      timing
    ),
  ]
  if (lens) {
    anims.push(
      lens.animate(
        [{ translate: `${4 - cur.x}px 0` }, { translate: `${4 - target.x}px 0` }],
        timing
      )
    )
  }
  activeAnimations.set(pill, anims)
}

function animatePressRelease(
  pill: HTMLElement,
  lens: HTMLElement | null,
  target: { x: number; w: number }
) {
  const running = activeAnimations.get(pill)
  if (!running?.length) return

  const cur = readPillBox(pill)
  cancelAnims(pill)

  const timing = { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
  const anims = [
    pill.animate(
      [
        { translate: `${cur.x}px 0`, width: `${cur.w}px`, top: cur.top, bottom: cur.top },
        { translate: `${target.x}px 0`, width: `${target.w}px`, top: "4px", bottom: "4px" },
      ],
      timing
    ),
  ]
  if (lens) {
    anims.push(
      lens.animate(
        [{ translate: `${4 - cur.x}px 0` }, { translate: `${4 - target.x}px 0` }],
        timing
      )
    )
  }
  activeAnimations.set(pill, anims)
}

export function useOpticalLens<T extends string>({
  values,
  activeValue,
  itemSelector,
  onSelect,
}: {
  values: readonly T[]
  activeValue: T
  itemSelector: string
  onSelect: (value: T) => void
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const indicatorRef = React.useRef<HTMLSpanElement>(null)
  const lensRef = React.useRef<HTMLSpanElement>(null)
  const lastRectRef = React.useRef<{ x: number; w: number } | null>(null)
  const draggingRef = React.useRef(false)
  const suppressClickRef = React.useRef(false)

  const activeIndex = Math.max(0, values.indexOf(activeValue))

  const measure = React.useCallback(
    (animate: boolean) => {
      const root = rootRef.current
      const pill = indicatorRef.current
      const lens = lensRef.current
      if (!root) return

      const items = [...root.querySelectorAll<HTMLElement>(itemSelector)]
      const lensItems = lens ? ([...lens.children] as HTMLElement[]) : []

      items.forEach((btn, i) => {
        if (lensItems[i]) {
          lensItems[i].style.width = `${btn.offsetWidth}px`
          lensItems[i].style.setProperty("--shift", String(activeIndex - i))
        }
      })

      const activeBtn = items[activeIndex]
      if (!activeBtn) return

      const nextRect = { x: activeBtn.offsetLeft, w: activeBtn.offsetWidth }
      const prevRect = lastRectRef.current
      lastRectRef.current = nextRect

      root.style.setProperty("--pill-x", `${nextRect.x}px`)
      root.style.setProperty("--pill-w", `${nextRect.w}px`)
      root.style.setProperty("--lens-w", `${root.clientWidth - 8}px`)

      if (animate && prevRect && pill) {
        animatePillJump(pill, lens, prevRect, nextRect, isSquishDisabled(root))
      }
    },
    [activeIndex, itemSelector]
  )

  React.useLayoutEffect(() => {
    measure(true)
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => measure(false))
    ro.observe(root)
    return () => ro.disconnect()
  }, [measure])

  const startDrag = React.useCallback(
    (ev: React.PointerEvent<HTMLElement>, index: number) => {
      const root = rootRef.current
      const pill = indicatorRef.current
      const lens = lensRef.current
      if (!root || !pill || ev.button !== 0 || index !== activeIndex) return

      ev.preventDefault()
      ev.currentTarget.setPointerCapture(ev.pointerId)
      draggingRef.current = false
      suppressClickRef.current = false

      const items = [...root.querySelectorAll<HTMLElement>(itemSelector)]
      const boxes = items.map((b) => ({ x: b.offsetLeft, w: b.offsetWidth }))
      const activeBox = boxes[activeIndex]
      if (!activeBox) return

      const centers = boxes.map((b) => b.x + b.w / 2)
      const minCenter = centers[0] ?? 0
      const maxCenter = centers[centers.length - 1] ?? 0
      const scaleFactor = root.getBoundingClientRect().width / root.offsetWidth || 1
      const startX = ev.clientX
      const reduced = prefersReducedMotion()
      const lensItems = lens ? ([...lens.children] as HTMLElement[]) : []

      animatePressSquish(pill, lens, activeBox, activeIndex, items.length)
      playVoice("tick")

      let continuousIdx = activeIndex
      const sim = { x: activeBox.x, w: activeBox.w, vx: 0, vw: 0 }
      const target = { x: activeBox.x, w: activeBox.w }
      let rafId = 0
      let lastTime = 0

      const applyVisual = (x: number, w: number, thin: number) => {
        pill.style.translate = `${x}px 0`
        pill.style.width = `${w}px`
        pill.style.top = `${4 + thin}px`
        pill.style.bottom = `${4 + thin}px`
        if (lens) lens.style.translate = `${4 - x}px 0`
      }

      const stepPhysics = (now: number) => {
        const dt = lastTime ? Math.min(0.032, (now - lastTime) / 1000) : 0
        lastTime = now

        const accX = SPRING.stiffness * (target.x - sim.x) - SPRING.damping * sim.vx
        const accW = SPRING.stiffness * (target.w - sim.w) - SPRING.damping * sim.vw
        sim.vx += accX * dt
        sim.x += sim.vx * dt
        sim.vw += accW * dt
        sim.w += sim.vw * dt

        const speed = Math.abs(sim.vx)
        const noSquish = isSquishDisabled(root)
        const stretch = noSquish ? 0 : Math.min(SPRING.stretchMax, speed * SPRING.stretch)
        const thin = noSquish ? 0 : Math.min(SPRING.thinMax, speed * SPRING.thin)

        applyVisual(sim.x - (sim.vx > 0 ? stretch : 0), sim.w + stretch, thin)
        rafId = requestAnimationFrame(stepPhysics)
      }

      const updateTarget = (clientX: number) => {
        const rawCenter = (centers[activeIndex] ?? 0) + (clientX - startX) / scaleFactor
        const clampedCenter = Math.min(maxCenter, Math.max(minCenter, rawCenter))
        const norm =
          maxCenter > minCenter ? (rawCenter - minCenter) / (maxCenter - minCenter) : 0.5

        if (!reduced && !isSquishDisabled(root)) {
          root.style.transformOrigin = norm > 0.5 ? "left center" : "right center"
          const sx = rubberBand(norm)
          const sy = norm < 0 || norm > 1 ? 1 - 0.015 * sx : 1
          root.style.transform = `scale(${sx}, ${sy})`
        }

        let seg = 0
        while (seg < centers.length - 2 && clampedCenter > (centers[seg + 1] ?? 0)) {
          seg++
        }

        const boxA = boxes[seg] ?? activeBox
        const boxB = boxes[seg + 1] ?? boxA
        const span = (centers[seg + 1] ?? 0) - (centers[seg] ?? 0)
        const frac = span > 0 ? (clampedCenter - (centers[seg] ?? 0)) / span : 0

        if (Math.round(seg + frac) !== Math.round(continuousIdx)) {
          haptic("selection")
        }
        continuousIdx = seg + frac

        const interpW = lerp(boxA.w, boxB.w, frac)
        target.x = clampedCenter - interpW / 2
        target.w = interpW

        if (reduced) applyVisual(target.x, target.w, 0)
        lensItems.forEach((lbl, i) => {
          lbl.style.setProperty("--shift", String(continuousIdx - i))
        })
      }

      const onMove = (moveEv: PointerEvent) => {
        if (!draggingRef.current) {
          if (Math.abs(moveEv.clientX - startX) < 4) return
          draggingRef.current = true
          suppressClickRef.current = true
          root.dataset.dragging = ""
          const cur = readPillBox(pill)
          cancelAnims(pill)
          sim.x = cur.x
          sim.w = cur.w
          applyVisual(sim.x, sim.w, 0)
          if (!reduced) rafId = requestAnimationFrame(stepPhysics)
        }
        updateTarget(moveEv.clientX)
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)

        if (!draggingRef.current) {
          animatePressRelease(pill, lens, activeBox)
          return
        }

        delete root.dataset.dragging
        cancelAnimationFrame(rafId)

        if (!reduced) {
          const curTransform = root.style.transform || "scale(1, 1)"
          root.style.transform = ""
          root.animate([{ transform: curTransform }, { transform: "scale(1, 1)" }], {
            duration: 480,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          })
        }

        const releasedBox = readPillBox(pill)
        pill.style.removeProperty("translate")
        pill.style.removeProperty("width")
        pill.style.removeProperty("top")
        pill.style.removeProperty("bottom")
        if (lens) lens.style.removeProperty("translate")

        const snappedIdx = Math.max(
          0,
          Math.min(values.length - 1, Math.round(continuousIdx))
        )
        const nextVal = values[snappedIdx]
        draggingRef.current = false
        setTimeout(() => {
          suppressClickRef.current = false
        }, 20)

        if (nextVal !== undefined && nextVal !== activeValue) {
          lastRectRef.current = releasedBox
          onSelect(nextVal)
        } else {
          lensItems.forEach((lbl, i) => {
            lbl.style.setProperty("--shift", String(activeIndex - i))
          })
          animatePillJump(pill, lens, releasedBox, activeBox, isSquishDisabled(root))
        }
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [activeIndex, activeValue, itemSelector, onSelect, values]
  )

  const onClickCapture = React.useCallback((ev: React.MouseEvent) => {
    if (!suppressClickRef.current) return
    ev.preventDefault()
    ev.stopPropagation()
  }, [])

  return {
    rootRef,
    indicatorRef,
    lensRef,
    activeIndex,
    startDrag,
    onClickCapture,
  }
}
