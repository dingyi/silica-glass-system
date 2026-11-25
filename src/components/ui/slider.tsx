import * as React from "react"
import { crosses, haptic } from "@/lib/haptics"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import {
  Slider,
  SliderControl,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react/slider"

const TICKS = 25

export function GlassSlider({
  label,
  value: controlled,
  defaultValue = 64,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
  onValueChange,
}: {
  label: string
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  unit?: string
  onValueChange?: (value: number) => void
}) {
  const [stored, setStored] = React.useState(defaultValue)
  const current = controlled ?? stored
  const detent = (max - min) / 20
  const lastRef = React.useRef(current)

  const handleChange = (nextVal: number | number[]) => {
    const val = Array.isArray(nextVal) ? nextVal[0] : nextVal
    if (crosses(lastRef.current - min, val - min, detent)) {
      haptic("selection")
    }
    lastRef.current = val
    if (controlled === undefined) setStored(val)
    onValueChange?.(val)
  }

  const norm = max > min ? (current - min) / (max - min) : 0
  const litCutoff = Math.round(norm * (TICKS - 1))

  return (
    <Field data-kit="field" style={{ width: "100%" }}>
      <Slider
        data-kit="slider"
        value={current}
        min={min}
        max={max}
        step={step}
        onValueChange={handleChange}
      >
        <div data-kit="slider-head">
          <FieldLabel data-kit="scrub-label">{label}</FieldLabel>
          <SliderValue>
            {() => `${Math.round(current)}${unit}`}
          </SliderValue>
        </div>

        <SliderControl data-kit="slider-control">
          <div data-kit="slider-ruler" aria-hidden="true">
            {Array.from({ length: TICKS }, (_, i) => (
              <span
                key={i}
                data-kit="slider-tick"
                data-major={i % 6 === 0 ? "true" : undefined}
                data-lit={i <= litCutoff ? "true" : undefined}
              />
            ))}
          </div>
          <SliderTrack data-kit="slider-track">
            <SliderThumb
              data-kit="slider-thumb"
              aria-label={label}
            >
              <span data-kit="slider-thumb-label" aria-hidden="true">
                {Math.round(current)}
                {unit}
              </span>
            </SliderThumb>
          </SliderTrack>
        </SliderControl>
      </Slider>
    </Field>
  )
}

export function GlassRangeSlider({
  label,
  defaultValue = [24, 78],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
}: {
  label: string
  defaultValue?: [number, number]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: [number, number]) => void
}) {
  const [val, setVal] = React.useState<[number, number]>(defaultValue)
  const lo = Math.round(((val[0] - min) / (max - min)) * (TICKS - 1))
  const hi = Math.round(((val[1] - min) / (max - min)) * (TICKS - 1))
  const lastRef = React.useRef<[number, number]>(val)
  const detent = (max - min) / 20

  return (
    <Field data-kit="field" style={{ width: "100%" }}>
      <Slider
        data-kit="slider"
        value={val}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={12}
        onValueChange={(next) => {
          if (!Array.isArray(next)) return
          const pair: [number, number] = [next[0], next[1]]
          if (
            crosses(lastRef.current[0] - min, pair[0] - min, detent) ||
            crosses(lastRef.current[1] - min, pair[1] - min, detent)
          ) {
            haptic("selection")
          }
          lastRef.current = pair
          setVal(pair)
          onValueChange?.(pair)
        }}
      >
        <div data-kit="slider-head">
          <FieldLabel data-kit="scrub-label">{label}</FieldLabel>
          <SliderValue>
            {() => `${Math.round(val[0])} – ${Math.round(val[1])}%`}
          </SliderValue>
        </div>

        <SliderControl data-kit="slider-control">
          <div data-kit="slider-ruler" aria-hidden="true">
            {Array.from({ length: TICKS }, (_, i) => (
              <span
                key={i}
                data-kit="slider-tick"
                data-major={i % 6 === 0 ? "true" : undefined}
                data-lit={i >= lo && i <= hi ? "true" : undefined}
              />
            ))}
          </div>
          <SliderTrack data-kit="slider-track">
            <SliderThumb index={0} data-kit="slider-thumb" aria-label={`${label} minimum`}>
              <span data-kit="slider-thumb-label" aria-hidden="true">
                {Math.round(val[0])}
              </span>
            </SliderThumb>
            <SliderThumb index={1} data-kit="slider-thumb" aria-label={`${label} maximum`}>
              <span data-kit="slider-thumb-label" aria-hidden="true">
                {Math.round(val[1])}
              </span>
            </SliderThumb>
          </SliderTrack>
        </SliderControl>
      </Slider>
    </Field>
  )
}
