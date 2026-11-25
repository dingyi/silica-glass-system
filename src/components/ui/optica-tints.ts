export type OpticaTint = "crystal" | "quartz" | "cobalt" | "emerald" | "amethyst"

export const OPTICA_TINTS: {
  id: OpticaTint
  label: string
  l: number
  c: number
  h: number
  swatch: string
}[] = [
  { id: "crystal", label: "Crystal (Monochrome)", l: 0.64, c: 0, h: 0, swatch: "linear-gradient(135deg, #ffffff, #cfcfcf)" },
  { id: "quartz", label: "Quartz (Amber)", l: 0.64, c: 0.25, h: 36, swatch: "oklch(0.64 0.25 36)" },
  { id: "cobalt", label: "Cobalt (Blue)", l: 0.58, c: 0.24, h: 256, swatch: "oklch(0.58 0.24 256)" },
  { id: "emerald", label: "Emerald (Green)", l: 0.66, c: 0.22, h: 150, swatch: "oklch(0.66 0.22 150)" },
  { id: "amethyst", label: "Amethyst (Violet)", l: 0.6, c: 0.24, h: 296, swatch: "oklch(0.60 0.24 296)" },
]
