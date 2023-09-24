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
import type {Context2d} from "core/util/canvas"
import type {Layoutable} from "core/layout"
import {Column, Row, ContentLayoutable, Sizeable} from "core/layout"
import type {ContinuousAxis, ContinuousAxisView} from "../axes/continuous_axis"
import {LinearAxis} from "../axes/linear_axis"
import {Ticker} from "../tickers/ticker"
import {FixedTicker} from "../tickers/fixed_ticker"
import type {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {CoordinateTransform} from "../coordinates/coordinate_mapping"
import {build_view} from "core/build_views"
import {clamp} from "core/util/math"
import {process_placeholders, sprintf} from "core/util/templating"
import {Enum} from "../../core/kinds"

const {round} = Math

const LengthSizing = Enum("adaptive", "exact")
type LengthSizing = typeof LengthSizing["__type__"]

class TextLayout extends ContentLayoutable {

  constructor(readonly text: TextBox) {
    super()
  }

  _content_size(): Sizeable {
    return new Sizeable(this.text.size())
  }
}

/*
class FixedLayout extends ContentLayoutable {

  constructor(readonly size: Size) {
    super()
  }

  _content_size(): Sizeable {
    return new Sizeable(this.size)
  }
}
*/

export class ScaleBarView extends AnnotationView {
  declare model: ScaleBar
  declare visuals: ScaleBar.Visuals

  override bbox: BBox = new BBox()

  protected label_layout: TextLayout
  protected title_layout: TextLayout
  //protected bar_layout: FixedLayout
  protected box_layout: Layoutable

  protected axis: ContinuousAxis
  protected axis_view: ContinuousAxisView

  protected axis_scale: Scale
  protected cross_scale: Scale

  protected range: Range

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

    const {ticker} = this.model
    this.axis = new LinearAxis({
      ticker,
      ...mixins.attrs_of(this.model, "bar_", mixins.Line, "axis_"),
    })

    this.range = (() => {
      const {range, orientation} = this.model
      if (range == "auto") {
        const {frame} = this.parent
        switch (orientation) {
          case "horizontal": return frame.x_range
          case "vertical":   return frame.y_range
        }
      } else {
        return range
      }
    })()
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
    this.connect(this.range.change, () => {
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

    const {orientation, bar_length, length_sizing, padding, margin, location} = this.model
    const {border_line, bar_line} = this.visuals

    const bar_width = bar_line.line_width.get_value()
    const border_width = border_line.line_width.get_value()

    const {frame} = this.parent
    const frame_span = orientation == "horizontal" ? frame.bbox.width : frame.bbox.height

    const bar_length_percent = (() => {
      if (0.0 <= bar_length && bar_length <= 1.0) {
        return bar_length
      } else {
        return clamp(bar_length/frame_span, 0.0, 1.0)
      }
    })()

    const {new_value, new_unit, new_long_unit, scale_factor, exact} = (() => {
      const {unit, dimensional} = this.model
      const value = this.range.span*bar_length_percent
      return dimensional.compute(value, unit, length_sizing == "exact")
    })()

    const init_bar_length_px = frame_span*bar_length_percent
    const bar_length_px = round(init_bar_length_px*scale_factor)

    const label_layout = this.label_layout = (() => {
      const {label} = this.model
      const text = process_placeholders(label, (_, name, format) => {
        switch (name) {
          case "value": {
            if (exact) {
              if (format != null) {
                return sprintf(format, new_value)
              } else {
                return new_value.toFixed(2)
              }
            } else {
              return `${new_value}`
            }
          }
          case "unit": {
            switch (format ?? "short") {
              case "short": return new_unit
              case "long":  return new_long_unit
            }
          }
          default: {
            return "???"
          }
        }
      })
      const label_box = new TextBox({text})
      const label_panel = new Panel(this.model.label_location)

      label_box.visuals = this.visuals.label_text.values()
      const label_orientation = (() => {
        switch (this.model.label_location) {
          case "above":
          case "below": return "horizontal"
          default:      return orientation
        }
      })()
      label_box.angle = label_panel.get_label_angle_heuristic(label_orientation)
      label_box.base_font_size = this.plot_view.base_font_size

      label_box.position = {
        sx: 0,
        sy: 0,
        x_anchor: "left",
        y_anchor: "top",
      }
      label_box.align = "auto"

      const label_layout = new TextLayout(label_box)
      label_layout.absolute = true

      const horizontal = orientation == "horizontal"
      const {label_align} = this.model
      const halign = horizontal ? label_align : undefined
      const valign = !horizontal ? label_align : undefined

      label_layout.set_sizing({
        width_policy: "min",
        height_policy: "min",
        visible: text != "" && this.visuals.label_text.doit,
        halign, valign,
      })
      return label_layout
    })()

    const title_layout = this.title_layout = (() => {
      const text = this.model.title
      const title_box = new TextBox({text})
      const title_panel = new Panel(this.model.title_location)

      title_box.visuals = this.visuals.title_text.values()
      const title_orientation = (() => {
        switch (this.model.label_location) {
          case "above":
          case "below": return "horizontal"
          default:      return orientation
        }
      })()
      title_box.angle = title_panel.get_label_angle_heuristic(title_orientation)
      title_box.base_font_size = this.plot_view.base_font_size

      title_box.position = {
        sx: 0,
        sy: 0,
        x_anchor: "left",
        y_anchor: "top",
      }
      title_box.align = "auto"

      const title_layout = new TextLayout(title_box)
      title_layout.absolute = true

      const horizontal = orientation == "horizontal"
      const {title_align} = this.model
      const halign = horizontal ? title_align : undefined
      const valign = !horizontal ? title_align : undefined

      title_layout.set_sizing({
        width_policy: "min",
        height_policy: "min",
        visible: text != "" && this.visuals.title_text.doit,
        halign, valign,
      })

      return title_layout
    })()

    const bar_size = (() => {
      if (orientation == "horizontal") {
        return {width: bar_length_px, height: bar_width}
      } else {
        return {width: bar_width, height: bar_length_px}
      }
    })()
    /*
    const bar_layout = new FixedLayout(bar_size)
    bar_layout.set_sizing({width_policy: "fixed", height_policy: "fixed"})
    this.bar_layout = bar_layout
    */

    const axis_layout = this.axis_view.layout!
    axis_layout.absolute = true

    if (orientation == "horizontal") {
      axis_layout.set_sizing({
        width_policy: "fixed", width: bar_size.width,
        height_policy: "min",
        valign: "center",
      })
    } else {
      axis_layout.set_sizing({
        width_policy: "min",
        height_policy: "fixed", height: bar_size.height,
        halign: "center",
      })
    }

    const left = padding
    const top = padding

    const {title_location, label_location} = this.model

    const inner_layout = (() => {
      switch (label_location) {
        case "above": return new Column([label_layout, axis_layout])
        case "below": return new Column([axis_layout, label_layout])
        case "left":  return new Row([label_layout, axis_layout])
        case "right": return new Row([axis_layout, label_layout])
      }
    })()

    inner_layout.spacing = this.model.label_standoff
    inner_layout.absolute = true
    inner_layout.set_sizing()

    const outer_layout = (() => {
      switch (title_location) {
        case "above": return new Column([title_layout, inner_layout])
        case "below": return new Column([inner_layout, title_layout])
        case "left":  return new Row([title_layout, inner_layout])
        case "right": return new Row([inner_layout, title_layout])
      }
    })()

    outer_layout.spacing = this.model.title_standoff
    outer_layout.absolute = true
    outer_layout.position = {left, top}
    outer_layout.set_sizing()

    const box_layout = outer_layout
    this.box_layout = box_layout
    box_layout.compute()

    const [axis_range, cross_range] = (() => {
      const {x_range, y_range} = this.axis_view.bbox
      if (orientation == "horizontal") {
        return [x_range, y_range]
      } else {
        return [y_range, x_range]
      }
    })()
    this.axis_scale.source_range.end = new_value
    this.axis_scale.target_range.setv(axis_range)

    this.cross_scale.source_range.end = 1.0
    this.cross_scale.target_range.setv(cross_range)

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

  /*
  protected _draw_bar(ctx: Context2d): void {
    ctx.beginPath()
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
  */

  protected _draw_axis(_ctx: Context2d): void {
    this.axis_view.render()
  }

  protected _draw_text(ctx: Context2d, layout: TextLayout, location: Location): void {
    const {bbox} = layout

    const [x_offset, y_offset] = (() => {
      const {orientation} = this.model
      const horizontal = orientation == "horizontal"
      switch (location) {
        case "left":  return horizontal ? [0, 0] : [0, bbox.height]
        case "right": return horizontal ? [0, 0] : [bbox.width, 0]
        case "above": return [0, 0]
        case "below": return [0, 0]
      }
    })()

    const {left, top} = bbox.translate(x_offset, y_offset)
    ctx.translate(left, top)
    layout.text.paint(ctx)
    ctx.translate(-left, -top)
  }

  protected _draw_label(ctx: Context2d): void {
    this._draw_text(ctx, this.label_layout, this.model.label_location)
  }

  protected _draw_title(ctx: Context2d): void {
    this._draw_text(ctx, this.title_layout, this.model.title_location)
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
    /*
    if (this.bar_layout.visible) {
      this._draw_bar(ctx)
    }
    */
    if (this.axis_view.layout!.visible) {
      this._draw_axis(ctx)
    }
    if (this.label_layout.visible) {
      this._draw_label(ctx)
    }
    if (this.title_layout.visible) {
      this._draw_title(ctx)
    }
    ctx.translate(-left, -top)
  }
}

export namespace ScaleBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    range: p.Property<Range | "auto">
    unit: p.Property<string>
    dimensional: p.Property<Dimensional>
    orientation: p.Property<Orientation>
    bar_length: p.Property<number>
    length_sizing: p.Property<LengthSizing>
    location: p.Property<Anchor>
    label: p.Property<string>
    label_align: p.Property<Align>
    label_location: p.Property<Location>
    label_standoff: p.Property<number>
    title: p.Property<string>
    title_align: p.Property<Align>
    title_location: p.Property<Location>
    title_standoff: p.Property<number>
    margin: p.Property<number>
    padding: p.Property<number>
    ticker: p.Property<Ticker>
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

    this.define<ScaleBar.Props>(({NonNegative, Number, String, Ref, Or, Auto}) => ({
      range:          [ Or(Ref(Range), Auto), "auto" ],
      unit:           [ String, "m" ],
      dimensional:    [ Ref(Dimensional), () => new MetricLength() ],
      orientation:    [ Orientation, "horizontal" ],
      bar_length:     [ NonNegative(Number), 0.2 ],
      length_sizing:  [ LengthSizing, "adaptive" ],
      location:       [ Anchor, "top_right" ],
      label:          [ String, "@{value} @{unit}" ],
      label_align:    [ Align, "center" ],
      label_location: [ Location, "below" ],
      label_standoff: [ Number, 5 ],
      title:          [ String, "" ],
      title_align:    [ Align, "center" ],
      title_location: [ Location, "above" ],
      title_standoff: [ Number, 5 ],
      margin:         [ Number, 10 ],
      padding:        [ Number, 10 ],
      ticker:         [ Ref(Ticker), () => new FixedTicker({ticks: []}) ],
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
