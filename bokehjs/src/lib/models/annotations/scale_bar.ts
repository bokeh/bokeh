import {Annotation, AnnotationView} from "./annotation"
import {Dimensional, MetricLength} from "./dimensional"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {Align, Anchor, Orientation, Location} from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {TextBox} from "core/graphics"
import type {Size} from "core/layout"
import {SideLayout, Panel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import {assert} from "core/util/assert"
import type {Context2d} from "core/util/canvas"
import type {Layoutable} from "core/layout"
import {Column, /*Row,*/ ContentLayoutable, Sizeable} from "core/layout"
import {bisect_right, bisect_right_by, sort_by} from "core/util/arrayable"
import type {ContinuousAxis, ContinuousAxisView} from "../axes/continuous_axis"
import {LinearAxis} from "../axes/linear_axis"
import {AdaptiveTicker} from "../tickers/adaptive_ticker"
import type {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {CoordinateTransform} from "../coordinates/coordinate_mapping"
import {build_view} from "core/build_views"

const {min, round} = Math

class TextLayout extends ContentLayoutable {

  constructor(readonly text: TextBox) {
    super()
  }

  _content_size(): Sizeable {
    return new Sizeable(this.text.size())
  }
}

class FixedLayout extends ContentLayoutable {

  constructor(readonly size: Size) {
    super()
  }

  _content_size(): Sizeable {
    return new Sizeable(this.size)
  }
}

const metric_ticks = [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750]
const metric_basis = [
  ["Q", 1e30,  "quetta"],
  ["R", 1e27,  "ronna"],
  ["Y", 1e24,  "yotta"],
  ["Z", 1e21,  "zetta"],
  ["E", 1e18,  "exa"],
  ["P", 1e15,  "peta"],
  ["T", 1e12,  "tera"],
  ["G", 1e9,   "giga"],
  ["M", 1e6,   "mega"],
  ["k", 1e3,   "kilo"],
  //["h", 1e2,   "hecto"],
  ["",  1e0,   ""],
  //["d", 1e-1,  "deci"],
  ["c", 1e-2,  "centi"],
  ["m", 1e-3,  "milli"],
  ["u", 1e-6,  "micro"],
  ["n", 1e-9,  "nano"],
  ["p", 1e-12, "pico"],
  ["f", 1e-15, "femto"],
  ["a", 1e-18, "atto"],
  ["z", 1e-21, "zepto"],
  ["y", 1e-24, "yocto"],
  ["r", 1e-27, "ronto"],
  ["q", 1e-30, "quecto"],
] as const
const metric_length = (() => {
  const short_name = "m"
  const long_name = "meter"
  return metric_basis.map(([short_prefix, factor, long_prefix]) => [`${short_prefix}${short_name}`, factor, `${long_prefix}${long_name}`] as const)
})()

/*
const imperial_ticks = [1, 3, 6, 12, 60]
const imperial_length = ([
  ["in",   1/12, "inch"   ],
  ["ft",      1, "foot"   ],
  ["yd",      3, "yard"   ],
  ["ch",     66, "chain"  ],
  ["fur",   660, "furlong"],
  ["mi",   5280, "mile"   ],
  ["lea", 15840, "league" ],
] as const).map((item) => item)
*/

export class ScaleBarView extends AnnotationView {
  declare model: ScaleBar
  declare visuals: ScaleBar.Visuals

  override bbox: BBox = new BBox()

  protected label_layout: TextLayout
  protected title_layout: TextLayout
  protected bar_layout: FixedLayout
  protected box_layout: Layoutable

  protected ticker: AdaptiveTicker
  protected axis: ContinuousAxis
  protected axis_view: ContinuousAxisView

  protected axis_scale: Scale
  protected cross_scale: Scale

  protected override _get_size(): Size {
    const {width, height} = this.bbox
    const {margin} = this.model
    return {
      width: width + 2*margin,
      height: height + 2*margin,
    }
  }

  override initialize(): void {
    super.initialize()
    this.ticker = new AdaptiveTicker({desired_num_ticks: 5})
    this.axis = new LinearAxis({ticker: this.ticker})
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const coordinates = (() => {
      const axis_source = new Range1d()
      const axis_target = new Range1d()
      const cross_source = new Range1d()
      const cross_target = new Range1d()
      this.axis_scale = new LinearScale({source_range: axis_source, target_range: axis_target})
      this.cross_scale = new LinearScale({source_range: cross_source, target_range: cross_target})
      if (this.model.orientation == "horizontal") {
        return new CoordinateTransform(this.axis_scale, this.cross_scale)
      } else {
        return new CoordinateTransform(this.cross_scale, this.axis_scale)
      }
    })()

    this.axis_view = await build_view(this.axis, {parent: this.plot_view})
    this.axis_view.coordinates = coordinates
    this.axis_view.panel = new Panel(this.model.orientation == "horizontal" ? "below" : "right")
    this.axis_view.update_layout()
  }

  override remove(): void {
    this.axis_view.remove()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.change, () => {
      this.request_render()
    })
    this.connect(this.model.range.change, () => {
      this.request_render()
    })
  }

  override update_layout(): void {
    this.update_geometry()

    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size())
    else
      this.layout = undefined
  }

  override update_geometry(): void {
    super.update_geometry()
  }

  override compute_geometry(): void {
    super.compute_geometry()

    const {orientation, bar_length, padding, margin, location} = this.model
    const {border_line, bar_line} = this.visuals

    const bar_width = bar_line.line_width.get_value()
    const border_width = border_line.line_width.get_value()

    const {range, unit} = this.model

    const ticks = metric_ticks
    const dimensional = sort_by(metric_length, ([, factor]) => factor)

    const found_unit = dimensional.find(([short_name]) => short_name == unit)
    assert(found_unit != null)
    const [, unit_factor] = found_unit

    const value = range.span*bar_length
    const value_in_unit = value*unit_factor

    const [new_unit, new_value] = (() => {
      const index = bisect_right_by(dimensional, value_in_unit, ([, factor]) => factor)
      if (index > 0) {
        const [new_unit, factor] = dimensional[index - 1]
        const new_value = value_in_unit/factor
        return [new_unit, new_value]
      } else {
        return [unit, value_in_unit]
      }
    })()

    const exact = ticks.length == 0

    const preferred_value = (() => {
      if (exact) {
        return new_value
      } else {
        const index = bisect_right(ticks, new_value)
        return ticks[min(index, ticks.length-1)]
      }
    })()

    const {frame} = this.parent

    const frame_span = orientation == "horizontal" ? frame.bbox.width : frame.bbox.height
    //const range_span = range.span
    assert(0 < bar_length && bar_length <= 1)

    const preferred_value_raw = preferred_value*(value_in_unit/new_value)
    const scale_factor = (preferred_value_raw/value)/unit_factor
    const init_bar_length_px = frame_span*bar_length
    const bar_length_px = round(init_bar_length_px*scale_factor)

    console.log(value, value_in_unit, unit, new_value, new_unit, preferred_value, preferred_value_raw, init_bar_length_px, scale_factor, bar_length_px)

    const label = `${exact ? preferred_value.toFixed(2) : preferred_value} ${new_unit}`
    const label_box = new TextBox({text: label})
    label_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    label_box.visuals = this.visuals.label_text.values()
    const label_panel = new Panel(this.model.label_location)
    label_box.angle = label_panel.get_label_angle_heuristic("parallel")

    const {title} = this.model
    const title_box = new TextBox({text: title})
    title_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    title_box.visuals = this.visuals.title_text.values()
    const title_panel = new Panel(this.model.title_location)
    title_box.angle = title_panel.get_label_angle_heuristic("parallel")

    const label_layout = new TextLayout(label_box)
    label_layout.set_sizing({visible: label != "" && this.visuals.label_text.doit})
    this.label_layout = label_layout

    const title_layout = new TextLayout(title_box)
    title_layout.set_sizing({visible: title != "" && this.visuals.title_text.doit})
    this.title_layout = title_layout

    const bar_size = (() => {
      if (orientation == "horizontal") {
        return {width: bar_length_px, height: bar_width}
      } else {
        return {width: bar_width, height: bar_length_px}
      }
    })()
    const bar_layout = new FixedLayout(bar_size)
    bar_layout.set_sizing({width_policy: "fixed", height_policy: "fixed"})
    this.bar_layout = bar_layout

    const axis_layout = this.axis_view.layout!

    if (orientation == "horizontal") {
      axis_layout.set_sizing({width_policy: "fixed", width: bar_size.width})
    } else {
      axis_layout.set_sizing({height_policy: "fixed", height: bar_size.height})
    }

    const left = padding
    const top = padding

    const {title_location, label_location} = this.model

    const children = []
    if (title_location == "above") {
      children.push(title_layout)
    }
    if (label_location == "above") {
      children.push(label_layout)
    }
    children.push(bar_layout)
    children.push(axis_layout)
    if (label_location == "below") {
      children.push(label_layout)
    }
    if (title_location == "below") {
      children.push(title_layout)
    }

    const box_layout = new Column(children)
    box_layout.position = {left, top}
    box_layout.spacing = this.model.label_standoff
    box_layout.set_sizing()
    box_layout.compute()
    this.box_layout = box_layout
    console.log(`${this.bar_layout.bbox}`, bar_length_px)

    this.axis_scale.source_range.end = preferred_value
    this.axis_scale.target_range.setv(this.axis_view.bbox.x_range)

    this.cross_scale.source_range.end = 1.0
    this.cross_scale.target_range.setv(this.axis_view.bbox.y_range)

    const width  = border_width + padding + box_layout.bbox.width  + padding + border_width
    const height = border_width + padding + box_layout.bbox.height + padding + border_width

    const panel = this.layout != null ? this.layout : this.plot_view.frame
    const [hr, vr] = panel.bbox.ranges

    const {sx, sy} = (() => {
      switch (location) {
        case "top_left":
          return {
            sx: hr.start + margin,
            sy: vr.start + margin,
          }
        case "top":
        case "top_center":
          return {
            sx: (hr.end + hr.start)/2 - width/2,
            sy: vr.start + margin,
          }
        case "top_right":
          return {
            sx: hr.end - margin - width,
            sy: vr.start + margin,
          }
        case "bottom_right":
          return {
            sx: hr.end - margin - width,
            sy: vr.end - margin - height,
          }
        case "bottom":
        case "bottom_center":
          return {
            sx: (hr.end + hr.start)/2 - width/2,
            sy: vr.end - margin - height,
          }
        case "bottom_left":
          return {
            sx: hr.start + margin,
            sy: vr.end - margin - height,
          }
        case "left":
        case "center_left":
          return {
            sx: hr.start + margin,
            sy: (vr.end + vr.start)/2 - height/2,
          }
        case "center":
        case "center_center":
          return {
            sx: (hr.end + hr.start)/2 - width/2,
            sy: (vr.end + vr.start)/2 - height/2,
          }
        case "right":
        case "center_right":
          return {
            sx: hr.end - margin - width,
            sy: (vr.end + vr.start)/2 - height/2,
          }
      }
    })()

    this.bbox = new BBox({left: sx, top: sy, width, height})
  }

  protected _draw_box(ctx: Context2d): void {
    const {width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    this.visuals.background_fill.apply(ctx)
    this.visuals.background_hatch.apply(ctx)
    this.visuals.border_line.apply(ctx)
  }

  protected _draw_bar(ctx: Context2d): void {
    ctx.beginPath()
    //console.log(this.bar_layout.toString())
    if (this.model.orientation == "horizontal") {
      const {left, right, vcenter} = this.bar_layout.bbox
      ctx.moveTo(left, vcenter)
      ctx.lineTo(right, vcenter)
    } else {
      const {top, bottom, hcenter} = this.bar_layout.bbox
      ctx.moveTo(hcenter, top)
      ctx.lineTo(hcenter, bottom)
    }
    this.visuals.bar_line.apply(ctx)
  }

  protected _draw_axis(_ctx: Context2d): void {
    this.axis_view.render()
  }

  protected _draw_title(ctx: Context2d): void {
    const {left, top} = this.title_layout.bbox
    ctx.translate(left, top)
    this.title_layout.text.paint(ctx)
    ctx.translate(-left, -top)
  }

  protected _draw_label(ctx: Context2d): void {
    const {left, top} = this.label_layout.bbox
    ctx.translate(left, top)
    this.label_layout.text.paint(ctx)
    ctx.translate(-left, -top)
  }

  protected _render(): void {
    // It would be better to update geometry (the internal layout) only when
    // necessary, but conditions for that are not clear, so for now update
    // at every render.
    this.update_geometry()
    this.compute_geometry()

    const {ctx} = this.layer
    const {left, top} = this.bbox
    ctx.translate(left, top)
    if (this.box_layout.visible) {
      this._draw_box(ctx)
    }
    if (this.bar_layout.visible) {
      this._draw_bar(ctx)
    }
    if (this.axis_view.layout!.visible) {
      this._draw_axis(ctx)
    }
    if (this.title_layout.visible) {
      this._draw_title(ctx)
    }
    if (this.label_layout.visible) {
      this._draw_label(ctx)
    }
    ctx.translate(-left, -top)
  }
}

export namespace ScaleBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    range: p.Property<Range>
    unit: p.Property<string>
    dimensional: p.Property<Dimensional>
    orientation: p.Property<Orientation>
    bar_length: p.Property<number>
    location: p.Property<Anchor>
    label_align: p.Property<Align>
    label_location: p.Property<Location>
    label_standoff: p.Property<number>
    title: p.Property<string>
    title_align: p.Property<Align>
    title_location: p.Property<Location>
    title_standoff: p.Property<number>
    margin: p.Property<number>
    padding: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.BarLine         &
    mixins.LabelText       &
    mixins.TitleText       &
    mixins.BorderLine      &
    mixins.BackgroundFill  &
    mixins.BackgroundHatch

  export type Visuals = Annotation.Visuals & {
    bar_line: visuals.Line
    label_text: visuals.Text
    title_text: visuals.Text
    border_line: visuals.Line
    background_fill: visuals.Fill
    background_hatch: visuals.Hatch
  }
}

export interface ScaleBar extends ScaleBar.Attrs {}

export class ScaleBar extends Annotation {
  declare properties: ScaleBar.Props
  declare __view_type__: ScaleBarView

  constructor(attrs?: Partial<ScaleBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ScaleBarView

    this.mixins<ScaleBar.Mixins>([
      ["bar_",        mixins.Line],
      ["label_",      mixins.Text],
      ["title_",      mixins.Text],
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
    ])

    this.define<ScaleBar.Props>(({Percent, Number, String, Ref}) => ({
      range:          [ Ref(Range) ],
      unit:           [ String, "m" ],
      dimensional:    [ Ref(Dimensional), () => new MetricLength() ],
      orientation:    [ Orientation, "horizontal" ],
      bar_length:     [ Percent, 0.2 ],
      location:       [ Anchor, "top_right" ],
      label_align:    [ Align, "center" ],
      label_location: [ Location, "below" ],
      label_standoff: [ Number, 5 ],
      title:          [ String, "" ],
      title_align:    [ Align, "center" ],
      title_location: [ Location, "above" ],
      title_standoff: [ Number, 5 ],
      margin:         [ Number, 10 ],
      padding:        [ Number, 10 ],
    }))

    this.override<ScaleBar.Props>({
      bar_line_width: 2,
      border_line_color: "#e5e5e5",
      border_line_alpha: 0.5,
      border_line_width: 1,
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      label_text_font_size: "13px",
      label_text_baseline: "middle",
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
