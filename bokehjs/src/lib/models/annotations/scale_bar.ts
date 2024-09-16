import {Annotation, AnnotationView} from "./annotation"
import {Dimensional, MetricLength} from "./dimensional"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {Align, Orientation, Location, HAlign, VAlign} from "core/enums"
import * as enums from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {TextBox} from "core/graphics"
import {SideLayout, SidePanel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import type {Context2d} from "core/util/canvas"
import type {Size, Layoutable} from "core/layout"
import {TextLayout, FixedLayout} from "core/layout"
import type {GridItem} from "core/layout/grid"
import {Grid} from "core/layout/grid"
import type {ContinuousAxis, ContinuousAxisView} from "../axes/continuous_axis"
import {LinearAxis} from "../axes/linear_axis"
import {Ticker} from "../tickers/ticker"
import {FixedTicker} from "../tickers/fixed_ticker"
import type {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {CategoricalScale} from "../scales/categorical_scale"
import {CoordinateTransform} from "../coordinates/coordinate_mapping"
import {build_view} from "core/build_views"
import {clamp} from "core/util/math"
import {assert} from "core/util/assert"
import {enumerate} from "core/util/iterator"
import {isString} from "core/util/types"
import {process_placeholders, sprintf} from "core/util/templating"
import {Enum, Or, Tuple, Float} from "core/kinds"
import {AutoAnchor} from "../common/kinds"
import * as resolve from "../common/resolve"
import {Factor} from "../ranges/factor_range"

const {round} = Math

const Position = Or(enums.Anchor, Tuple(Or(Float, Factor, HAlign), Or(Float, Factor, VAlign)))
type Position = typeof Position["__type__"]

const PositionUnits = Enum("data", "screen", "view", "percent")
type PositionUnits = typeof PositionUnits["__type__"]

const LengthUnits = Enum("screen", "data", "percent")
type LengthUnits = typeof LengthUnits["__type__"]

const LengthSizing = Enum("adaptive", "exact")
type LengthSizing = typeof LengthSizing["__type__"]

export class ScaleBarView extends AnnotationView {
  declare model: ScaleBar
  declare visuals: ScaleBar.Visuals

  protected _bbox: BBox = new BBox()
  override get bbox(): BBox {
    return this._bbox
  }

  protected label_layout: TextLayout
  protected title_layout: TextLayout
  protected axis_layout: Layoutable
  protected box_layout: Grid

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
    this.axis_view.panel = new SidePanel(this.model.orientation == "horizontal" ? "below" : "right")
    this.axis_view.update_layout()
  }

  override remove(): void {
    this.axis_view.remove()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.change, () => {
      this.request_paint()
    })
    this.connect(this.range.change, () => {
      this.request_paint()
    })
  }

  override update_layout(): void {
    this.update_geometry()

    const {panel} = this
    if (panel != null) {
      this.layout = new SideLayout(panel, () => this.get_size())
    } else {
      this.layout = undefined
    }
  }

  override update_geometry(): void {
    super.update_geometry()
  }

  protected get horizontal(): boolean {
    return this.model.orientation == "horizontal"
  }

  protected text_layout(args: {
    text: string
    location: Location
    align: Align
    visuals: visuals.Text
  }): TextLayout {
    const {text, location, align, visuals} = args
    const {orientation} = this.model

    const text_box = new TextBox({text})
    const text_panel = new SidePanel(location)

    text_box.visuals = visuals.values()
    const text_orientation = (() => {
      switch (location) {
        case "above":
        case "below": return "horizontal"
        default:      return orientation
      }
    })()
    text_box.angle = text_panel.get_label_angle_heuristic(text_orientation)
    text_box.base_font_size = this.plot_view.base_font_size

    text_box.position = {
      sx: 0,
      sy: 0,
      x_anchor: "left",
      y_anchor: "top",
    }
    text_box.align = "auto"

    const text_layout = new TextLayout(text_box)
    text_layout.absolute = true

    const horizontal = orientation == "horizontal"
    const halign = horizontal ? align : undefined
    const valign = !horizontal ? align : undefined

    text_layout.set_sizing({
      width_policy: "min",
      height_policy: "min",
      visible: text != "" && visuals.doit,
      halign, valign,
    })
    return text_layout
  }

  override compute_geometry(): void {
    super.compute_geometry()

    const {orientation, length_sizing, padding, margin} = this.model
    const {border_line, bar_line} = this.visuals

    const bar_width = bar_line.line_width.get_value()
    const border_width = border_line.line_width.get_value()

    const {frame} = this.parent
    const frame_span = orientation == "horizontal" ? frame.bbox.width : frame.bbox.height

    const bar_length_percent = (() => {
      const {bar_length, bar_length_units} = this.model
      switch (bar_length_units) {
        case "screen": {
          if (0.0 <= bar_length && bar_length <= 1.0) {
            return bar_length
          } else {
            return clamp(bar_length/frame_span, 0.0, 1.0)
          }
        }
        case "data": {
          const scale = orientation == "horizontal" ? this.coordinates.x_scale : this.coordinates.y_scale
          assert(scale instanceof LinearScale || scale instanceof CategoricalScale)
          const [sv0, sv1] = scale.r_compute(0, bar_length)
          const sdist = Math.abs(sv1 - sv0)
          return sdist/frame_span
        }
        case "percent": {
          return clamp(bar_length, 0.0, 1.0)
        }
      }
    })()

    const {new_value, new_unit, scale_factor, exact} = (() => {
      const {unit, dimensional} = this.model
      const value = this.range.span*bar_length_percent
      return dimensional.compute(value, unit, length_sizing == "exact")
    })()

    const init_bar_length_px = frame_span*bar_length_percent
    const bar_length_px = round(init_bar_length_px*scale_factor)

    const label_text = (() => {
      const {label} = this.model
      return process_placeholders(label, (_, name, format) => {
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
            }
          }
          default: {
            return null
          }
        }
      })
    })()

    this.label_layout = this.text_layout({
      text: label_text,
      location: this.model.label_location,
      align: this.model.label_align,
      visuals: this.visuals.label_text,
    })

    this.title_layout = this.text_layout({
      text: this.model.title,
      location: this.model.title_location,
      align: this.model.title_align,
      visuals: this.visuals.title_text,
    })

    const bar_size = (() => {
      if (orientation == "horizontal") {
        return {width: bar_length_px, height: bar_width}
      } else {
        return {width: bar_width, height: bar_length_px}
      }
    })()

    const axis_layout = this.axis_view.layout
    assert(axis_layout != null)
    this.axis_layout = axis_layout

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

    this.box_layout = (() => {
      const panels = {
        above: [] as Layoutable[],
        below: [] as Layoutable[],
        left:  [] as Layoutable[],
        right: [] as Layoutable[],
      }

      function spacer(location: Location, spacing: number) {
        const layout = new FixedLayout()
        layout.absolute = true
        layout.set_sizing((() => {
          if (location == "left" || location == "right") {
            return {width_policy: "fixed", width: spacing}
          } else {
            return {height_policy: "fixed", height: spacing}
          }
        })())
        return layout
      }

      function insert(layout: Layoutable, location: Location, spacing: number) {
        if (layout.visible) {
          panels[location].push(spacer(location, spacing), layout)
        }
      }

      insert(this.label_layout, this.model.label_location, this.model.label_standoff)
      insert(this.title_layout, this.model.title_location, this.model.title_standoff)

      const row = panels.above.length
      const col = panels.left.length

      const items: GridItem<Layoutable>[] = [
        {layout: axis_layout, row, col},
      ]

      for (const [layout, i] of enumerate(panels.above)) {
        items.push({layout, row: row - i - 1, col})
      }
      for (const [layout, i] of enumerate(panels.below)) {
        items.push({layout, row: row + i + 1, col})
      }
      for (const [layout, i] of enumerate(panels.left)) {
        items.push({layout, row, col: col - i - 1})
      }
      for (const [layout, i] of enumerate(panels.right)) {
        items.push({layout, row, col: col + i + 1})
      }

      return new Grid(items)
    })()

    const {box_layout} = this
    box_layout.absolute = true
    box_layout.position = {left: padding, top: padding}
    box_layout.set_sizing()
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

    const position = (() => {
      const {location: position} = this.model
      if (isString(position)) {
        const normalized = (() => {
          switch (position) {
            case "top":    return "top_center"
            case "bottom": return "bottom_center"
            case "left":   return "center_left"
            case "center": return "center_center"
            case "right":  return "center_right"
            default:       return position
          }
        })()
        const [v_loc, h_loc] = normalized.split("_") as [VAlign, HAlign]
        return {x: h_loc, y: v_loc}
      } else {
        const [x_loc, y_loc] = position
        return {x: x_loc, y: y_loc}
      }
    })()

    const {x, y} = (() => {
      const panel = this.layout ?? this.plot_view.frame
      const inset = panel.bbox.shrink_by(margin)

      const x_pos = (() => {
        const {x} = position
        switch (x) {
          case "left":   return inset.left
          case "center": return inset.x_center
          case "right":  return inset.right
        }
        const x_mapper = (() => {
          switch (this.model.x_units) {
            case "data":    return this.coordinates.x_scale
            case "screen":  return panel.bbox.x_screen
            case "view":    return panel.bbox.x_view
            case "percent": return panel.bbox.x_percent
          }
        })()
        return x_mapper.compute(
          // @ts-ignore(TS2345): Argument of type 'number | ...' is not assignable to parameter of type 'number'.
          x,
        )
      })()
      const y_pos = (() => {
        const {y} = position
        switch (y) {
          case "top":    return inset.top
          case "center": return inset.y_center
          case "bottom": return inset.right
        }
        const y_mapper = (() => {
          switch (this.model.y_units) {
            case "data":    return this.coordinates.y_scale
            case "screen":  return panel.bbox.y_screen
            case "view":    return panel.bbox.y_view
            case "percent": return panel.bbox.y_percent
          }
        })()
        return y_mapper.compute(
          // @ts-ignore(TS2345): Argument of type 'number | ...' is not assignable to parameter of type 'number'.
          y,
        )
      })()
      return {x: x_pos, y: y_pos}
    })()

    const anchor = (() => {
      const anchor = resolve.anchor(this.model.anchor)
      const x_anchor = (() => {
        if (anchor.x == "auto") {
          switch (position.x) {
            case "left":   return 0.0
            case "center": return 0.5
            case "right":  return 1.0
            default:       return 0.5
          }
        } else {
          return anchor.x
        }
      })()
      const y_anchor = (() => {
        if (anchor.y == "auto") {
          switch (position.y) {
            case "top":    return 0.0
            case "center": return 0.5
            case "bottom": return 1.0
            default:       return 0.5
          }
        } else {
          return anchor.y
        }
      })()
      return {x: x_anchor, y: y_anchor}
    })()

    const width  = border_width + padding + box_layout.bbox.width  + padding + border_width
    const height = border_width + padding + box_layout.bbox.height + padding + border_width

    const sx = x - anchor.x*width
    const sy = y - anchor.y*height

    this._bbox = new BBox({left: sx, top: sy, width, height})
  }

  protected _draw_box(ctx: Context2d): void {
    const {width, height} = this.bbox
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    this.visuals.background_fill.apply(ctx)
    this.visuals.background_hatch.apply(ctx)
    this.visuals.border_line.apply(ctx)
  }

  protected _draw_axis(ctx: Context2d): void {
    this.axis_view.paint(ctx)
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

  protected _paint(ctx: Context2d): void {
    const {left, top} = this.bbox
    ctx.translate(left, top)
    if (this.box_layout.visible) {
      this._draw_box(ctx)
    }
    if (this.axis_layout.visible) {
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
    anchor: p.Property<AutoAnchor>
    bar_length: p.Property<number>
    bar_length_units: p.Property<LengthUnits>
    dimensional: p.Property<Dimensional>
    label: p.Property<string>
    label_align: p.Property<Align>
    label_location: p.Property<Location>
    label_standoff: p.Property<number>
    length_sizing: p.Property<LengthSizing>
    location: p.Property<Position>
    margin: p.Property<number>
    orientation: p.Property<Orientation>
    padding: p.Property<number>
    range: p.Property<Range | "auto">
    ticker: p.Property<Ticker>
    title: p.Property<string>
    title_align: p.Property<Align>
    title_location: p.Property<Location>
    title_standoff: p.Property<number>
    unit: p.Property<string>
    x_units: p.Property<PositionUnits>
    y_units: p.Property<PositionUnits>
  } & Mixins

  export type Mixins =
    mixins.BackgroundFill  &
    mixins.BackgroundHatch &
    mixins.BarLine         &
    mixins.BorderLine      &
    mixins.LabelText       &
    mixins.TitleText

  export type Visuals = Annotation.Visuals & {
    background_fill: visuals.Fill
    background_hatch: visuals.Hatch
    bar_line: visuals.Line
    border_line: visuals.Line
    label_text: visuals.Text
    title_text: visuals.Text
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
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
      ["bar_",        mixins.Line],
      ["border_",     mixins.Line],
      ["label_",      mixins.Text],
      ["title_",      mixins.Text],
    ])

    this.define<ScaleBar.Props>(({NonNegative, Float, Str, Ref, Or, Auto}) => ({
      anchor:           [ AutoAnchor, "auto" ],
      bar_length:       [ NonNegative(Float), 0.2 ],
      bar_length_units: [ LengthUnits, "screen" ],
      dimensional:      [ Ref(Dimensional), () => new MetricLength() ],
      label:            [ Str, "@{value} @{unit}" ],
      label_align:      [ Align, "center" ],
      label_location:   [ Location, "below" ],
      label_standoff:   [ Float, 5 ],
      length_sizing:    [ LengthSizing, "adaptive" ],
      location:         [ Position, "top_right" ],
      margin:           [ Float, 10 ],
      orientation:      [ Orientation, "horizontal" ],
      padding:          [ Float, 10 ],
      range:            [ Or(Ref(Range), Auto), "auto" ],
      ticker:           [ Ref(Ticker), () => new FixedTicker({ticks: []}) ],
      title:            [ Str, "" ],
      title_align:      [ Align, "center" ],
      title_location:   [ Location, "above" ],
      title_standoff:   [ Float, 5 ],
      unit:             [ Str, "m" ],
      x_units:          [ PositionUnits, "data" ],
      y_units:          [ PositionUnits, "data" ],
    }))

    this.override<ScaleBar.Props>({
      background_fill_alpha: 0.95,
      background_fill_color: "#ffffff",
      bar_line_width: 2,
      border_line_alpha: 0.5,
      border_line_color: "#e5e5e5",
      border_line_width: 1,
      label_text_baseline: "middle",
      label_text_font_size: "13px",
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
