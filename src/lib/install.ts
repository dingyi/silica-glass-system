import { installHaptics } from "@/lib/haptics"
import { installInputModality } from "@/lib/input-modality"
import { installSound } from "@/lib/sound"

let installed = false

export function installOptica(): void {
  if (installed || typeof document === "undefined") return
  installed = true
  installSound()
  installHaptics()
  installInputModality()
}
