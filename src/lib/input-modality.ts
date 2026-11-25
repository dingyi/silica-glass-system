const navigationKeys = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
])

export function installInputModality(): void {
  if (typeof document === "undefined") return
  document.addEventListener(
    "pointerdown",
    () => {
      document.documentElement.dataset.modality = "pointer"
    },
    true
  )
  document.addEventListener(
    "keydown",
    (event) => {
      const typing = (event.target as HTMLElement | null)?.matches?.(
        "input, textarea, [contenteditable]"
      )
      if (event.key === "Tab" || (navigationKeys.has(event.key) && !typing)) {
        document.documentElement.dataset.modality = "keyboard"
      }
    },
    true
  )
}
