import * as React from "react"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { useShortcut } from "@ui-sdk/react/shortcuts"
import { GlassKeycap } from "@/components/ui/button"
import { useOpticalLens } from "@/components/ui/use-optical-lens"

export interface GlassSegmentOption<T extends string = string> {
  value: T
  label: string
  shortcut?: string
  icon?: React.ReactNode
}

function ShortcutRegistrar<T extends string>({
  keys,
  value,
  onPick,
}: {
  keys?: string
  value: T
  onPick: (val: T) => void
}) {
  useShortcut(keys ?? null, () => onPick(value), { description: `Switch to ${value}` })
  return null
}

export function GlassSegmented<T extends string = string>({
  label,
  ariaLabel,
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  iconsOnly = false,
  compact = false,
}: {
  label?: string
  ariaLabel?: string
  options: readonly GlassSegmentOption<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  iconsOnly?: boolean
  compact?: boolean
}) {
  const [stored, setStored] = React.useState<T>(defaultValue ?? options[0].value)
  const current = controlledValue ?? stored

  const select = React.useCallback(
    (next: T) => {
      if (controlledValue === undefined) setStored(next)
      onValueChange?.(next)
    },
    [controlledValue, onValueChange]
  )

  const values = React.useMemo(() => options.map((o) => o.value), [options])

  const { rootRef, indicatorRef, lensRef, activeIndex, startDrag, onClickCapture } =
    useOpticalLens<T>({
      values,
      activeValue: current,
      itemSelector: '[data-slot="segmented-control-item"]',
      onSelect: select,
    })

  const control = (
    <SegmentedControl
      ref={rootRef}
      data-kit="segmented"
      data-icons={iconsOnly ? "true" : undefined}
      data-compact={compact ? "true" : undefined}
      aria-label={!label ? ariaLabel : undefined}
      value={current}
      onValueChange={(next) => {
        if (next) select(next as T)
      }}
      onClickCapture={onClickCapture}
    >
      {options.map((opt) =>
        opt.shortcut ? (
          <ShortcutRegistrar
            key={`sc-${opt.value}`}
            keys={opt.shortcut}
            value={opt.value}
            onPick={select}
          />
        ) : null
      )}

      <SegmentedControlIndicator
        ref={indicatorRef}
        data-kit="segmented-indicator"
      >
        <span ref={lensRef} data-kit="lens-track" aria-hidden="true">
          {options.map((opt, idx) => (
            <span
              key={opt.value}
              data-kit="lens-item"
              style={{ "--shift": activeIndex - idx } as React.CSSProperties}
            >
              {opt.icon}
              {opt.shortcut ? (
                <GlassKeycap>{opt.shortcut.toUpperCase()}</GlassKeycap>
              ) : null}
              {!iconsOnly ? <span>{opt.label}</span> : null}
            </span>
          ))}
        </span>
      </SegmentedControlIndicator>

      {options.map((opt, idx) => (
        <SegmentedControlItem
          key={opt.value}
          value={opt.value}
          data-kit="segment"
          aria-label={iconsOnly ? opt.label : undefined}
          aria-keyshortcuts={opt.shortcut?.toUpperCase()}
          onPointerDown={(ev) => startDrag(ev, idx)}
        >
          {opt.icon}
          {opt.shortcut ? (
            <GlassKeycap aria-hidden="true">{opt.shortcut.toUpperCase()}</GlassKeycap>
          ) : null}
          {!iconsOnly ? <span>{opt.label}</span> : null}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )

  if (!label) return control

  return (
    <Field data-kit="field">
      <FieldLabel data-kit="scrub-label">{label}</FieldLabel>
      {control}
    </Field>
  )
}
