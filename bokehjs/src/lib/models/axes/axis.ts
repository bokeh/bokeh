import {GuideRenderer, GuideRendererView} from "../renderers/guide_renderer"
import {Ticker} from "../tickers/ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {LabelingPolicy, AllLabels, DistanceMeasure} from "../policies/labeling"
import {Range} from "../ranges/range"
import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {SerializableState} from "core/view"
import {Side, TickLabelOrientation} from "core/enums"
import {Size, Layoutable} from "core/layout"
import {Indices} from "core/types"
import {Panel, SideLayout, Orient} from "core/layout/side_panel"
import {Context2d} from "core/util/canvas"
import {sum} from "core/util/array"
import {Dict} from "core/util/object"
import {isNumber, isPlainObject} from "core/util/types"
import {GraphicsBoxes, TextBox} from "core/graphics"
import {Factor, FactorRange} from "models/ranges/factor_range"
import {BaseTextView} from "../text/base_text"
import {BaseText} from "../text/base_text"
import {build_view, IterViews} from "core/build_views"
import {unreachable} from "core/util/assert"
import {isString} from "core/util/types"
import {parse_delimited_string} from "models/text/utils"

const {abs} = Math

export type Extents = {
  tick: number
  tick_labels: number[]
  tick_label: number
  axis_label: number
}

export type Coords = [number[], number[]]

export interface TickCoords {
  major: Coords
  minor: Coords
}

export class AxisView extends GuideRendererView {
  declare model: Axis
  declare visuals: Axis.Visuals

  panel: Panel
  layout: Layoutable

  /*private*/ _axis_label_view: BaseTextView | null = null
  /*private*/ _major_label_views: Map<string | number, BaseTextView> = new Map()

  override *children(): IterViews {
    yield* super.children()
    if (this._axis_label_view != null)
      yield this._axis_label_view
    yield* this._major_label_views.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._init_axis_label()
    await this._init_major_labels()
  }

  protected async _init_axis_label(): Promise<void> {
    const {axis_label} = this.model
    if (axis_label != null) {
      const _axis_label = isString(axis_label) ? parse_delimited_string(axis_label) : axis_label
      this._axis_label_view = await build_view(_axis_label, {parent: this})
    } else
      this._axis_label_view = null
  }

  protected async _init_major_labels(): Promise<void> {
    for (const [label, label_text] of this.model.major_label_overrides) {
      const _label_text = isString(label_text) ? parse_delimited_string(label_text) : label_text
      this._major_label_views.set(label, await build_view(_label_text, {parent: this}))
    }
  }

  update_layout(): void {
    this.layout = new SideLayout(this.panel, () => this.get_size(), true)
    this.layout.on_resize(() => this._coordinates = undefined)
  }

  get_size(): Size {
    const {visible, fixed_location} = this.model
    if (visible && fixed_location == null && this.is_renderable) {
      const {extents} = this
      const height = Math.round(extents.tick + extents.tick_label + extents.axis_label)
      return {width: 0, height}
    } else
      return {width: 0, height: 0}
  }

  get is_renderable(): boolean {
    const [range, cross_range] = this.ranges
    return range.is_valid && cross_range.is_valid && range.span > 0 && cross_range.span > 0
  }

  protected _render(): void {
    if (!this.is_renderable)
      return

    const {tick_coords, extents} = this

    const ctx = this.layer.ctx
    ctx.save()
    this._draw_rule(ctx, extents)
    this._draw_major_ticks(ctx, extents, tick_coords)
    this._draw_minor_ticks(ctx, extents, tick_coords)
    this._draw_major_labels(ctx, extents, tick_coords)
    this._draw_axis_label(ctx, extents, tick_coords)
    this._paint?.(ctx, extents, tick_coords)
    ctx.restore()
  }

  protected _paint?(ctx: Context2d, extents: Extents, tick_coords: TickCoords): void

  override connect_signals(): void {
    super.connect_signals()

    const {axis_label, major_label_overrides} = this.model.properties

    this.on_change(axis_label, async () => {
      this._axis_label_view?.remove()
      await this._init_axis_label()
    })

    this.on_change(major_label_overrides, async () => {
      for (const label_view of this._major_label_views.values()) {
        label_view.remove()
      }
      await this._init_major_labels()
    })

    this.connect(this.model.change, () => this.plot_view.request_layout())
  }

  override get needs_clip(): boolean {
    return this.model.fixed_location != null
  }

  // drawing sub functions -----------------------------------------------------

  protected _draw_rule(ctx: Context2d, _extents: Extents): void {
    if (!this.visuals.axis_line.doit)
      return

    const [xs, ys]     = this.rule_coords
    const [sxs, sys]   = this.coordinates.map_to_screen(xs, ys)
    const [nx, ny]     = this.normals
    const [xoff, yoff] = this.offsets

    this.visuals.axis_line.set_value(ctx)

    ctx.beginPath()
    for (let i = 0; i < sxs.length; i++) {
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
    const labels   = this.compute_labels(coords[this.dimension])
    const orient   = this.model.major_label_orientation
    const standoff = extents.tick + this.model.major_label_standoff
    const visuals  = this.visuals.major_label_text

    this._draw_oriented_labels(ctx, labels, coords, orient, this.panel.side, standoff, visuals)
  }

  protected _axis_label_extent(): number {
    if (this._axis_label_view == null)
      return 0

    const axis_label_graphics = this._axis_label_view.graphics()

    const padding = 3

    axis_label_graphics.visuals = this.visuals.axis_label_text.values()
    axis_label_graphics.angle = this.panel.get_label_angle_heuristic("parallel")

    if (isNumber(this.plot_view.base_font_size))
      axis_label_graphics.base_font_size = this.plot_view.base_font_size

    const size = axis_label_graphics.size()
    const extent = this.dimension == 0 ? size.height : size.width
    const standoff = this.model.axis_label_standoff

    return extent > 0 ? standoff + extent + padding : 0
  }

  protected _draw_axis_label(ctx: Context2d, extents: Extents, _tick_coords: TickCoords): void {
    if (this._axis_label_view == null || this.model.fixed_location != null)
      return

    const [sx, sy] = (() => {
      const {bbox} = this.layout
      switch (this.panel.side) {
        case "above":
          return [bbox.hcenter, bbox.bottom]
        case "below":
          return [bbox.hcenter, bbox.top]
        case "left":
          return [bbox.right, bbox.vcenter]
        case "right":
          return [bbox.left, bbox.vcenter]
      }
    })()

    const [nx, ny] = this.normals
    const standoff = extents.tick + extents.tick_label + this.model.axis_label_standoff
    const {vertical_align, align} = this.panel.get_label_text_heuristics("parallel")

    const position = {
      sx: sx + nx*standoff,
      sy: sy + ny*standoff,
      x_anchor: align,
      y_anchor: vertical_align,
    }

    const axis_label_graphics = this._axis_label_view.graphics()

    axis_label_graphics.visuals = this.visuals.axis_label_text.values()
    axis_label_graphics.angle = this.panel.get_label_angle_heuristic("parallel")

    if (this.plot_view.base_font_size != null)
      axis_label_graphics.base_font_size = this.plot_view.base_font_size

    axis_label_graphics.position = position
    axis_label_graphics.align = align
    axis_label_graphics.paint(ctx)
  }

  protected _draw_ticks(ctx: Context2d, coords: Coords, tin: number, tout: number, visuals: visuals.Line): void {
    if (!visuals.doit)
      return

    const [x, y]       = coords
    const [sxs, sys]   = this.coordinates.map_to_screen(x, y)
    const [nx, ny]     = this.normals
    const [xoff, yoff] = this.offsets

    const [nxin,  nyin]  = [nx * (xoff-tin),  ny * (yoff-tin)]
    const [nxout, nyout] = [nx * (xoff+tout), ny * (yoff+tout)]

    visuals.set_value(ctx)

    ctx.beginPath()
    for (let i = 0; i < sxs.length; i++) {
      const sx0 = Math.round(sxs[i] + nxout)
      const sy0 = Math.round(sys[i] + nyout)
      const sx1 = Math.round(sxs[i] + nxin)
      const sy1 = Math.round(sys[i] + nyin)
      ctx.moveTo(sx0, sy0)
      ctx.lineTo(sx1, sy1)
    }
    ctx.stroke()
  }

  protected _draw_oriented_labels(ctx: Context2d, labels: GraphicsBoxes, coords: Coords,
                                  orient: Orient | number, _side: Side, standoff: number,
                                  visuals: visuals.Text): void {
    if (!visuals.doit || labels.length == 0)
      return

    const [dxs, dys] = coords
    const [sxs, sys] = this.coordinates.map_to_screen(dxs, dys)
    const [xoff, yoff] = this.offsets

    const [nx, ny] = this.normals

    const nxd = nx*(xoff + standoff)
    const nyd = ny*(yoff + standoff)

    const {vertical_align, align} = this.panel.get_label_text_heuristics(orient)
    const angle = this.panel.get_label_angle_heuristic(orient)

    labels.visuals = visuals.values()
    labels.angle = angle
    labels.base_font_size = this.plot_view.base_font_size

    for (let i = 0; i < labels.length; i++) {
      const label = labels.items[i]
      label.position = {
        sx: sxs[i] + nxd,
        sy: sys[i] + nyd,
        x_anchor: align,
        y_anchor: vertical_align,
      }
      if (label instanceof TextBox)
        label.align = align
    }

    const n = labels.length
    const indices = Indices.all_set(n)

    const {items} = labels
    const bboxes = items.map((l) => l.bbox())
    const dist = ((): DistanceMeasure => {
      const [range] = this.ranges
      if (!range.is_reversed)
        return this.dimension == 0 ? (i, j) => bboxes[j].left - bboxes[i].right
                                   : (i, j) => bboxes[i].top - bboxes[j].bottom
      else
        return this.dimension == 0 ? (i, j) => bboxes[i].left - bboxes[j].right
                                   : (i, j) => bboxes[j].top - bboxes[i].bottom
    })()

    const {major_label_policy} = this.model
    const selected = major_label_policy.filter(indices, bboxes, dist)

    const ids = [...selected.ones()]
    if (ids.length != 0) {
      const cbox = this.parent.canvas_view.bbox

      const correct_x = (k: number) => {
        const bbox = bboxes[k]

        if (bbox.left < 0) {
          const offset = -bbox.left
          const {position} = items[k]
          items[k].position = {...position, sx: position.sx + offset}
        } else if (bbox.right > cbox.width) {
          const offset = bbox.right - cbox.width
          const {position} = items[k]
          items[k].position = {...position, sx: position.sx - offset}
        }
      }

      const correct_y = (k: number) => {
        const bbox = bboxes[k]

        if (bbox.top < 0) {
          const offset = -bbox.top
          const {position} = items[k]
          items[k].position = {...position, sy: position.sy + offset}
        } else if (bbox.bottom > cbox.height) {
          const offset = bbox.bottom - cbox.height
          const {position} = items[k]
          items[k].position = {...position, sy: position.sy - offset}
        }
      }

      const i = ids[0]
      const j = ids[ids.length - 1]

      if (this.dimension == 0) {
        correct_x(i)
        correct_x(j)
      } else {
        correct_y(i)
        correct_y(j)
      }
    }

    for (const i of selected) {
      const label = items[i]
      label.paint(ctx)
    }
  }

  // extents sub functions -----------------------------------------------------

  /*protected*/ _tick_extent(): number {
    return this.model.major_tick_out
  }

  protected _tick_label_extents(): number[] {
    const coords = this.tick_coords.major
    const labels = this.compute_labels(coords[this.dimension])

    const orient = this.model.major_label_orientation
    const standoff = this.model.major_label_standoff
    const visuals = this.visuals.major_label_text

    return [this._oriented_labels_extent(labels, orient, standoff, visuals)]
  }

  get extents(): Extents {
    const tick_labels = this._tick_label_extents()
    return {
      tick: this._tick_extent(),
      tick_labels,
      tick_label: sum(tick_labels),
      axis_label: this._axis_label_extent(),
    }
  }

  protected _oriented_labels_extent(labels: GraphicsBoxes, orient: Orient | number, standoff: number, visuals: visuals.Text): number {
    if (labels.length == 0 || !visuals.doit)
      return 0

    const angle = this.panel.get_label_angle_heuristic(orient)
    labels.visuals = visuals.values()
    labels.angle = angle
    labels.base_font_size = this.plot_view.base_font_size

    const size = labels.max_size()
    const extent = this.dimension == 0 ? size.height : size.width
    const padding = 3
    return extent > 0 ? standoff + extent + padding : 0
  }

  // {{{ TODO: state
  get normals(): [number, number] {
    return this.panel.normals
  }

  get dimension(): 0 | 1 {
    return this.panel.dimension
  }

  compute_labels(ticks: number[]): GraphicsBoxes {
    const labels = this.model.formatter.format_graphics(ticks, this)
    const {_major_label_views} = this

    const visited = new Set()
    for (let i = 0; i < ticks.length; i++) {
      const override = _major_label_views.get(ticks[i])
      if (override != null) {
        visited.add(override)
        labels[i] = override.graphics()
      }
    }

    // XXX: make sure unused overrides don't prevent document idle
    for (const label_view of this._major_label_views.values()) {
      if (!visited.has(label_view)) {
        (label_view as any)._has_finished = true
      }
    }

    return new GraphicsBoxes(labels)
  }

  get offsets(): [number, number] {
    // If we have a fixed_position then we should respect that exactly and
    // not apply any offsets (https://github.com/bokeh/bokeh/issues/8552)
    if (this.model.fixed_location != null)
      return [0, 0]

    const {frame} = this.plot_view
    let [xoff, yoff] = [0, 0]

    switch (this.panel.side) {
      case "below":
        yoff = abs(this.layout.bbox.top - frame.bbox.bottom)
        break
      case "above":
        yoff = abs(this.layout.bbox.bottom - frame.bbox.top)
        break
      case "right":
        xoff = abs(this.layout.bbox.left - frame.bbox.right)
        break
      case "left":
        xoff = abs(this.layout.bbox.right - frame.bbox.left)
        break
    }

    return [xoff, yoff]
  }

  get ranges(): [Range, Range] {
    const i = this.dimension
    const j = 1 - i
    const {ranges} = this.coordinates
    return [ranges[i], ranges[j]]
  }

  get computed_bounds(): [number, number] {
    const [range] = this.ranges

    const user_bounds = this.model.bounds
    const range_bounds = [range.min, range.max]

    if (user_bounds == "auto")
      return [range.min, range.max]
    else {
      let start: number
      let end: number

      const [user_start, user_end] = user_bounds
      const [range_start, range_end] = range_bounds

      const {min, max} = Math
      if (abs(user_start - user_end) > abs(range_start - range_end)) {
        start = max(min(user_start, user_end), range_start)
        end = min(max(user_start, user_end), range_end)
      } else {
        start = min(user_start, user_end)
        end = max(user_start, user_end)
      }

      return [start, end]
    }
  }

  get rule_coords(): Coords {
    const i = this.dimension
    const j = 1 - i
    const [range] = this.ranges
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

  get tick_coords(): TickCoords {
    const i = this.dimension
    const j = 1 - i
    const [range] = this.ranges
    const [start, end] = this.computed_bounds

    const ticks = this.model.ticker.get_ticks(start, end, range, this.loc)
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

  get loc(): number {
    const {fixed_location} = this.model
    if (fixed_location != null) {
      if (isNumber(fixed_location))
        return fixed_location

      const [, cross_range] = this.ranges
      if (cross_range instanceof FactorRange)
        return cross_range.synthetic(fixed_location)

      unreachable()
    }

    const [, cross_range] = this.ranges

    switch (this.panel.side) {
      case "left":
      case "below":
        return cross_range.start
      case "right":
      case "above":
        return cross_range.end
    }
  }
  // }}}

  override serializable_state(): SerializableState {
    return {
      ...super.serializable_state(),
      bbox: this.layout.bbox,
    }
  }

  override remove(): void {
    this._axis_label_view?.remove()

    for (const label_view of this._major_label_views.values()) {
      label_view.remove()
    }

    super.remove()
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    if (this._axis_label_view != null) {
      if (!this._axis_label_view.has_finished())
        return false
    }

    for (const label_view of this._major_label_views.values()) {
      if (!label_view.has_finished())
        return false
    }

    return true
  }
}

export namespace Axis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GuideRenderer.Props & {
    bounds: p.Property<[number, number] | "auto">
    ticker: p.Property<Ticker>
    formatter: p.Property<TickFormatter>
    axis_label: p.Property<string | BaseText | null>
    axis_label_standoff: p.Property<number>
    major_label_standoff: p.Property<number>
    major_label_orientation: p.Property<TickLabelOrientation | number>
    major_label_overrides: p.Property<Map<string /*Cat*/ | number, string | BaseText>>
    major_label_policy: p.Property<LabelingPolicy>
    major_tick_in: p.Property<number>
    major_tick_out: p.Property<number>
    minor_tick_in: p.Property<number>
    minor_tick_out: p.Property<number>
    fixed_location: p.Property<number | Factor | null>
  } & Mixins

  export type Mixins =
    mixins.AxisLine       &
    mixins.MajorTickLine  &
    mixins.MinorTickLine  &
    mixins.MajorLabelText &
    mixins.AxisLabelText

  export type Visuals = GuideRenderer.Visuals & {
    axis_line: visuals.Line
    major_tick_line: visuals.Line
    minor_tick_line: visuals.Line
    major_label_text: visuals.Text
    axis_label_text: visuals.Text
  }
}

export interface Axis extends Axis.Attrs {}

export class Axis extends GuideRenderer {
  declare properties: Axis.Props
  declare __view_type__: AxisView

  constructor(attrs?: Partial<Axis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AxisView

    this.mixins<Axis.Mixins>([
      ["axis_",        mixins.Line],
      ["major_tick_",  mixins.Line],
      ["minor_tick_",  mixins.Line],
      ["major_label_", mixins.Text],
      ["axis_label_",  mixins.Text],
    ])

    this.define<Axis.Props>(({Any, Int, Number, String, Ref, Map, Tuple, Or, Nullable, Auto}) => ({
      bounds:                  [ Or(Tuple(Number, Number), Auto), "auto" ],
      ticker:                  [ Ref(Ticker) ],
      formatter:               [ Ref(TickFormatter) ],
      axis_label:              [ Nullable(Or(String, Ref(BaseText))), null],
      axis_label_standoff:     [ Int, 5 ],
      major_label_standoff:    [ Int, 5 ],
      major_label_orientation: [ Or(TickLabelOrientation, Number), "horizontal" ],
      major_label_overrides:   [ Map(Or(String, Number), Or(String, Ref(BaseText))), new globalThis.Map(), {
        convert(v: any) {
          return isPlainObject(v) ? new Dict(v) : v
        },
      }],
      major_label_policy:      [ Ref(LabelingPolicy), () => new AllLabels() ],
      major_tick_in:           [ Number, 2 ],
      major_tick_out:          [ Number, 6 ],
      minor_tick_in:           [ Number, 0 ],
      minor_tick_out:          [ Number, 4 ],
      fixed_location:          [ Nullable(Or(Number, Any)), null ],
    }))

    this.override<Axis.Props>({
      axis_line_color: "black",

      major_tick_line_color: "black",
      minor_tick_line_color: "black",

      major_label_text_font_size: "11px",
      major_label_text_align: "center",        // XXX: remove
      major_label_text_baseline: "alphabetic", // XXX: remove

      axis_label_text_font_size: "13px",
      axis_label_text_font_style: "italic",
    })
  }
}
