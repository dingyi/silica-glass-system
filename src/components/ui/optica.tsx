import * as React from "react"
import { installOptica } from "@/lib/install"
import { OPTICA_TINTS, type OpticaTint } from "./optica-tints"
import "@/styles/tokens.css"
import "@/styles/optica-skin.css"

export type OpticaTheme = "light" | "dark"

export function Optica({
  theme = "light",
  tint = "crystal",
  noDots = false,
  noHoverGlow = false,
  noLensZoom = false,
  noSquish = false,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  theme?: OpticaTheme
  tint?: OpticaTint
  noDots?: boolean
  noHoverGlow?: boolean
  noLensZoom?: boolean
  noSquish?: boolean
}) {
  React.useEffect(installOptica, [])

  React.useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.backgroundColor = theme === "dark" ? "#0a0a0a" : "#f2f2f2"
    document.body.style.backgroundColor = theme === "dark" ? "#0a0a0a" : "#f2f2f2"
  }, [theme])

  const tintInfo = OPTICA_TINTS.find((t) => t.id === tint) ?? OPTICA_TINTS[0]
  const themeStyle = {
    "--tint-l": tintInfo.l,
    "--tint-c": tintInfo.c,
    "--tint-h": tintInfo.h,
    ...style,
  } as React.CSSProperties

  return (
    <div
      data-skin="optica"
      data-theme={theme}
      data-tint={tint}
      data-no-dots={noDots ? "true" : undefined}
      data-no-hover-glow={noHoverGlow ? "true" : undefined}
      data-no-lens-zoom={noLensZoom ? "true" : undefined}
      data-no-squish={noSquish ? "true" : undefined}
      style={themeStyle}
      {...props}
    >
      {children}
    </div>
  )
}
