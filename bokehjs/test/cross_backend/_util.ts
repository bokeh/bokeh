import {display} from "../framework"
import {figure} from "@bokehjs/api/plotting"

import type {LineDash, OutputBackend} from "@bokehjs/core/enums"
import {LineDash as LineDashEnum, LineCap, LineJoin, HatchPatternType} from "@bokehjs/core/enums"
import type {UIElement} from "@bokehjs/models/ui/ui_element"
import {Row} from "@bokehjs/models/layouts/index"
import type {Figure} from "@bokehjs/api/plotting"
import type {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"

// COUPLING: the default `backends` order is assumed by devtools.ts when
// labelling per-backend screenshots.  Keep them in sync.
export async function cross_display(
  make_plot: (output_backend: OutputBackend) => UIElement,
  backends: [OutputBackend, OutputBackend] = ["canvas", "webgl"],
): Promise<void> {
  await display(new Row({children: backends.map((b) => make_plot(b))}))
}

// ---------------------------------------------------------------------------
// Property value arrays — every member of each visual property enum.
// Use these to write one test that sweeps an entire property dimension.
// ---------------------------------------------------------------------------

// All named line dash patterns plus a few custom numeric arrays
export const line_dashes: (LineDash | number[])[] = [...LineDashEnum, [2, 4, 6], [8, 4], [1, 2, 3, 2]]
export const line_caps = [...LineCap]
export const line_joins = [...LineJoin]

// Named hatch patterns only (excludes single-char aliases)
export const hatch_patterns = [...HatchPatternType].filter((p) => p.length > 1)

// Representative alpha values spanning the full range
export const alphas = [0, 0.25, 0.5, 0.75, 1.0]

// Representative line widths from zero to thick
export const line_widths = [0.0, 0.5, 1, 2, 4, 8]

// ---------------------------------------------------------------------------
// Plot helpers — lay out N glyphs on a fixed grid so property-sweep tests
// can display one glyph per property value without overlapping.
// ---------------------------------------------------------------------------

/** Return N grid positions spread evenly across a plot range of [0, size]. */
export function grid_positions(num_glyphs: number, cols?: number): {x: number, y: number}[] {
  const ncols = cols ?? Math.ceil(Math.sqrt(num_glyphs))
  const positions: {x: number, y: number}[] = []
  for (let i = 0; i < num_glyphs; i++) {
    positions.push({
      x: (i % ncols) + 1,
      y: Math.floor(i / ncols) + 1,
    })
  }
  return positions
}

/** Compute square plot ranges that fit all grid positions with padding.
 *  Returns {x_range, y_range} for direct spreading into figure(). */
export function grid_ranges(num_glyphs: number, cols?: number): {x_range: [number, number], y_range: [number, number]} {
  const ncols = cols ?? Math.ceil(Math.sqrt(num_glyphs))
  const nrows = Math.ceil(num_glyphs / ncols)
  const range: [number, number] = [0, Math.max(ncols, nrows) + 1]
  return {x_range: range, y_range: range}
}

/** Default plot size for sweep tests. */
const DEFAULT_SIZE = 300

/** Create a figure pre-configured for cross-backend sweep tests.
 *  Axes and toolbar are suppressed for cleaner image diffs. */
function sweep_figure(num_glyphs: number, backend: OutputBackend): Figure {
  return figure({
    width: DEFAULT_SIZE, height: DEFAULT_SIZE,
    ...grid_ranges(num_glyphs),
    output_backend: backend,
    x_axis_type: null, y_axis_type: null,
    toolbar_location: null, title: null,
  })
}

// ---------------------------------------------------------------------------
// Generic property sweeps — each function exercises every value of a single
// visual property.  The caller supplies:
//
//   glyph(p, props) — calls the appropriate glyph method on the figure
//     with the fully-merged props (coordinates + visual properties).
//
//   coords(num_glyphs) — returns glyph-specific coordinate and sizing props
//     for num_glyphs items (e.g. x/y arrays for markers, left/right/top/bottom
//     for quad).
//
// The sweep merges coords(num_glyphs) with its visual properties and passes the
// result to glyph().
// ---------------------------------------------------------------------------

/** Renders glyphs on a figure with the given merged props. */
export type GlyphFn<Args extends Record<string, unknown> = Record<string, unknown>> = (
  p: Figure,
  props: Partial<Args>,
) => GlyphRenderer | void

/** Returns glyph-specific coordinate and sizing props for num_glyphs items. */
export type CoordsFn<Coords extends Record<string, unknown> = Record<string, unknown>> = (
  num_glyphs: number,
) => Coords

export function sweep_line_dash(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = line_dashes.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "lightblue",
    line_color: "navy",
    line_width: 3,
    line_dash: line_dashes,
  })
  return p
}

export function sweep_line_cap(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = line_caps.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "lightgreen",
    line_color: "navy",
    line_width: 4,
    line_cap: line_caps,
    line_dash: "dashed",
  })
  return p
}

export function sweep_line_join(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = line_joins.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "lightyellow",
    line_color: "navy",
    line_width: 4,
    line_join: line_joins,
  })
  return p
}

export function sweep_hatch_pattern(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = hatch_patterns.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "white",
    hatch_pattern: hatch_patterns,
    hatch_color: "navy",
    hatch_alpha: 0.8,
    line_color: "gray",
  })
  return p
}

export function sweep_fill_alpha(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = alphas.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "red",
    fill_alpha: alphas,
    line_color: "black",
  })
  return p
}

export function sweep_line_alpha(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = alphas.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "lightgray",
    line_color: "red",
    line_width: 4,
    line_alpha: alphas,
  })
  return p
}

export function sweep_hatch_alpha(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = alphas.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "white",
    hatch_pattern: "dot",
    hatch_color: "navy",
    hatch_alpha: alphas,
    line_color: "gray",
  })
  return p
}

export function sweep_line_width(backend: OutputBackend, glyph: GlyphFn, coords: CoordsFn): Figure {
  const num_glyphs = line_widths.length
  const p = sweep_figure(num_glyphs, backend)
  glyph(p, {
    ...coords(num_glyphs),
    fill_color: "lightblue",
    line_color: "navy",
    line_width: line_widths,
  })
  return p
}
