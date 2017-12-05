import {GuideRenderer, GuideRendererView} from "../renderers/guide_renderer"
import {Ticker} from "../tickers/ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {Range} from "../ranges/range"

import * as p from "core/properties"
import {Side, Orientation, SpatialUnits} from "core/enums"
import {Text, Line} from "core/visuals"
import {SidePanel, Orient} from "core/layout/side_panel"
import {Context2d} from "core/util/canvas"
import {sum} from "core/util/array"
import {isString, isArray} from "core/util/types"

const {abs, min, max} = Math

export interface Extents {
  tick: number
  tick_label: number[]
  axis_label: number
}

export type Coords = [number[], number[]]

export interface TickCoords {
  major: Coords
  minor: Coords
}

export class AxisView extends GuideRendererView {

  model: Axis

  visuals: Axis.Visuals

  render(): void {
    if (!this.model.visible)
      return

    const extents = {
      tick: this._tick_extent(),
      tick_label: this._tick_label_extents(),
      axis_label: this._axis_label_extent(),
    }
    const tick_coords = this.model.tick_coords

    const ctx = this.plot_view.canvas_view.ctx
    ctx.save()

    this._draw_rule(ctx, extents)
    this._draw_major_ticks(ctx, extents, tick_coords)
    this._draw_minor_ticks(ctx, extents, tick_coords)
    this._draw_major_labels(ctx, extents, tick_coords)
    this._draw_axis_label(ctx, extents, tick_coords)

    if (this._render != null)
      this._render(ctx, extents, tick_coords)

    ctx.restore()
  }

  protected _render?(ctx: Context2d, extents: Extents, tick_coords: TickCoords): void

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_render())
  }

  get_size(): number {
    return this.model.visible ? Math.round(this._get_size()) : 0
  }

  protected _get_size(): number {
    return this._tick_extent() + this._tick_label_extent() + this._axis_label_extent()
  }

  // drawing sub functions -----------------------------------------------------

  protected _draw_rule(ctx: Context2d, _extents: Extents): void {
    if (!this.visuals.axis_line.doit)
      return

    const [xs, ys]     = this.model.rule_coords
    const [sxs, sys]   = this.plot_view.map_to_screen(xs, ys, this.model.x_range_name, this.model.y_range_name)
    const [nx, ny]     = this.model.normals
    const [xoff, yoff] = this.model.offsets

    this.visuals.axis_line.set_value(ctx)

    ctx.beginPath()
    ctx.moveTo(Math.round(sxs[0] + nx*xoff), Math.round(sys[0] + ny*yoff))
    for (let i = 1; i < sxs.length; i++) {
      const sx = Math.round(sxs[i] + nx*xoff)
      const sy = Math.round(sys[i] + ny*yoff)
      ctx.lineTo(sx, sy)
    }
    ctx.stroke()
  }

  protected _draw_major_ticks(ctx: Context2d, _extents: Extents, tick_coords: TickCoords): void {
    const tin     = this.model.major_tick_in
    const tout    = this.model.major_tick_out
    const visuals = this.visuals.major_tick_line

    this._draw_ticks(ctx, tick_coords.major, tin, tout, visuals)
  }

  protected _draw_minor_ticks(ctx: Context2d, _extents: Extents, tick_coords: TickCoords): void {
    const tin     = this.model.minor_tick_in
    const tout    = this.model.minor_tick_out
    const visuals = this.visuals.minor_tick_line

    this._draw_ticks(ctx, tick_coords.minor, tin, tout, visuals)
  }

  protected _draw_major_labels(ctx: Context2d, extents: Extents, tick_coords: TickCoords): void {
    const coords   = tick_coords.major
    const labels   = this.model.compute_labels(coords[this.model.dimension])
    const orient   = this.model.major_label_orientation
    const standoff = extents.tick + this.model.major_label_standoff
    const visuals  = this.visuals.major_label_text

    this._draw_oriented_labels(ctx, labels, coords, orient, this.model.panel.side, standoff, visuals)
  }

  protected _draw_axis_label(ctx: Context2d, extents: Extents, _tick_coords: TickCoords): void {
    if (this.model.axis_label == null || this.model.axis_label.length == 0)
      return

    let sx: number
    let sy: number

    switch (this.model.panel.side) {
      case "above":
        sx = this.model.panel._hcenter.value
        sy = this.model.panel._bottom.value
        break;
      case "below":
        sx = this.model.panel._hcenter.value
        sy = this.model.panel._top.value
        break;
      case "left":
        sx = this.model.panel._right.value
        sy = this.model.panel._vcenter.value
        break;
      case "right":
        sx = this.model.panel._left.value
        sy = this.model.panel._vcenter.value
        break;
      default:
        throw new Error(`unknown side: ${this.model.panel.side}`)
    }

    const coords: Coords = [[sx], [sy]]
    const standoff = extents.tick + sum(extents.tick_label) + this.model.axis_label_standoff
    const visuals  = this.visuals.axis_label_text

    this._draw_oriented_labels(ctx, [this.model.axis_label], coords, 'parallel', this.model.panel.side, standoff, visuals, "screen")
  }

  protected _draw_ticks(ctx: Context2d, coords: Coords, tin: number, tout: number, visuals: Line): void {
    if (!visuals.doit || coords.length == 0)
      return

    const [x, y]       = coords
    const [sxs, sys]   = this.plot_view.map_to_screen(x, y, this.model.x_range_name, this.model.y_range_name)
    const [nx, ny]     = this.model.normals
    const [xoff, yoff] = this.model.offsets

    const [nxin,  nyin]  = [nx * (xoff-tin),  ny * (yoff-tin)]
    const [nxout, nyout] = [nx * (xoff+tout), ny * (yoff+tout)]

    visuals.set_value(ctx)

    for (let i = 0; i < sxs.length; i++) {
      const sx0 = Math.round(sxs[i] + nxout)
      const sy0 = Math.round(sys[i] + nyout)
      const sx1 = Math.round(sxs[i] + nxin)
      const sy1 = Math.round(sys[i] + nyin)
      ctx.beginPath()
      ctx.moveTo(sx0, sy0)
      ctx.lineTo(sx1, sy1)
      ctx.stroke()
    }
  }

  protected _draw_oriented_labels(ctx: Context2d, labels: string[], coords: Coords,
                                  orient: Orient | number, _side: Side, standoff: number,
                                  visuals: Text, units: SpatialUnits = "data"): void {
    if (!visuals.doit || labels.length == 0)
      return

    let sxs, sys: number[]
    let xoff, yoff: number

    if (units == "screen") {
      [sxs, sys] = coords;
      [xoff, yoff] = [0, 0];
    } else {
      const [dxs, dys] = coords;
      [sxs, sys] = this.plot_view.map_to_screen(dxs, dys, this.model.x_range_name, this.model.y_range_name);
      [xoff, yoff] = this.model.offsets;
    }

    const [nx, ny] = this.model.normals

    const nxd = nx * (xoff + standoff)
    const nyd = ny * (yoff + standoff)

    visuals.set_value(ctx)
    this.model.panel.apply_label_text_heuristics(ctx, orient)

    let angle: number
    if (isString(orient))
      angle = this.model.panel.get_label_angle_heuristic(orient)
    else
      angle = -orient

    for (let i = 0; i < sxs.length; i++) {
      const sx = Math.round(sxs[i] + nxd)
      const sy = Math.round(sys[i] + nyd)

      ctx.translate(sx, sy)
      ctx.rotate(angle)
      ctx.fillText(labels[i], 0, 0)
      ctx.rotate(-angle)
      ctx.translate(-sx, -sy)
    }
  }

  // extents sub functions -----------------------------------------------------

  protected _axis_label_extent(): number {
    if (this.model.axis_label == null || this.model.axis_label == "")
      return 0
    const standoff = this.model.axis_label_standoff
    const visuals = this.visuals.axis_label_text
    return this._oriented_labels_extent([this.model.axis_label], "parallel", this.model.panel.side, standoff, visuals)
  }

  protected _tick_extent(): number {
    return this.model.major_tick_out
  }

  protected _tick_label_extent(): number {
    return sum(this._tick_label_extents())
  }

  protected _tick_label_extents(): number[] {
    const coords = this.model.tick_coords.major
    const labels = this.model.compute_labels(coords[this.model.dimension])

    const orient = this.model.major_label_orientation
    const standoff = this.model.major_label_standoff
    const visuals = this.visuals.major_label_text

    return [this._oriented_labels_extent(labels, orient, this.model.panel.side, standoff, visuals)]
  }

  protected _oriented_labels_extent(labels: string[], orient: Orient | number,
                                    side: Side, standoff: number, visuals: Text): number {
    if (labels.length == 0)
      return 0

    const ctx = this.plot_view.canvas_view.ctx
    visuals.set_value(ctx)

    let hscale: number
    let angle: number

    if (isString(orient)) {
      hscale = 1
      angle = this.model.panel.get_label_angle_heuristic(orient)
    } else {
      hscale = 2
      angle = -orient
    }
    angle = Math.abs(angle)

    const c = Math.cos(angle)
    const s = Math.sin(angle)

    let extent = 0

    for (let i = 0; i < labels.length; i++) {
      const w = ctx.measureText(labels[i]).width * 1.1
      const h = ctx.measureText(labels[i]).ascent * 0.9

      let val: number

      if (side == "above" || side == "below")
        val = w*s + (h/hscale)*c
      else
        val = w*c + (h/hscale)*s

      // update extent if current value is larger
      if (val > extent)
        extent = val
    }

    // only apply the standoff if we already have non-zero extent
    if (extent > 0)
      extent += standoff

    return extent
  }
}

export class Axis extends GuideRenderer {

  panel: SidePanel

  bounds: [number, number] | "auto"
  ticker: Ticker<any> // TODO
  formatter: TickFormatter
  x_range_name: string
  y_range_name: string
  axis_label: string
  axis_label_standoff: number
  major_label_standoff: number
  major_label_orientation: Orientation | number
  major_label_overrides: {[key: string]: string}
  major_tick_in: number
  major_tick_out: number
  minor_tick_in: number
  minor_tick_out: number

  compute_labels(ticks: number[]): string[] {
    const labels = this.formatter.doFormat(ticks, this) as any
    for (let i = 0; i < ticks.length; i++) {
      if (ticks[i] in this.major_label_overrides)
        labels[i] = this.major_label_overrides[ticks[i]]
    }
    return labels
  }

  label_info(coords: Coords) {
    return {
      dim: this.dimension,
      coords: coords,
      side: this.panel.side,
      orient: this.major_label_orientation,
      standoff: this.major_label_standoff,
    }
  }

  get computed_bounds(): [number, number] {
    return this._computed_bounds()
  }

  get rule_coords() {
    return this._rule_coords()
  }

  get tick_coords() {
    return this._tick_coords()
  }

  get ranges(): [Range, Range] {
    return this._ranges()
  }

  get normals() {
    return this.panel.normals
  }

  get dimension(): 0 | 1 {
    return this.panel.dimension
  }

  get offsets(): [number, number] {
    return this._offsets()
  }

  get loc(): number {
    return this._get_loc()
  }

  add_panel(side: Side): void {
    this.panel = new SidePanel({side: side})
    this.panel.attach_document(this.document!) // XXX!
  }

  protected _offsets(): [number, number] {
    const frame = this.plot.plot_canvas.frame
    let [xoff, yoff] = [0, 0]

    switch (this.panel.side) {
      case "below":
        yoff = abs(this.panel._top.value - frame._bottom.value)
        break
      case "above":
        yoff = abs(this.panel._bottom.value - frame._top.value)
        break
      case "right":
        xoff = abs(this.panel._left.value - frame._right.value)
        break
      case "left":
        xoff = abs(this.panel._right.value - frame._left.value)
        break
    }

    return [xoff, yoff]
  }

  protected _ranges(): [Range, Range] {
    const i = this.dimension
    const j = (i + 1) % 2
    const frame = this.plot.plot_canvas.frame
    const ranges = [
      frame.x_ranges[this.x_range_name],
      frame.y_ranges[this.y_range_name],
    ]
    return [ranges[i], ranges[j]]
  }

  protected _computed_bounds(): [number, number] {
    const [range,] = this.ranges

    const user_bounds = this.bounds // XXX: ? 'auto'
    const range_bounds: [number, number] = [range.min, range.max]

    if (user_bounds == 'auto')
      return [range.min, range.max]
    else if (isArray(user_bounds)) {
      let start: number
      let end: number

      const [user_start, user_end] = user_bounds
      const [range_start, range_end] = range_bounds

      if (abs(user_start - user_end) > abs(range_start - range_end)) {
        start = max(min(user_start, user_end), range_start)
        end = min(max(user_start, user_end), range_end)
      } else {
        start = min(user_start, user_end)
        end = max(user_start, user_end)
      }

      return [start, end]
    } else
      throw new Error(`user bounds '${user_bounds}' not understood`)
  }

  protected _rule_coords(): Coords {
    const i = this.dimension
    const j = (i + 1) % 2
    const [range,] = this.ranges
    const [start, end] = this.computed_bounds

    const xs: number[] = new Array(2)
    const ys: number[] = new Array(2)
    const coords: Coords = [xs, ys]

    coords[i][0] = Math.max(start, range.min)
    coords[i][1] = Math.min(end, range.max)
    if (coords[i][0] > coords[i][1])
      coords[i][0] = coords[i][1] = NaN

    coords[j][0] = this.loc
    coords[j][1] = this.loc

    return coords
  }

  protected _tick_coords(): TickCoords {
    const i = this.dimension
    const j = (i + 1) % 2
    const [range,] = this.ranges
    const [start, end] = this.computed_bounds

    const ticks = this.ticker.get_ticks(start, end, range, this.loc, {})
    const majors = ticks.major
    const minors = ticks.minor

    const xs: number[] = []
    const ys: number[] = []
    const coords: Coords = [xs, ys]

    const minor_xs: number[] = []
    const minor_ys: number[] = []
    const minor_coords: Coords = [minor_xs, minor_ys]

    const [range_min, range_max] = [range.min, range.max]

    for (let ii = 0; ii < majors.length; ii++) {
      if (majors[ii] < range_min || majors[ii] > range_max)
        continue
      coords[i].push(majors[ii])
      coords[j].push(this.loc)
    }

    for (let ii = 0; ii < minors.length; ii++) {
      if (minors[ii] < range_min || minors[ii] > range_max)
        continue
      minor_coords[i].push(minors[ii])
      minor_coords[j].push(this.loc)
    }

    return {
      major: coords,
      minor: minor_coords,
    }
  }

  protected _get_loc(): number {
    const [, cross_range] = this.ranges

    switch (this.panel.side) {
      case 'left':
      case 'below':
        return cross_range.start
      case 'right':
      case 'above':
        return cross_range.end
    }
  }
}

Axis.prototype.type = "Axis"

Axis.prototype.default_view = AxisView

Axis.mixins([
  'line:axis_',
  'line:major_tick_',
  'line:minor_tick_',
  'text:major_label_',
  'text:axis_label_',
])

Axis.define({
  bounds:                  [ p.Any,      'auto'       ], // TODO (bev)
  ticker:                  [ p.Instance, null         ],
  formatter:               [ p.Instance, null         ],
  x_range_name:            [ p.String,   'default'    ],
  y_range_name:            [ p.String,   'default'    ],
  axis_label:              [ p.String,   ''           ],
  axis_label_standoff:     [ p.Int,      5            ],
  major_label_standoff:    [ p.Int,      5            ],
  major_label_orientation: [ p.Any,      "horizontal" ], // TODO: p.Orientation | p.Number
  major_label_overrides:   [ p.Any,      {}           ],
  major_tick_in:           [ p.Number,   2            ],
  major_tick_out:          [ p.Number,   6            ],
  minor_tick_in:           [ p.Number,   0            ],
  minor_tick_out:          [ p.Number,   4            ],
})

Axis.override({
  axis_line_color: 'black',

  major_tick_line_color: 'black',
  minor_tick_line_color: 'black',

  major_label_text_font_size: "8pt",
  major_label_text_align: "center",
  major_label_text_baseline: "alphabetic",

  axis_label_text_font_size: "10pt",
  axis_label_text_font_style: "italic",
})

export module Axis {
  export type Visuals = GuideRenderer.Visuals & {
    axis_line: Line
    major_tick_line: Line
    minor_tick_line: Line
    major_label_text: Text
    axis_label_text: Text
  }
}
