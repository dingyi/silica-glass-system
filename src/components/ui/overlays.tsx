import * as React from "react"
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react/accordion"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@ui-sdk/react/hover-card"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react/popover"
import {
  Toast,
  ToastAction,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react/toast"
import { opticaToaster } from "./toaster"

export function ModuleChainCard({
  title,
  part,
  behaviors,
  optics,
}: {
  title: string
  part: string
  behaviors: string
  optics: string
}) {
  return (
    <HoverCard>
      <HoverCardTrigger data-kit="chain-trigger" href={`#mod-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        {title}
      </HoverCardTrigger>
      <HoverCardContent data-kit="hover-card" side="top" align="start" sideOffset={8}>
        <strong style={{ fontSize: 12 }}>{title}</strong>
        <dl data-kit="chain-list">
          <dt>ui-sdk</dt>
          <dd>{part}</dd>
          <dt>core</dt>
          <dd>{behaviors}</dd>
          <dt>optics</dt>
          <dd>{optics}</dd>
        </dl>
      </HoverCardContent>
    </HoverCard>
  )
}

export function GlassPopover({
  trigger,
  title,
  description,
  children,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger data-kit="button" data-variant="pill">
        {trigger}
      </PopoverTrigger>
      <PopoverContent data-kit="popover-surface" side="top" align="center" sideOffset={12}>
        <PopoverTitle data-kit="dialog-title">{title}</PopoverTitle>
        <PopoverDescription data-kit="dialog-desc" style={{ marginTop: 4 }}>
          {description}
        </PopoverDescription>
        {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <PopoverClose data-kit="button" data-size="sm">
            Close
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function GlassDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  onConfirm?: () => void
  children?: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger data-kit="button" data-variant="pill">
        {trigger}
      </DialogTrigger>
      <DialogBackdrop data-kit="backdrop" />
      <DialogContent data-kit="dialog">
        <div data-kit="dialog-surface">
          <DialogTitle data-kit="dialog-title">{title}</DialogTitle>
          <DialogDescription data-kit="dialog-desc">{description}</DialogDescription>
          {children}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <DialogClose data-kit="button" data-size="sm" data-variant="recessed">
              Cancel
            </DialogClose>
            <DialogClose
              data-kit="button"
              data-size="sm"
              onClick={onConfirm}
            >
              {confirmLabel}
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GlassAccordion({
  items,
}: {
  items: readonly { value: string; title: string; body: string }[]
}) {
  return (
    <Accordion data-kit="accordion" defaultValue={[items[0].value]} collapsible>
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value} data-kit="accordion-item">
          <AccordionHeader style={{ margin: 0 }}>
            <AccordionTrigger data-kit="accordion-trigger">
              <span>{item.title}</span>
              <span aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                +
              </span>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-kit="accordion-panel">
            <div data-kit="accordion-body">{item.body}</div>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function GlassToastRegion() {
  return (
    <ToastRegion toaster={opticaToaster} data-kit="toast-region" aria-label="Notifications">
      {() => (
        <Toast data-kit="toast">
          <div style={{ flex: 1 }}>
            <ToastTitle style={{ fontWeight: 500 }} />
            <ToastDescription data-kit="toast-desc" />
          </div>
          <ToastAction data-kit="button" data-size="sm" />
        </Toast>
      )}
    </ToastRegion>
  )
}
