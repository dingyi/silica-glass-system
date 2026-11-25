import * as React from "react"
import { haptic } from "@/lib/haptics"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
} from "@ui-sdk/react/number-input"

export function GlassNumberStepper({
  label,
  value: controlled,
  defaultValue = 24,
  min = 1,
  max = 240,
  step = 1,
  onValueChange,
}: {
  label: string
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number | null) => void
}) {
  const [stored, setStored] = React.useState<number | null>(defaultValue)
  const val = controlled !== undefined ? controlled : stored

  return (
    <NumberInput
      value={val}
      min={min}
      max={max}
      step={step}
      onValueChange={(next) => {
        haptic("selection")
        if (controlled === undefined) setStored(next)
        onValueChange?.(next)
      }}
    >
      <Field data-kit="field" style={{ display: "grid", gap: 8, justifyItems: "center" }}>
        <NumberInputScrubArea orientation="horizontal" pixelsPerStep={3}>
          <FieldLabel data-kit="scrub-label">{label} ↔</FieldLabel>
        </NumberInputScrubArea>
        <NumberInputGroup data-kit="stepper">
          <NumberInputDecrement
            data-kit="button"
            data-variant="icon"
            aria-label={`Decrease ${label}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </NumberInputDecrement>
          <NumberInputControl data-kit="stepper-input" aria-label={label} />
          <NumberInputIncrement
            data-kit="button"
            data-variant="icon"
            aria-label={`Increase ${label}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </NumberInputIncrement>
        </NumberInputGroup>
      </Field>
    </NumberInput>
  )
}
