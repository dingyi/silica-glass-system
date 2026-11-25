import * as React from "react"
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { useOpticalLens } from "@/components/ui/use-optical-lens"

export interface GlassTabItem<T extends string = string> {
  value: T
  label: string
  body: React.ReactNode
}

export function GlassTabs<T extends string = string>({
  items,
  label = "Sections",
  value: controlledValue,
  defaultValue,
  onValueChange,
}: {
  items: readonly GlassTabItem<T>[]
  label?: string
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
}) {
  const [stored, setStored] = React.useState<T>(defaultValue ?? items[0].value)
  const current = controlledValue ?? stored

  const select = React.useCallback(
    (next: T) => {
      if (controlledValue === undefined) setStored(next)
      onValueChange?.(next)
    },
    [controlledValue, onValueChange]
  )

  const values = React.useMemo(() => items.map((i) => i.value), [items])

  const { rootRef, indicatorRef, lensRef, activeIndex, startDrag, onClickCapture } =
    useOpticalLens<T>({
      values,
      activeValue: current,
      itemSelector: '[data-slot="tabs-tab"]',
      onSelect: select,
    })

  return (
    <Tabs
      data-kit="tabs"
      value={current}
      onValueChange={(next) => {
        if (next) select(next as T)
      }}
    >
      <TabsList
        ref={rootRef}
        data-kit="tabs-list"
        aria-label={label}
        onClickCapture={onClickCapture}
      >
        <TabsIndicator ref={indicatorRef} data-kit="tabs-indicator">
          <span ref={lensRef} data-kit="lens-track" aria-hidden="true">
            {items.map((item, idx) => (
              <span
                key={item.value}
                data-kit="lens-item"
                style={{ "--shift": activeIndex - idx } as React.CSSProperties}
              >
                <span>{item.label}</span>
              </span>
            ))}
          </span>
        </TabsIndicator>

        {items.map((item, idx) => (
          <TabsTab
            key={item.value}
            value={item.value}
            data-kit="tab"
            onPointerDown={(ev) => startDrag(ev, idx)}
          >
            <span>{item.label}</span>
          </TabsTab>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsPanel key={item.value} value={item.value} data-kit="tab-panel">
          {item.body}
        </TabsPanel>
      ))}
    </Tabs>
  )
}
