import * as React from "react"
import { haptic } from "@/lib/haptics"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@ui-sdk/react/command"
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog"
import { useShortcut } from "@ui-sdk/react/shortcuts"
import { GlassButton, GlassKeycap } from "@/components/ui/button"

export interface CommandActionItem {
  value: string
  label: string
  group: string
  shortcut?: string
}

export function InlineCommandPill({
  onRun,
}: {
  onRun: (command: string) => void
}) {
  const [text, setText] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <form
      data-kit="command-bar"
      onSubmit={(ev) => {
        ev.preventDefault()
        const cmd = text.trim() || "theme:toggle"
        haptic("medium")
        onRun(cmd)
        setText("")
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--stage-muted)", flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type 'dark', 'fork', 'xray'…"
        aria-label="Inline optical command"
      />
      <GlassButton type="submit" size="sm">
        Run
      </GlassButton>
    </form>
  )
}

export function GlassCommandPalette({
  items,
  onAction,
}: {
  items: readonly CommandActionItem[]
  onAction: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  useShortcut(
    "mod+k",
    () => {
      setOpen((prev) => !prev)
    },
    { description: "Toggle command palette" }
  )

  const groups = React.useMemo(() => {
    const map = new Map<string, CommandActionItem[]>()
    for (const item of items) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return [...map.entries()]
  }, [items])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-kit="button" data-size="sm">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span>Command</span>
        <GlassKeycap aria-hidden="true">⌘K</GlassKeycap>
      </DialogTrigger>
      <DialogBackdrop data-kit="backdrop" />
      <DialogContent data-kit="dialog">
        <div data-kit="dialog-surface">
          <DialogTitle data-kit="dialog-title">Command Palette</DialogTitle>
          <Command
            onAction={(val) => {
              haptic("selection")
              onAction(String(val))
              setOpen(false)
            }}
          >
            <CommandInput
              data-kit="command-input"
              aria-label="Search commands"
              placeholder="Search theme, views, modes…"
            />
            <CommandEmpty
              style={{
                padding: "14px 10px",
                fontSize: 12,
                color: "var(--stage-muted)",
              }}
            >
              No matching commands.
            </CommandEmpty>
            <CommandList data-kit="command-list">
              {groups.map(([groupName, groupItems]) => (
                <CommandGroup key={groupName}>
                  <CommandGroupLabel data-kit="command-group-label">
                    {groupName}
                  </CommandGroupLabel>
                  {groupItems.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      shortcut={item.shortcut}
                      data-kit="command-item"
                    >
                      <span>{item.label}</span>
                      {item.shortcut ? (
                        <CommandShortcut data-kit="keycap" />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  )
}
