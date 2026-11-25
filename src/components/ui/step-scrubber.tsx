import * as React from "react"
import { haptic } from "@/lib/haptics"
import { createParts } from "@ui-sdk/react/primitive"
import { stepScrubber } from "@/primitives/step-scrubber"

const {
  Root: StepScrubberRoot,
  Track: StepScrubberTrack,
  Step: StepScrubberStep,
  Thumb: StepScrubberThumb,
  Tooltip: StepScrubberTooltip,
} = createParts(stepScrubber, {
  root: "div",
  track: "div",
  step: "button",
  thumb: "span",
  tooltip: "div",
})

export function GlassStepScrubber({
  labels,
  value: controlledValue,
  defaultValue = 0,
  onValueChange,
}: {
  labels: string[]
  value?: number
  defaultValue?: number
  onValueChange?: (index: number) => void
}) {
  const [stored, setStored] = React.useState(defaultValue)
  const current = controlledValue ?? stored

  return (
    <StepScrubberRoot
      count={labels.length}
      labels={labels}
      value={current}
      onValueChange={(next) => {
        if (next !== current) haptic("selection")
        if (controlledValue === undefined) setStored(next)
        onValueChange?.(next)
      }}
    >
      {(state) => (
        <>
          <StepScrubberTooltip>{state.tipLabel}</StepScrubberTooltip>
          <StepScrubberTrack role="group" aria-label="Walkthrough steps">
            <StepScrubberThumb>{state.value + 1}</StepScrubberThumb>
            {labels.map((lbl, idx) => (
              <StepScrubberStep
                key={lbl}
                index={idx}
                data-kit="step-dot"
                aria-label={`Step ${idx + 1}: ${lbl}`}
              />
            ))}
          </StepScrubberTrack>
        </>
      )}
    </StepScrubberRoot>
  )
}
