---
name: Helios Solar Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#554336'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#904d00'
  primary: '#8d4b00'
  on-primary: '#ffffff'
  primary-container: '#b15f00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb77d'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#006948'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855d'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  telemetry-metric:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.03em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-precision, luminous clean-tech console aesthetic. Engineered specifically for real-time solar yield, storage analytics, and energy distribution networks, it moves decisively away from generic, heavy dark-mode dashboards in favor of an airy, daylight-calibrated surface architecture.

The visual style blends crisp modernism with high-clarity technical telemetry:
- **Atmosphere:** Sunlit, surgical, and premium. Warm white backgrounds mimic physical engineering whiteboards and laboratory instrumentation surfaces.
- **Target Audience:** Solar fleet operators, high-end residential microgrid owners, and clean-tech infrastructure engineers demanding immediate cognitive clarity over decorative noise.
- **Visual Weight:** Ultra-thin slate framing, precise luminous accents (solar amber, cyan grid telemetry, emerald battery capacity), and deliberate negative space.

## Colors

The palette directly communicates thermodynamic and electrical states through systematic functional color-coding:

- **Primary (Solar Generation):** `#D97706` (Amber Core) paired with `#F59E0B` for active photovoltaic irradiance, live generation spikes, and peak sun-hour metrics.
- **Secondary (Grid & Consumption):** `#0284C7` (Electric Cyan) paired with `#0EA5E9` to track active home/facility load, phase voltage, and utility draws.
- **Tertiary (Storage & Efficiency):** `#059669` (Resilient Emerald) paired with `#10B981` to indicate high battery state of charge (SoC), autonomous self-sufficiency, and net-negative export rates.
- **Neutral (Structure & Contrast):** `#0F172A` (Deep Slate Core) serves as the primary ink and high-contrast structural anchor, supported by `#1E293B` for secondary typography and `#64748B` for tertiary telemetry labels.
- **Base Surfaces & Framing:** Canvas uses tiered warm white and atmospheric pale slate: Base canvas at `#F8FAFC`, structural wells and nested bays at `#F1F5F9`, card surface at `#FFFFFF`, and ultra-crisp dividers at `#E2E8F0`.

## Typography

The type system is powered entirely by Geist, capitalizing on its geometric precision, crisp tabular rendering, and low-noise neutral character.

- **Tabular Figures for Telemetry:** All real-time telemetry metrics (`kW`, `kWh`, `V`, `Hz`, `%`) must employ `font-variant-numeric: tabular-nums` to eliminate jitter during continuous data streams.
- **Hierarchy:** High-level metrics prioritize bold weight with tight negative tracking (`-0.02em` to `-0.03em`) to anchor dashboards. Subheaders and labels use elevated tracking (`0.02em` to `0.04em`) in upper-middle casing for rapid scanning.

## Layout & Spacing

The console operates on a 12-column fluid grid system pinned to a maximum canvas constraint of 1600px for panoramic multi-array oversight.

- **Canvas Architecture:**
  - **Desktop (1280px+):** 12 columns, `1.25rem` (20px) gutters, `2rem` outer padding. Main power-flow diagram spans 8 columns, right telemetry array spans 4 columns.
  - **Tablet (768px - 1279px):** 8 columns, `1rem` (16px) gutters, `1.5rem` margins. Power topology stacks into secondary sub-grids.
  - **Mobile (<768px):** 4 columns, `0.75rem` (12px) gutters, `1rem` margins. Metrics condense into 2x2 modular summary cards.
- **Rhythm:** Spacing follows strict multiples of 4px. Metric readouts link tightly to their category anchors using `space-xs` (4px), while container internals strictly utilize `space-lg` (24px) to preserve a calm, open instrumentation deck.

## Elevation & Depth

To avoid heavy, muddy visuals, elevation relies on razor-thin micro-borders combined with delicate, directional ambient light:

- **Surface Layering:**
  - **Level 0 (Canvas):** `#F8FAFC`. Flat ground plane for foundational structural views.
  - **Level 1 (Console Panels):** `#FFFFFF` surfaces bounded by an explicit `1px solid #E2E8F0` border. Casts a soft daylight drop shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
  - **Level 2 (Active Cards & Inverters):** `#FFFFFF` with `0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`, bordered with `1px solid #CBD5E1`.
  - **Level 3 (Modal / Energy Overrides):** Elevated diagnostic views with `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Glow Accents:** Operational status avoids flat badges by adding a faint diffused halo behind micro-indicators (e.g., an amber solar generation pin emits a `0 0 12px rgba(245, 158, 11, 0.3)` back-glow).

## Shapes

The geometric signature combines generous card outer perimeters with compact, structured controls:

- **Dashboard Cards & Enclosures:** Standardize on `rounded-xl` (1.5rem / 24px) for prominent modular containers, creating a polished, contemporary consumer-hardware tactile envelope.
- **Data Bays & Nested Wells:** Standardize on `rounded-lg` (1.0rem / 16px) for embedded graph viewports, phase matrices, and battery bank status wells.
- **Interactive Controls & Inputs:** Standardize on `rounded` (0.5rem / 8px) for buttons, segment switches, and search filters.
- **Status Pills:** Fully rounded pills (`9999px`) are exclusively reserved for micro state indicators (e.g., "Grid Connected", "Discharging").

## Components

### Buttons & Switches
- **Primary Action (Command):** `#0F172A` background, white text, 8px border radius, crisp hover transition to `#1E293B`.
- **Solar Priority Action:** Amber gradient fill (`#D97706` to `#B45309`), white text, faint amber ambient shadow.
- **Segmented Range Switch (Day/Week/Month/Year):** `#F1F5F9` background tray with 8px radius; active segment floats with `#FFFFFF`, `1px solid #E2E8F0`, and `#0F172A` text.

### Telemetry Cards
- Primary surface `#FFFFFF` with `rounded-xl` corners and `1px solid #E2E8F0` frame.
- Internal hierarchy: Category label (`label-sm`, `#64748B`, uppercase), live value (`telemetry-metric`, `#0F172A`), subtext unit with color-coded directional delta indicator.

### Energy Flow Node
- Custom node displaying real-time power transfers (Array ➔ Battery ➔ Grid).
- Circular or squircle visual anchors containing central SVG glyphs, circled by a animated pulse border displaying active throughput rate via color (Amber for Generation, Cyan for Load, Emerald for Storage).

### Chips & Status Badges
- Semi-transparent tinted backgrounds with solid semantic ink:
  - **Generation Active:** Background `rgba(245, 158, 11, 0.12)`, text `#B45309`, dot `#F59E0B`.
  - **Grid Consumption:** Background `rgba(14, 165, 233, 0.12)`, text `#0369A1`, dot `#0EA5E9`.
  - **Battery Autonomous:** Background `rgba(16, 185, 129, 0.12)`, text `#047857`, dot `#10B981`.

### Data Tables & Phase Matrices
- Subtle alternating rows using `#FFFFFF` and `#F8FAFC`.
- Zero outer side-borders; row dividers use `1px solid #F1F5F9`. Header cells rendered in `label-sm` with `#64748B`.

### Input Fields
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, 8px radius. Active focus state removes default outline and engages a dual-ring: `0 0 0 1px #0284C7` and `0 0 0 4px rgba(2, 132, 199, 0.15)`.