import * as React from "react"
import { Button as SdkButton } from "@ui-sdk/react/button"
import { useShortcut, useShortcutHint } from "@ui-sdk/react/shortcuts"

export function GlassKeycap({
  children,
  bevel = false,
  ...props
}: React.ComponentProps<"kbd"> & { bevel?: boolean }) {
  return (
    <kbd data-kit="keycap" data-bevel={bevel ? "true" : undefined} {...props}>
      {children}
    </kbd>
  )
}

export type GlassButtonProps = Omit<React.ComponentProps<typeof SdkButton>, "children"> & {
  variant?: "pill" | "track" | "recessed" | "icon"
  size?: "sm" | "md" | "lg"
  shortcut?: string | null
  shortcutLabel?: string
  bevelKeycap?: boolean
  pendingLabel?: React.ReactNode
  children?: React.ReactNode
}

export function GlassButton({
  variant = "pill",
  size = "md",
  shortcut,
  shortcutLabel,
  bevelKeycap = false,
  pendingLabel,
  onClick,
  children,
  ...props
}: GlassButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const hint = useShortcutHint(shortcut || "escape")

  useShortcut(
    shortcut ?? null,
    () => {
      ref.current?.click()
    },
    { description: shortcutLabel }
  )

  const buttonNode = (
    <SdkButton
      ref={ref}
      data-kit="button"
      data-variant={variant}
      data-size={size !== "md" ? size : undefined}
      aria-keyshortcuts={shortcut ? hint.ariaKeyshortcuts : props["aria-keyshortcuts"]}
      onClick={onClick}
      {...props}
    >
      {pendingLabel ? (
        <>
          <span data-kit="spinner" data-show="pending" aria-hidden="true" />
          <span data-show="pending">{pendingLabel}</span>
          <span data-show="idle" style={{ display: "contents" }}>
            {children}
          </span>
        </>
      ) : (
        children
      )}
      {shortcut ? (
        <GlassKeycap bevel={bevelKeycap} aria-hidden="true">
          {shortcutLabel ?? hint.text}
        </GlassKeycap>
      ) : null}
    </SdkButton>
  )

  if (variant === "track") {
    return <div className="glass-track">{buttonNode}</div>
  }
  return buttonNode
}
