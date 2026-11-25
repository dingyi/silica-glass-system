import * as React from "react"
import { Radio, RadioGroup } from "@ui-sdk/react/radio"
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle"
import { uiAgent } from "@/lib/agent"
import { onSoundChange, setSoundEnabled, soundEnabled } from "@/lib/sound"
import { haptic } from "@/lib/haptics"
import { Optica, type OpticaTheme } from "@/components/ui/optica"
import { OPTICA_TINTS, type OpticaTint } from "@/components/ui/optica-tints"
import { GlassButton } from "@/components/ui/button"
import { GlassSegmented } from "@/components/ui/segmented-control"
import { GlassTabs } from "@/components/ui/tabs"
import { GlassSwitch } from "@/components/ui/switch"
import { GlassRangeSlider, GlassSlider } from "@/components/ui/slider"
import { OpticalKnob } from "@/components/ui/optical-knob"
import { GlassStepScrubber } from "@/components/ui/step-scrubber"
import { GlassDock } from "@/components/ui/dock-toolbar"
import { GlassSelect, WheelSelect } from "@/components/ui/wheel-select"
import { GlassNumberStepper } from "@/components/ui/number-stepper"
import {
  GlassCommandPalette,
  InlineCommandPill,
  type CommandActionItem,
} from "@/components/ui/command-palette"
import {
  GlassAccordion,
  GlassDialog,
  GlassPopover,
  GlassToastRegion,
  ModuleChainCard,
} from "@/components/ui/overlays"
import { opticaToaster } from "@/components/ui/toaster"

type ViewMode = "components" | "lab" | "xray"
type ScaenaVersion = "default" | "fork" | "walkthrough"
type ThecaMotion = "breathe" | "float" | "ripple" | "swell"

const STEP_LABELS = [
  "Recessed Track",
  "Fill Gradient",
  "9-Layer SVG Rim",
  "Ambient Halo",
  "Asymmetric Jump",
  "Press Squish",
  "Spring Solver",
  "Lens Clip",
  "Parallax Shift",
  "Rubber Overshoot",
  "Optical Detents",
  "Agent Bridge",
]

const COMMAND_ITEMS: CommandActionItem[] = [
  { value: "theme:light", label: "Switch to Light Optical", group: "Appearance" },
  { value: "theme:dark", label: "Switch to Dark Optical", group: "Appearance" },
  { value: "view:components", label: "Open Components Catalog", group: "Views", shortcut: "1" },
  { value: "view:lab", label: "Open Lab Studio", group: "Views", shortcut: "2" },
  { value: "view:xray", label: "Open X-Ray & Code", group: "Views", shortcut: "3" },
  { value: "mode:default", label: "Scaena Mode: Default", group: "Lab Mode", shortcut: "d" },
  { value: "mode:fork", label: "Scaena Mode: Fork", group: "Lab Mode", shortcut: "f" },
  { value: "mode:walkthrough", label: "Scaena Mode: Walkthrough", group: "Lab Mode", shortcut: "w" },
  { value: "sound:toggle", label: "Toggle Optical Acoustics", group: "System" },
]

const FOCAL_OPTIONS = [
  { value: "18mm", label: "18 mm" },
  { value: "24mm", label: "24 mm" },
  { value: "35mm", label: "35 mm" },
  { value: "50mm", label: "50 mm" },
  { value: "85mm", label: "85 mm" },
  { value: "135mm", label: "135 mm" },
]

const GLASS_GRADES = [
  { value: "bk7", label: "N-BK7 Crown" },
  { value: "fused-silica", label: "Fused Silica" },
  { value: "sapphire", label: "Synthetic Sapphire" },
  { value: "calcium-fluoride", label: "Calcium Fluoride" },
]

const ACCORDION_ITEMS = [
  {
    value: "bevel",
    title: "01 · Why zero backdrop-filter blur on pills?",
    body: "Scaena & Theca achieve crisp optical glass edges using 9 progressive stroke-opacity SVG rects (ry='50%') on ::before plus a directional fill gradient — avoiding GPU blur cost during 120fps spring drags.",
  },
  {
    value: "lens",
    title: "02 · How does the magnifying lens stay aligned?",
    body: "The sliding indicator uses overflow: hidden and translates an inner cloned track by calc(4px - var(--pill-x)), keeping every 1.12× magnified label locked pixel-for-pixel over its trigger.",
  },
  {
    value: "uisdk",
    title: "03 · What does Vercel UI SDK manage?",
    body: "Every control uses @ui-sdk/react parts and @ui-sdk/core behaviors for WAI-ARIA state, roving focus, typeahead, pointer capture, and the live uiAgent snapshot/act bridge.",
  },
]

const TSX_RECIPE = `import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "@ui-sdk/react/segmented-control"

// 1. UI SDK owns selection, roving focus, ARIA & agent bridge
// 2. useOpticalLens drives damped spring drag + 1.12x clipped lens
<SegmentedControl data-kit="segmented" value={mode} onValueChange={setMode}>
  <SegmentedControlIndicator data-kit="segmented-indicator">
    <span data-kit="lens-track">{/* cloned 1.12x labels */}</span>
  </SegmentedControlIndicator>
  <SegmentedControlItem value="default" data-kit="segment">Default</SegmentedControlItem>
  <SegmentedControlItem value="fork" data-kit="segment">Fork</SegmentedControlItem>
  <SegmentedControlItem value="walkthrough" data-kit="segment">Walkthrough</SegmentedControlItem>
</SegmentedControl>`

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function App() {
  const [theme, setTheme] = React.useState<OpticaTheme>("light")
  const [tint, setTint] = React.useState<OpticaTint>("crystal")
  const [soundOn, setSoundOn] = React.useState(soundEnabled)
  const [view, setView] = React.useState<ViewMode>("components")

  // Live optical switches
  const [dotGrid, setDotGrid] = React.useState(true)
  const [hoverGlow, setHoverGlow] = React.useState(true)
  const [lensZoom, setLensZoom] = React.useState(true)
  const [liquidSquish, setLiquidSquish] = React.useState(true)

  // Interactive demo states
  const [labEntries, setLabEntries] = React.useState(0)
  const [ctaFrame, setCtaFrame] = React.useState(1)
  const [scaenaMode, setScaenaMode] = React.useState<ScaenaVersion>("default")
  const [thecaMotion, setThecaMotion] = React.useState<ThecaMotion>("breathe")
  const [activeTab, setActiveTab] = React.useState("scene")
  const [canvasMode, setCanvasMode] = React.useState("canvas")
  const [ratioMode, setRatioMode] = React.useState("1:1")
  const [refraction, setRefraction] = React.useState(64)
  const [knobRefraction, setKnobRefraction] = React.useState(68)
  const [knobDispersion, setKnobDispersion] = React.useState(42)
  const [knobBloom, setKnobBloom] = React.useState(84)
  const [stepIdx, setStepIdx] = React.useState(0)
  const [dockTool, setDockTool] = React.useState("lens")
  const [focalLength, setFocalLength] = React.useState("50mm")
  const [glassGrade, setGlassGrade] = React.useState("bk7")
  const [fps, setFps] = React.useState<number | null>(60)
  const [lastCmd, setLastCmd] = React.useState("—")

  // X-Ray state
  const [xrayLayers, setXrayLayers] = React.useState<string[]>(["fill", "rim", "glow", "lens"])
  const [xrayExploded, setXrayExploded] = React.useState(true)

  // Agent Bridge state
  const [agentSnap, setAgentSnap] = React.useState<{ count: number; sample: string }>({
    count: 0,
    sample: "Click Refresh to inspect live UI SDK primitives",
  })

  React.useEffect(() => onSoundChange(setSoundOn), [])

  const refreshAgentSnapshot = React.useCallback(() => {
    const snap = uiAgent.snapshot()
    const summary = snap
      .slice(0, 6)
      .map((c) => `${c.ref}:${c.component}(${c.label ?? "unlabeled"})`)
      .join(" · ")
    setAgentSnap({ count: snap.length, sample: summary || "No components registered" })
    return snap
  }, [])

  React.useEffect(() => {
    const id = window.setTimeout(refreshAgentSnapshot, 120)
    return () => window.clearTimeout(id)
  }, [view, refreshAgentSnapshot])

  const runCommand = React.useCallback((raw: string) => {
    const cmd = raw.toLowerCase().trim()
    setLastCmd(raw)
    if (cmd.includes("dark") || cmd === "theme:dark") {
      setTheme("dark")
      opticaToaster.success("Theme switched to Dark Optical")
    } else if (cmd.includes("light") || cmd === "theme:light") {
      setTheme("light")
      opticaToaster.success("Theme switched to Light Optical")
    } else if (cmd.includes("theme:toggle")) {
      setTheme((t) => (t === "light" ? "dark" : "light"))
    } else if (cmd.includes("xray") || cmd === "view:xray") {
      setView("xray")
      opticaToaster.info("Opened Optical X-Ray")
    } else if (cmd.includes("lab") || cmd === "view:lab") {
      setView("lab")
      opticaToaster.info("Opened Lab Studio")
    } else if (cmd.includes("comp") || cmd === "view:components") {
      setView("components")
    } else if (cmd.includes("fork") || cmd === "mode:fork") {
      setScaenaMode("fork")
    } else if (cmd.includes("walk") || cmd === "mode:walkthrough") {
      setScaenaMode("walkthrough")
    } else if (cmd.includes("default") || cmd === "mode:default") {
      setScaenaMode("default")
    } else if (cmd.includes("sound")) {
      setSoundEnabled(!soundEnabled())
    } else {
      opticaToaster(`Executed: ${raw}`)
    }
  }, [])

  const runAgentMacro = async () => {
    const snap = uiAgent.snapshot()
    const seg = snap.find(
      (c) => c.component === "segmented-control" && c.label === "Theca motion mode"
    )
    const slider = snap.find(
      (c) => c.component === "slider" && c.label === "Refraction"
    )
    const steps: { ref: string; action: string; args?: unknown[] }[] = []
    if (seg) {
      const nextMotion = thecaMotion === "ripple" ? "swell" : "ripple"
      steps.push({ ref: seg.ref, action: "setValue", args: [nextMotion] })
    }
    if (slider) {
      const nextVal = refraction > 75 ? 36 : 88
      steps.push({ ref: slider.ref, action: "setValue", args: [nextVal] })
    }
    if (steps.length > 0) {
      const result = await uiAgent.act({ steps })
      const count = result.steps.reduce((n, s) => n + (s.changes?.length ?? 0), 0)
      refreshAgentSnapshot()
      opticaToaster.success("Agent macro applied", {
        description: `${count} UI SDK state changes with source="agent"`,
      })
    }
  }

  return (
    <Optica
      theme={theme}
      tint={tint}
      noDots={!dotGrid}
      noHoverGlow={!hoverGlow}
      noLensZoom={!lensZoom}
      noSquish={!liquidSquish}
    >
      {/* ==================================================================
          TOP STICKY GLASS NAVBAR
          ================================================================== */}
      <header data-kit="navbar">
        <div data-kit="navbar-bar">
          <div data-kit="navbar-left">
            <span data-kit="brand-badge">
              <span data-kit="brand-jewel" aria-hidden="true" />
              <span>VITRA</span>
            </span>

            {/* SPEC-01 style refractive tint picker */}
            <RadioGroup
              data-kit="key-picker"
              aria-label="Key tint"
              value={tint}
              onValueChange={(next) => {
                if (next) {
                  haptic("selection")
                  setTint(next as OpticaTint)
                }
              }}
            >
              {OPTICA_TINTS.map((t) => (
                <Radio
                  key={t.id}
                  value={t.id}
                  data-kit="swatch"
                  aria-label={t.label}
                  title={t.label}
                  style={{ "--swatch": t.swatch } as React.CSSProperties}
                />
              ))}
            </RadioGroup>

            <span data-kit="navbar-divider" aria-hidden="true" />

            {/* Sound Toggle */}
            <GlassSegmented
              ariaLabel="Interaction sound"
              iconsOnly
              value={soundOn ? "on" : "off"}
              onValueChange={(val) => setSoundEnabled(val === "on")}
              options={[
                {
                  value: "on",
                  label: "Sound on",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  ),
                },
                {
                  value: "off",
                  label: "Sound muted",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ),
                },
              ]}
            />

            {/* Theme Switch */}
            <GlassSegmented
              ariaLabel="Color theme"
              iconsOnly
              value={theme}
              onValueChange={(val) => setTheme(val as OpticaTheme)}
              options={[
                {
                  value: "light",
                  label: "Light optical",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                    </svg>
                  ),
                },
                {
                  value: "dark",
                  label: "Dark optical",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                    </svg>
                  ),
                },
              ]}
            />
          </div>

          <div data-kit="navbar-right">
            <GlassSegmented
              ariaLabel="Studio views"
              compact
              value={view}
              onValueChange={(val) => setView(val as ViewMode)}
              options={[
                { value: "components", label: "Components" },
                { value: "lab", label: "Lab Studio" },
                { value: "xray", label: "X-Ray & Code" },
              ]}
            />
            <GlassCommandPalette items={COMMAND_ITEMS} onAction={runCommand} />
          </div>
        </div>
      </header>

      <main data-kit="sheet">
        {/* Masthead */}
        <section data-kit="masthead">
          <div>
            <h1>VITRA</h1>
            <p>
              基于 <strong>Vercel UI SDK</strong> 重构的光学玻璃交互组件库：无模糊 9 层 SVG 倒角高光、内裁剪{" "}
              <code>1.12×</code> 透镜折射、阻尼弹簧连续拖拽，以及触觉声学与{" "}
              <code>uiAgent</code> 代理控制桥。
            </p>
          </div>

          <div data-kit="masthead-links">
            <GlassPopover
              trigger="Install Prompt"
              title="UI SDK + VITRA Setup"
              description="In any React 19 project, install @ui-sdk/react and @ui-sdk/core, wrap with <Optica>, and copy src/components/ui."
            >
              <pre data-kit="code-block" style={{ fontSize: 11, padding: 10 }}>
                <code>npm i @ui-sdk/react @ui-sdk/core</code>
              </pre>
            </GlassPopover>
            <a data-kit="link-chip" href="https://ui-sdk.dev/" target="_blank" rel="noreferrer">
              ui-sdk.dev ↗
            </a>
          </div>
        </section>

        {/* ================================================================
            VIEW 1: COMPONENTS CATALOG (01 - 15)
            ================================================================ */}
        {view === "components" ? (
          <div data-kit="grid">
            {/* 01 BUTTON */}
            <section data-kit="module" data-span="6" aria-label="Button">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">01</span>
                  <ModuleChainCard
                    title="Button"
                    part="@ui-sdk/react/button + shortcuts"
                    behaviors="async pending lock, ARIA busy, useShortcut"
                    optics="9-layer SVG ry=50% bevel + ::after hover halo"
                  />
                </span>
                <span>scaena · theca</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassButton
                    variant="track"
                    pendingLabel="Entering…"
                    onClick={async () => {
                      await wait(650)
                      setLabEntries((n) => n + 1)
                      opticaToaster.success("Entered Optical Lab")
                    }}
                  >
                    Enter Lab
                  </GlassButton>

                  <GlassButton
                    variant="pill"
                    onClick={() => opticaToaster("Access request queued")}
                  >
                    Request access
                  </GlassButton>

                  <GlassButton
                    variant="icon"
                    aria-label="Next frame"
                    onClick={() => setCtaFrame((f) => (f % 4) + 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9.5l6 6 6-6" />
                    </svg>
                  </GlassButton>

                  <GlassButton
                    variant="recessed"
                    shortcut="escape"
                    shortcutLabel="Esc"
                    bevelKeycap
                    onClick={() => opticaToaster.info("Walkthrough exited (Esc)")}
                  >
                    Exit
                  </GlassButton>
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Async pending lock + Esc shortcut</span>
                <span data-kit="readout">
                  entries: {labEntries} · frame: 0{ctaFrame}/04
                </span>
              </div>
            </section>

            {/* 02 SEGMENTED CONTROL */}
            <section data-kit="module" data-span="6" aria-label="Segmented control">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">02</span>
                  <ModuleChainCard
                    title="Segmented Control"
                    part="@ui-sdk/react/segmented-control"
                    behaviors="roving radio group, keyboard arrows, shortcut hooks"
                    optics="stiffness 900 damping 42 drag + 1.12x clipped lens"
                  />
                </span>
                <span>drag + D / F / W</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface" data-layout="col">
                  <GlassSegmented
                    ariaLabel="Scaena version switch"
                    value={scaenaMode}
                    onValueChange={(v) => setScaenaMode(v as ScaenaVersion)}
                    options={[
                      { value: "default", label: "Default", shortcut: "d" },
                      { value: "fork", label: "Fork", shortcut: "f" },
                      { value: "walkthrough", label: "Walkthrough", shortcut: "w" },
                    ]}
                  />
                  <GlassSegmented
                    ariaLabel="Theca motion mode"
                    value={thecaMotion}
                    onValueChange={(v) => setThecaMotion(v as ThecaMotion)}
                    options={[
                      { value: "breathe", label: "Breathe" },
                      { value: "float", label: "Float" },
                      { value: "ripple", label: "Ripple" },
                      { value: "swell", label: "Swell" },
                    ]}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Drag active pill past bounds for rubber-band</span>
                <span data-kit="readout">
                  {scaenaMode} · {thecaMotion}
                </span>
              </div>
            </section>

            {/* 03 TABS & PANELS */}
            <section data-kit="module" data-span="6" aria-label="Tabs">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">03</span>
                  <ModuleChainCard
                    title="Tabs"
                    part="@ui-sdk/react/tabs"
                    behaviors="WAI-ARIA tablist, automatic selection, panels"
                    optics="TabsIndicator cloned lens + asymmetric 0.25/0.75 jump"
                  />
                </span>
                <span>lens tablist</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassTabs
                    label="Material sections"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    items={[
                      {
                        value: "scene",
                        label: "Scene",
                        body: "Studio stage uses 20px radial dot-matrix canvas with zero backdrop-filter cost on floating pills.",
                      },
                      {
                        value: "material",
                        label: "Material",
                        body: "9-layer SVG stroke mask (ry='50%') produces smooth stadium edge speculars in both Light and Dark modes.",
                      },
                      {
                        value: "physics",
                        label: "Physics",
                        body: "Pointer drag solves a 900/42 damped spring with velocity stretch (max 22px) and vertical thinning.",
                      },
                      {
                        value: "export",
                        label: "Export",
                        body: "All primitives compile cleanly with React 19 + TypeScript and expose live actions to uiAgent.",
                      },
                    ]}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Switch tabs by click, drag, or arrows</span>
                <span data-kit="readout">panel: {activeTab}</span>
              </div>
            </section>

            {/* 04 ICON SWITCH */}
            <section data-kit="module" data-span="6" aria-label="Icon switch">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">04</span>
                  <ModuleChainCard
                    title="Icon Switch"
                    part="@ui-sdk/react/segmented-control"
                    behaviors="single tab stop icon radio group"
                    optics="radial-gradient circular rim + 1.18x zoom"
                  />
                </span>
                <span>circular lens</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassSegmented
                    label="Viewport Mode"
                    iconsOnly
                    value={canvasMode}
                    onValueChange={setCanvasMode}
                    options={[
                      {
                        value: "canvas",
                        label: "Canvas",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="4" />
                          </svg>
                        ),
                      },
                      {
                        value: "orbit",
                        label: "Orbit",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <ellipse cx="12" cy="12" rx="9" ry="3.5" />
                          </svg>
                        ),
                      },
                      {
                        value: "grid",
                        label: "Grid",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                          </svg>
                        ),
                      },
                    ]}
                  />

                  <GlassSegmented
                    label="Aspect Ratio"
                    value={ratioMode}
                    onValueChange={setRatioMode}
                    options={[
                      { value: "16:9", label: "16:9" },
                      { value: "1:1", label: "1:1" },
                      { value: "9:16", label: "9:16" },
                    ]}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>1.18× icon lens · radial rim mask</span>
                <span data-kit="readout">
                  {canvasMode} · {ratioMode}
                </span>
              </div>
            </section>

            {/* 05 SWITCH */}
            <section data-kit="module" aria-label="Switch">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">05</span>
                  <ModuleChainCard
                    title="Switch"
                    part="@ui-sdk/react/switch"
                    behaviors="click + continuous pointer drag threshold"
                    optics="28px -> 36px mid-flight bead stretch"
                  />
                </span>
                <span>live controls</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface" data-layout="col">
                  <GlassSwitch
                    label="Dot Matrix Canvas"
                    description="radial studio dots"
                    checked={dotGrid}
                    onCheckedChange={setDotGrid}
                  />
                  <GlassSwitch
                    label="Hover Ambient Halo"
                    description="--glass-glow bloom"
                    checked={hoverGlow}
                    onCheckedChange={setHoverGlow}
                  />
                  <GlassSwitch
                    label="1.12× Lens Zoom"
                    description="optical magnification"
                    checked={lensZoom}
                    onCheckedChange={setLensZoom}
                  />
                  <GlassSwitch
                    label="Liquid Stretch"
                    description="velocity elongation"
                    checked={liquidSquish}
                    onCheckedChange={setLiquidSquish}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Click or drag bead</span>
                <span data-kit="readout">live theme flags</span>
              </div>
            </section>

            {/* 06 SLIDER */}
            <section data-kit="module" aria-label="Slider">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">06</span>
                  <ModuleChainCard
                    title="Slider"
                    part="@ui-sdk/react/slider"
                    behaviors="track jump, dual thumb ordering, 20-step detents"
                    optics="25-tick ruler + 62×34 glass readout capsule"
                  />
                </span>
                <span>single + range</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface" data-layout="col">
                  <GlassSlider
                    label="Refraction"
                    value={refraction}
                    onValueChange={setRefraction}
                  />
                  <GlassRangeSlider label="Bandpass" defaultValue={[24, 78]} />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Track click, drag, or arrows</span>
                <span data-kit="readout">refraction: {refraction}%</span>
              </div>
            </section>

            {/* 07 OPTICAL KNOB */}
            <section data-kit="module" aria-label="Optical knob">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">07</span>
                  <ModuleChainCard
                    title="Optical Knob"
                    part="@ui-sdk/react/number-input"
                    behaviors="NumberInputScrubArea vertical scrub + keyboard input"
                    optics="28 SVG ticks + circular bevel disc + pip"
                  />
                </span>
                <span>vertical scrub</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="knob-row">
                  <OpticalKnob
                    label="Refract"
                    value={knobRefraction}
                    onValueChange={setKnobRefraction}
                  />
                  <OpticalKnob
                    label="Disperse"
                    value={knobDispersion}
                    onValueChange={setKnobDispersion}
                  />
                  <OpticalKnob
                    label="Bloom"
                    value={knobBloom}
                    onValueChange={setKnobBloom}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Drag vertically or type readout</span>
                <span data-kit="readout">
                  {knobRefraction} · {knobDispersion} · {knobBloom}
                </span>
              </div>
            </section>

            {/* 08 STEP SCRUBBER (Custom definePrimitive) */}
            <section data-kit="module" data-span="6" aria-label="Step scrubber">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">08</span>
                  <ModuleChainCard
                    title="Step Scrubber"
                    part="definePrimitive + createParts (@ui-sdk/core)"
                    behaviors="custom primitive slots (track, step, thumb, tooltip)"
                    optics="Scaena 12-dot rail + floating tooltip pill"
                  />
                </span>
                <span>custom primitive</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassStepScrubber
                    labels={STEP_LABELS}
                    value={stepIdx}
                    onValueChange={setStepIdx}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Built with definePrimitive()</span>
                <span data-kit="readout">
                  step {String(stepIdx + 1).padStart(2, "0")} · {STEP_LABELS[stepIdx]}
                </span>
              </div>
            </section>

            {/* 09 FLOATING DOCK */}
            <section data-kit="module" data-span="6" aria-label="Floating dock">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">09</span>
                  <ModuleChainCard
                    title="Floating Dock"
                    part="@ui-sdk/react/toolbar + toggle"
                    behaviors="roving focus single tab stop across tools"
                    optics="hover-tracking 1.18× lens bead + active dot"
                  />
                </span>
                <span>hover lens</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassDock
                    value={dockTool}
                    onValueChange={setDockTool}
                    items={[
                      {
                        id: "select",
                        label: "Select",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 3l14 8.5-6.2 1.3L9.6 19z" />
                          </svg>
                        ),
                      },
                      {
                        id: "lens",
                        label: "Lens",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m21 21-4.3-4.3" />
                          </svg>
                        ),
                      },
                      {
                        id: "layers",
                        label: "Layers",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                        ),
                      },
                      {
                        id: "dial",
                        label: "Dial",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="m12 12 4-4" />
                          </svg>
                        ),
                      },
                      {
                        id: "bevel",
                        label: "Bevel",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="4" y="4" width="16" height="16" rx="4" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ),
                      },
                      {
                        id: "export",
                        label: "Export",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Hover across tools to glide lens</span>
                <span data-kit="readout">tool: {dockTool}</span>
              </div>
            </section>

            {/* 10 WHEEL & POPUP SELECT */}
            <section data-kit="module" aria-label="Select">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">10</span>
                  <ModuleChainCard
                    title="Wheel & Select"
                    part="@ui-sdk/react/listbox + select"
                    behaviors="typeahead, scroll snap, popup positioning"
                    optics="optical magnifying bar over scroll drum"
                  />
                </span>
                <span>drum + popup</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <WheelSelect
                    label="Focal"
                    options={FOCAL_OPTIONS}
                    value={focalLength}
                    onValueChange={setFocalLength}
                  />
                  <GlassSelect
                    label="Glass Grade"
                    options={GLASS_GRADES}
                    value={glassGrade}
                    onValueChange={setGlassGrade}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Scroll wheel or open select</span>
                <span data-kit="readout">
                  {focalLength} · {glassGrade}
                </span>
              </div>
            </section>

            {/* 11 NUMBER STEPPER */}
            <section data-kit="module" aria-label="Number stepper">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">11</span>
                  <ModuleChainCard
                    title="Number Stepper"
                    part="@ui-sdk/react/number-input"
                    behaviors="hold-to-repeat +/-, horizontal scrub area"
                    optics="recessed capsule + circular glass steppers"
                  />
                </span>
                <span>hold + scrub</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassNumberStepper
                    label="Frame Rate"
                    value={fps ?? 60}
                    min={1}
                    max={240}
                    onValueChange={setFps}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Hold +/- or scrub label</span>
                <span data-kit="readout">{fps ?? "—"} fps</span>
              </div>
            </section>

            {/* 12 COMMAND PALETTE */}
            <section data-kit="module" aria-label="Command palette">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">12</span>
                  <ModuleChainCard
                    title="Command"
                    part="@ui-sdk/react/command + dialog"
                    behaviors="ranked filtering, mod+k shortcut, arrow navigation"
                    optics="--focus-glow input halo + bevel submit pill"
                  />
                </span>
                <span>⌘K + inline</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface" data-layout="col">
                  <InlineCommandPill onRun={runCommand} />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Try 'dark', 'fork', or ⌘K</span>
                <span data-kit="readout">last: {lastCmd}</span>
              </div>
            </section>

            {/* 13 POPOVER & DIALOG */}
            <section data-kit="module" aria-label="Popover and dialog">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">13</span>
                  <ModuleChainCard
                    title="Popover & Dialog"
                    part="@ui-sdk/react/popover + dialog"
                    behaviors="focus trap, Escape dismissal, outside press"
                    optics="frosted glass panel + --focus-glow shadow"
                  />
                </span>
                <span>overlays</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface">
                  <GlassPopover
                    trigger="Material Specs"
                    title="Optical Rim Spec"
                    description="Uses 9 stacked SVG rects with stroke-width 4..12 and opacity 1..0.0625."
                  />
                  <GlassDialog
                    trigger="Export Preset"
                    title="Export Vitra Preset"
                    description={`Current configuration: ${theme} · ${tint} · refraction ${refraction}%`}
                    confirmLabel="Copy JSON"
                    onConfirm={() => opticaToaster.success("Preset copied to clipboard")}
                  />
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Layer focus &amp; Esc managed</span>
                <span data-kit="readout">top-layer portals</span>
              </div>
            </section>

            {/* 14 ACCORDION & TOAST */}
            <section data-kit="module" data-span="6" aria-label="Accordion and toast">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">14</span>
                  <ModuleChainCard
                    title="Accordion & Toast"
                    part="@ui-sdk/react/accordion + toast"
                    behaviors="measured --accordion-panel-height + live region toast queue"
                    optics="hairline accordion cards + floating pill toast"
                  />
                </span>
                <span>motion + queue</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface" data-layout="col">
                  <GlassAccordion items={ACCORDION_ITEMS} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <GlassButton
                      size="sm"
                      onClick={() =>
                        opticaToaster("Snapshot saved", {
                          description: "Vitra optical tokens updated.",
                          action: {
                            label: "Undo",
                            onAction: () => opticaToaster.info("Reverted snapshot"),
                          },
                        })
                      }
                    >
                      Trigger Toast
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      onClick={() =>
                        opticaToaster.promise(wait(1100), {
                          loading: "Baking 9-layer rim mask…",
                          success: "Rim shader ready",
                          error: "Failed",
                        })
                      }
                    >
                      Async Toast
                    </GlassButton>
                  </div>
                </div>
              </div>
              <div data-kit="module-foot">
                <span>Swipe or Esc to dismiss toast</span>
                <span data-kit="readout">measured height</span>
              </div>
            </section>

            {/* 15 AGENT BRIDGE */}
            <section data-kit="module" data-span="6" aria-label="Agent bridge">
              <h2 data-kit="caption">
                <span data-kit="caption-left">
                  <span data-kit="caption-num">15</span>
                  <ModuleChainCard
                    title="Agent Bridge"
                    part="@ui-sdk/react/agent"
                    behaviors="uiAgent.snapshot() + uiAgent.act({ steps })"
                    optics="programmatic agent macro driving live glass UI"
                  />
                </span>
                <span>createAgent()</span>
              </h2>
              <div data-kit="stage">
                <div data-kit="surface" data-layout="col" style={{ alignItems: "stretch" }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <GlassButton variant="track" onClick={runAgentMacro}>
                      Run Agent Macro
                    </GlassButton>
                    <GlassButton
                      variant="pill"
                      onClick={() => {
                        const s = refreshAgentSnapshot()
                        opticaToaster.info(`Snapshot: ${s.length} live primitives`)
                      }}
                    >
                      Refresh Snapshot
                    </GlassButton>
                  </div>
                  <pre
                    data-kit="code-block"
                    style={{
                      fontSize: 11,
                      maxHeight: 110,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    <code>{`// Live registered UI SDK primitives: ${agentSnap.count}\n${agentSnap.sample}`}</code>
                  </pre>
                </div>
              </div>
              <div data-kit="module-foot">
                <span>window.uiAgent exposed</span>
                <span data-kit="readout">{agentSnap.count} primitives</span>
              </div>
            </section>
          </div>
        ) : null}

        {/* ================================================================
            VIEW 2: LAB STUDIO (Scaena + Theca Interactive Stage)
            ================================================================ */}
        {view === "lab" ? (
          <section data-kit="lab-canvas" aria-label="Optical Lab Studio">
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, font: "500 11px/1 var(--font-mono)", color: "var(--stage-muted)", letterSpacing: "0.08em" }}>
                LIVE SPECIMEN · {scaenaMode.toUpperCase()} MODE
              </p>
            </div>

            <div
              data-kit="lab-lens-preview"
              style={{
                transform: `scale(${(0.85 + (refraction / 100) * 0.45).toFixed(3)}) rotate(${((knobDispersion - 50) * 0.4).toFixed(1)}deg)`,
              }}
            >
              {refraction}%
            </div>

            <div data-kit="lab-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13 }}>DialKit Optical Panel</strong>
                <span data-kit="lab-meta" style={{ font: "500 11px/1 var(--font-mono)" }}>
                  {ratioMode} · {focalLength}
                </span>
              </div>

              <GlassSlider
                label="Refraction"
                value={refraction}
                onValueChange={setRefraction}
              />

              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <OpticalKnob label="Refract" value={knobRefraction} onValueChange={setKnobRefraction} />
                <OpticalKnob label="Disperse" value={knobDispersion} onValueChange={setKnobDispersion} />
              </div>

              <GlassSegmented
                compact
                ariaLabel="Lab mode"
                value={scaenaMode}
                onValueChange={(v) => setScaenaMode(v as ScaenaVersion)}
                options={[
                  { value: "default", label: "Default", shortcut: "d" },
                  { value: "fork", label: "Fork", shortcut: "f" },
                  { value: "walkthrough", label: "Walkthrough", shortcut: "w" },
                ]}
              />
            </div>

            <GlassStepScrubber
              labels={STEP_LABELS}
              value={stepIdx}
              onValueChange={setStepIdx}
            />
          </section>
        ) : null}

        {/* ================================================================
            VIEW 3: X-RAY & CODE
            ================================================================ */}
        {view === "xray" ? (
          <div data-kit="grid">
            <section data-kit="module" data-span="12" aria-label="Optical X-Ray">
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <ToggleGroup
                  multiple
                  aria-label="Optical layers"
                  value={xrayLayers}
                  onValueChange={(next) => {
                    haptic("selection")
                    setXrayLayers(next)
                  }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                >
                  {[
                    { id: "fill", label: "Layer 1 · Fill Gradient" },
                    { id: "rim", label: "Layer 2 · 9-Layer SVG Rim" },
                    { id: "glow", label: "Layer 3 · Ambient Halo" },
                    { id: "lens", label: "Layer 4 · 1.12× Lens" },
                  ].map((layer) => (
                    <Toggle key={layer.id} value={layer.id} data-kit="toggle-chip">
                      <span data-kit="toggle-chip-dot" aria-hidden="true" />
                      <span>{layer.label}</span>
                    </Toggle>
                  ))}
                </ToggleGroup>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <GlassSwitch
                    label="Exploded 3D"
                    checked={xrayExploded}
                    onCheckedChange={setXrayExploded}
                  />
                  <GlassButton
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard?.writeText(TSX_RECIPE).catch(() => {})
                      opticaToaster.success("Copied UI SDK + Vitra recipe")
                    }}
                  >
                    Copy TSX
                  </GlassButton>
                </div>
              </div>

              <div
                data-kit="stage"
                className="xray-stage"
                data-exploded={String(xrayExploded)}
                data-hide-fill={String(!xrayLayers.includes("fill"))}
                data-hide-rim={String(!xrayLayers.includes("rim"))}
                data-hide-glow={String(!xrayLayers.includes("glow"))}
                data-show-lens={String(xrayLayers.includes("lens"))}
              >
                <div className="glass-specimen">
                  <span className="glass-specimen-glow" aria-hidden="true" />
                  <span className="glass-specimen-rim" aria-hidden="true" />
                  <span className="glass-specimen-label">Optical Bevel Pill</span>
                </div>
              </div>

              <pre data-kit="code-block">
                <code>{TSX_RECIPE}</code>
              </pre>
            </section>
          </div>
        ) : null}
      </main>

      <GlassToastRegion />
    </Optica>
  )
}
export default App
