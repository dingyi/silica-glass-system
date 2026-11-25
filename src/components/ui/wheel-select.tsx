import * as React from "react"
import { haptic } from "@/lib/haptics"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Listbox, ListboxItem } from "@ui-sdk/react/listbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select"

const ROW_H = 34

export function WheelSelect({
  label,
  options,
  value: controlled,
  defaultValue,
  onValueChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [stored, setStored] = React.useState(defaultValue ?? options[0].value)
  const value = controlled ?? stored
  const listRef = React.useRef<HTMLDivElement>(null)
  const settleTimer = React.useRef(0)
  const fromScroll = React.useRef(false)
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  )

  const commit = (next: string) => {
    if (next === value) return
    haptic("selection")
    if (controlled === undefined) setStored(next)
    onValueChange?.(next)
  }

  React.useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    if (fromScroll.current) {
      fromScroll.current = false
      return
    }
    el.scrollTo({ top: index * ROW_H, behavior: "smooth" })
  }, [index])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      const snapped = Math.max(
        0,
        Math.min(options.length - 1, Math.round(el.scrollTop / ROW_H))
      )
      const opt = options[snapped]
      if (opt && opt.value !== value) {
        fromScroll.current = true
        commit(opt.value)
      }
    }, 90)
  }

  return (
    <Field data-kit="field">
      <FieldLabel data-kit="scrub-label">{label}</FieldLabel>
      <div data-kit="wheel-frame">
        <span data-kit="wheel-window" aria-hidden="true" />
        <Listbox
          ref={listRef}
          data-kit="wheel"
          aria-label={label}
          value={value}
          onValueChange={(next) => {
            if (typeof next === "string") commit(next)
          }}
          onScroll={handleScroll}
        >
          {options.map((opt) => (
            <ListboxItem key={opt.value} value={opt.value} data-kit="wheel-item">
              {opt.label}
            </ListboxItem>
          ))}
        </Listbox>
      </div>
    </Field>
  )
}

export function GlassSelect({
  label,
  options,
  value: controlled,
  defaultValue,
  onValueChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [stored, setStored] = React.useState(defaultValue ?? options[0].value)
  const value = controlled ?? stored

  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") {
          haptic("selection")
          if (controlled === undefined) setStored(next)
          onValueChange?.(next)
        }
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <SelectLabel data-kit="scrub-label">{label}</SelectLabel>
        <SelectTrigger data-kit="button" data-variant="pill">
          <SelectValue />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9.5l6 6 6-6" />
          </svg>
        </SelectTrigger>
      </div>
      <SelectContent data-kit="select-content" sideOffset={8}>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} data-kit="select-item">
            <span>{opt.label}</span>
            <SelectItemIndicator>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </SelectItemIndicator>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
