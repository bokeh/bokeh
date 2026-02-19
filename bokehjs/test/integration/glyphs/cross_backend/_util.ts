export {cross_display, fig} from "../../_util"

import type {LineDash} from "@bokehjs/core/enums"
import {LineDash as LineDashEnum, LineCap, LineJoin, HatchPatternType} from "@bokehjs/core/enums"
import type {Figure} from "@bokehjs/api/plotting"

// Shared plot config: strip non-glyph chrome for cleaner diffs
export const base = {
  x_axis_type: null as any,
  y_axis_type: null as any,
  toolbar_location: null as any,
}

// ---------------------------------------------------------------------------
// Property value arrays — every member of each visual property enum.
// Use these to write one test that sweeps an entire property dimension.
// ---------------------------------------------------------------------------

export const line_dashes: (LineDash | number[])[] = [...LineDashEnum, [2, 4, 6], [8, 4], [1, 2, 3, 2]]
export const line_caps = [...LineCap]
export const line_joins = [...LineJoin]

// Named hatch patterns only (excludes single-char aliases)
export const hatch_patterns = [...HatchPatternType].filter((p) => p.length > 1)

// Representative alpha values spanning the full range
export const alphas = [0, 0.25, 0.5, 0.75, 1.0]

// Representative line widths from hairline to thick
export const line_widths = [0.5, 1, 2, 4, 8]

// ---------------------------------------------------------------------------
// Plot helpers — lay out N glyphs on a fixed grid so property-sweep tests
// can display one glyph per property value without overlapping.
// ---------------------------------------------------------------------------

type GridPosition = {x: number, y: number}

/** Return N grid positions spread evenly across a plot range of [0, size]. */
export function grid_positions(n: number, cols?: number): GridPosition[] {
  const ncols = cols ?? Math.ceil(Math.sqrt(n))
  const positions: GridPosition[] = []
  for (let i = 0; i < n; i++) {
    positions.push({
      x: (i % ncols) + 1,
      y: Math.floor(i / ncols) + 1,
    })
  }
  return positions
}

/** Compute a square plot range that fits all grid positions with padding. */
export function grid_range(n: number, cols?: number): [number, number] {
  const ncols = cols ?? Math.ceil(Math.sqrt(n))
  const nrows = Math.ceil(n / ncols)
  return [0, Math.max(ncols, nrows) + 1]
}

// ---------------------------------------------------------------------------
// Generic property sweeps — each function lays out glyphs on a grid and
// exercises every value of a single visual property.  The caller supplies
// a GlyphFn that decides *which* glyph method to call and any glyph-
// specific defaults (radius, width/height, size, …).
// ---------------------------------------------------------------------------

/** Callback that adds glyphs to a figure.  Receives grid positions and
 *  the swept property values as `props` to spread into the glyph call. */
export type GlyphFn = (p: Figure, x: number[], y: number[], props: Record<string, unknown>) => void

export function sweep_line_dash(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(line_dashes.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "lightblue",
    line_color: "navy",
    line_width: 3,
    line_dash: line_dashes,
  })
}

export function sweep_line_cap(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(line_caps.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "lightgreen",
    line_color: "navy",
    line_width: 4,
    line_cap: line_caps,
    line_dash: "dashed",
  })
}

export function sweep_line_join(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(line_joins.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "lightyellow",
    line_color: "navy",
    line_width: 4,
    line_join: line_joins,
  })
}

export function sweep_hatch_pattern(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(hatch_patterns.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "white",
    hatch_pattern: hatch_patterns,
    hatch_color: "navy",
    hatch_alpha: 0.8,
    line_color: "gray",
  })
}

export function sweep_fill_alpha(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(alphas.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "red",
    fill_alpha: alphas,
    line_color: "black",
  })
}

export function sweep_line_alpha(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(alphas.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "lightgray",
    line_color: "red",
    line_width: 4,
    line_alpha: alphas,
  })
}

export function sweep_hatch_alpha(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(alphas.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "white",
    hatch_pattern: "dot",
    hatch_color: "navy",
    hatch_alpha: alphas,
    line_color: "gray",
  })
}

export function sweep_line_width(p: Figure, glyph: GlyphFn): void {
  const pos = grid_positions(line_widths.length)
  glyph(p, pos.map((p) => p.x), pos.map((p) => p.y), {
    fill_color: "lightblue",
    line_color: "navy",
    line_width: line_widths,
  })
}
