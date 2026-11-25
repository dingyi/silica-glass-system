import * as React from "react"
import { haptic } from "@/lib/haptics"
import {
  NumberInput,
  NumberInputControl,
  NumberInputScrubArea,
} from "@ui-sdk/react/number-input"

const KNOB_TICKS = 27
const litTicks = (value: number, min: number, max: number) =>
  Math.floor(((value - min) / Math.max(1, max - min)) * KNOB_TICKS)

function KnobTicks({ lit }: { lit: number }) {
  return (
    <svg data-kit="knob-ticks" viewBox="-50 -50 100 100" aria-hidden="true">
      {Array.from({ length: KNOB_TICKS + 1 }, (_, i) => {
        const angle = ((-135 + (i / KNOB_TICKS) * 270 - 90) * Math.PI) / 180
        return (
          <line
            key={i}
            x1={Math.cos(angle) * 39}
            y1={Math.sin(angle) * 39}
            x2={Math.cos(angle) * 47}
            y2={Math.sin(angle) * 47}
            data-major={i % 9 === 0 ? "true" : undefined}
            data-lit={i <= lit ? "true" : undefined}
          />
        )
      })}
    </svg>
  )
}

export function OpticalKnob({
  label,
  value: controlled,
  defaultValue = 50,
  min = 0,
  max = 100,
  onValueChange,
}: {
  label: string
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  onValueChange?: (value: number) => void
}) {
  const [stored, setStored] = React.useState<number | null>(defaultValue)
  const value = controlled ?? stored
  const numeric = value ?? min

  const handleChange = (next: number | null) => {
    if (controlled === undefined) setStored(next)
    if (next === null) return
    if (litTicks(numeric, min, max) !== litTicks(next, min, max)) {
      haptic("selection")
    }
    onValueChange?.(next)
  }

  const share = (numeric - min) / Math.max(1, max - min)

  return (
    <NumberInput min={min} max={max} value={value} onValueChange={handleChange}>
      <div
        data-kit="knob"
        style={{ "--turn": `${share * 270 - 135}deg` } as React.CSSProperties}
      >
        <NumberInputScrubArea
          data-kit="knob-dial"
          orientation="vertical"
          pixelsPerStep={2}
        >
          <KnobTicks lit={litTicks(numeric, min, max)} />
          <div data-kit="knob-cap">
            <div data-kit="knob-disc">
              <div data-kit="knob-rotor">
                <span data-kit="knob-pip" />
              </div>
            </div>
          </div>
        </NumberInputScrubArea>
        <NumberInputControl data-kit="knob-readout" aria-label={label} />
        <span data-kit="knob-label">{label}</span>
      </div>
    </NumberInput>
  )
}
