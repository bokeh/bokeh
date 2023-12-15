import {Annotation, AnnotationView} from "./annotation"
import {Title} from "./title"
import {CartesianFrame} from "../canvas/cartesian_frame"
import type {Axis} from "../axes"
import {LinearAxis} from "../axes"
import {Ticker} from "../tickers/ticker"
import {BasicTicker} from "../tickers"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTickFormatter} from "../formatters"
import {LabelingPolicy, NoOverlap} from "../policies/labeling"
import type {Scale} from "../scales"
import {LinearScale} from "../scales"
import type {Range} from "../ranges"
import {Range1d} from "../ranges"
import {BaseText} from "../text/base_text"
import {Anchor, Orientation} from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import type {Layoutable, SizingPolicy, Percent} from "core/layout"
import {Grid} from "core/layout"
import {HStack, VStack, NodeLayout} from "core/layout/alignments"
import {BorderLayout} from "core/layout/border"
import {Panel} from "core/layout/side_panel"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import {BBox} from "core/util/bbox"
import {isString, isPlainObject} from "core/util/types"
import {Dict} from "core/util/object"
import type {SerializableState} from "core/view"

const MINOR_DIM = 25
const MAJOR_DIM_MIN_SCALAR = 0.3
const MAJOR_DIM_MAX_SCALAR = 0.8

export abstract class BaseColorBarView extends AnnotationView {
  declare model: BaseColorBar
  declare visuals: BaseColorBar.Visuals
  declare layout: Layoutable

  protected _frame: CartesianFrame

  protected _axis: Axis
  protected _axis_view: Axis["__view_type__"]

  protected _title: Title
  protected _title_view: Title["__view_type__"]

  protected _ticker: Ticker
  protected _formatter: TickFormatter

  protected _inner_layout: BorderLayout

  protected _major_range: Range
  protected _major_scale: Scale
  protected _minor_range: Range
  protected _minor_scale: Scale

  private _orientation: Orientation
  get orientation(): Orientation {
    return this._orientation
  }

  override *children(): IterViews {
    yield* super.children()
    yield this._axis_view
    yield this._title_view
  }

  override initialize(): void {
    super.initialize()

    const {ticker, formatter} = this.model

    this._ticker = ticker != "auto" ? ticker : this._create_ticker()
    this._formatter = formatter != "auto" ? formatter : this._create_formatter()

    this._major_range = this._create_major_range()
    this._major_scale = this._create_major_scale()

    this._minor_range = new Range1d({start: 0, end: 1})
    this._minor_scale = new LinearScale()

    // configure some frame, update when the layout is know
    this._frame = new CartesianFrame(this._major_scale, this._minor_scale, this._major_range, this._minor_range)

    this._axis = this._create_axis()
    this._apply_axis_properties()

    this._title = new Title()
    this._apply_title_properties()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const self = this
    const parent: any = {
      get parent() {
        return self.parent
      },
      get root() {
        return self.root
      },
      get frame() {
        return self._frame
      },
      get canvas_view() {
        return self.plot_view.canvas_view
      },
      request_layout() {
        // force re-layout; not ideal but ColorBar's layout doesn't fully
        // participate in has_size_changed to detect if layout is needed
        self.layout.dirty = true
        self.parent.request_layout()
      },
      request_paint() {
        self.parent.request_paint(self)
      },
      request_render() {
        self.request_paint()
      },
      notify_finished_after_paint() {
        self.parent.notify_finished_after_paint()
      },
    }

    this._axis_view = await build_view(this._axis, {parent})
    this._title_view = await build_view(this._title, {parent})
  }

  override remove(): void {
    this._title_view.remove()
    this._axis_view.remove()
    super.remove()
  }

  protected _apply_axis_properties(): void {
    const attrs: Partial<Axis.Attrs> = {
      ticker: this._ticker,
      formatter: this._formatter,
      major_label_standoff: this.model.label_standoff,
      axis_line_color: null,
      major_tick_in: this.model.major_tick_in,
      major_tick_out: this.model.major_tick_out,
      minor_tick_in: this.model.minor_tick_in,
      minor_tick_out: this.model.minor_tick_out,
      major_label_overrides: this.model.major_label_overrides,
      major_label_policy: this.model.major_label_policy,
      // TODO: this needs strict typing
      ...mixins.attrs_of(this.model, "major_label_", mixins.Text, true),
      ...mixins.attrs_of(this.model, "major_tick_", mixins.Line, true),
      ...mixins.attrs_of(this.model, "minor_tick_", mixins.Line, true),
    }
    this._axis.setv(attrs)
  }

  protected _apply_title_properties(): void {
    const attrs: Partial<Title.Attrs> = {
      text: this.model.title ?? "",
      standoff: this.model.title_standoff,
      // TODO: this needs strict typing
      ...mixins.attrs_of(this.model, "title_", mixins.Text, false),
    }
    this._title.setv(attrs)
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      this._apply_title_properties()
      this._apply_axis_properties()
      // TODO?: this.plot_view.invalidate_layout()
    })
    this.connect(this._ticker.change, () => this.request_render())
    this.connect(this._formatter.change, () => this.request_render())
  }

  protected _update_frame(): void {
    const [x_scale, y_scale, x_range, y_range] = (() => {
      if (this.orientation == "horizontal")
        return [this._major_scale, this._minor_scale, this._major_range, this._minor_range] as const
      else
        return [this._minor_scale, this._major_scale, this._minor_range, this._major_range] as const
    })()
    this._frame.in_x_scale = x_scale
    this._frame.in_y_scale = y_scale
    this._frame.x_range = x_range
    this._frame.y_range = y_range
    this._frame.configure_scales()
  }

  override update_layout(): void {
    const {location, width: w, height: h, padding, margin} = this.model

    const [valign, halign] = (() => {
      if (isString(location)) {
        switch (location) {
          case "top_left":
            return ["start", "start"] as const
          case "top":
          case "top_center":
            return ["start", "center"] as const
          case "top_right":
            return ["start", "end"] as const
          case "bottom_left":
            return ["end", "start"] as const
          case "bottom":
          case "bottom_center":
            return ["end", "center"] as const
          case "bottom_right":
            return ["end", "end"] as const
          case "left":
          case "center_left":
            return ["center", "start"] as const
          case "center":
          case "center_center":
            return ["center", "center"] as const
          case "right":
          case "center_right":
            return ["center", "end"] as const
        }
      } else
        return ["end", "start"] as const // "bottom_left"
    })()

    const orientation = this._orientation = (() => {
      const {orientation} = this.model
      if (orientation == "auto") {
        if (this.panel != null)
          return this.panel.is_horizontal ? "horizontal" : "vertical"
        else {
          if (halign == "start" || halign == "end" || (/*halign == "center" &&*/ valign == "center"))
            return "vertical"
          else
            return "horizontal"
        }
      } else
        return orientation
    })()

    this._update_frame()

    const center_panel = new NodeLayout()
    const top_panel    = new VStack()
    const bottom_panel = new VStack()
    const left_panel   = new HStack()
    const right_panel  = new HStack()

    center_panel.absolute = true
    top_panel.absolute = true
    bottom_panel.absolute = true
    left_panel.absolute = true
    right_panel.absolute = true

    center_panel.on_resize((bbox) => this._frame.set_geometry(bbox))

    const layout = new BorderLayout()
    this._inner_layout = layout
    layout.absolute = true

    layout.center_panel = center_panel
    layout.top_panel    = top_panel
    layout.bottom_panel = bottom_panel
    layout.left_panel   = left_panel
    layout.right_panel  = right_panel

    const padding_box = {left: padding, right: padding, top: padding, bottom: padding}
    const margin_box = (() => {
      if (this.panel == null) {
        if (isString(location))
          return {left: margin, right: margin, top: margin, bottom: margin}
        else {
          const [left, bottom] = location
          return {left, right: margin, top: margin, bottom}
        }
      } else {
        /**
         * XXX: alignment is broken in Grid, which is used to govern positioning of a ColorBar
         * in side panels. Earlier attempts at fixing this failed and resulted in a multitude
         * or regressions in various places in the layout. So instead of this, let's assume that
         * the positioning is always at "start" regardless of configuration, and fix this here
         * by manually computing "center" and "end" alignment.
         */
        if (isString(location)) {
          layout.fixup_geometry = (outer, inner) => {
            const origin = outer

            if (orientation == "horizontal") {
              const {top, width, height} = outer
              if (halign == "end") {
                const {right} = this.layout.bbox
                outer = new BBox({right, top, width, height})
              } else if (halign == "center") {
                const {hcenter} = this.layout.bbox
                outer = new BBox({hcenter: Math.round(hcenter), top, width, height})
              }
            } else {
              const {left, width, height} = outer
              if (valign == "end") {
                const {bottom} = this.layout.bbox
                outer = new BBox({left, bottom, width, height})
              } else if (valign == "center") {
                const {vcenter} = this.layout.bbox
                outer = new BBox({left, vcenter: Math.round(vcenter), width, height})
              }
            }

            if (inner != null) {
              const dh = outer.left - origin.left
              const dv = outer.top - origin.top
              const {left, top, width, height} = inner
              inner = new BBox({left: left + dh, top: top + dv, width, height})
            }

            return [outer, inner]
          }
          return undefined
        } else {
          const [left, bottom] = location
          layout.fixup_geometry = (outer, inner) => {
            const origin = outer

            const grid = this.layout.bbox
            const {width, height} = outer
            outer = new BBox({left: grid.left + left, bottom: grid.bottom - bottom, width, height})

            if (inner != null) {
              const dh = outer.left - origin.left
              const dv = outer.top - origin.top
              const {left, top, width, height} = inner
              inner = new BBox({left: left + dh, top: top + dv, width, height})
            }

            return [outer, inner]
          }

          return {left, right: 0, top: 0, bottom}
        }
      }
    })()

    layout.padding = padding_box

    let major_policy: SizingPolicy
    let major_size: number | undefined
    let min_major_size: number | Percent | undefined
    let max_major_size: number | Percent | undefined
    if (this.panel != null) {
      major_policy = "max"
      major_size = undefined
      min_major_size = undefined
      max_major_size = undefined
    } else {
      if ((orientation == "horizontal" ? w : h) == "auto") {
        major_policy = "fixed"
        const major_size_factor = this._get_major_size_factor()
        if (major_size_factor != null)
          major_size = major_size_factor*MINOR_DIM
        min_major_size = {percent: MAJOR_DIM_MIN_SCALAR}
        max_major_size = {percent: MAJOR_DIM_MAX_SCALAR}
      } else {
        major_policy = "fit"
        major_size = undefined
      }
    }

    if (orientation == "horizontal") {
      const width = w == "auto" ? undefined : w
      const height = h == "auto" ? MINOR_DIM : h

      layout.set_sizing({
        width_policy: major_policy, height_policy: "min",
        width: major_size, min_width: min_major_size, max_width: max_major_size,
        halign, valign, margin: margin_box,
      })
      layout.center_panel.set_sizing({width_policy: w == "auto" ? "fit" : "fixed", height_policy: "fixed", width, height})
    } else {
      const width = w == "auto" ? MINOR_DIM : w
      const height = h == "auto" ? undefined : h

      layout.set_sizing({
        width_policy: "min", height_policy: major_policy,
        height: major_size, min_height: min_major_size, max_height: max_major_size,
        halign, valign, margin: margin_box,
      })
      layout.center_panel.set_sizing({width_policy: "fixed", height_policy: h == "auto" ? "fit" : "fixed", width, height})
    }

    top_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    bottom_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    left_panel.set_sizing({width_policy: "min", height_policy: "fit"})
    right_panel.set_sizing({width_policy: "min", height_policy: "fit"})

    const {_title_view} = this
    if (orientation == "horizontal") {
      _title_view.panel = new Panel("above")
      _title_view.update_layout()
      top_panel.children.push(_title_view.layout)
    } else {
      _title_view.panel = new Panel("left")
      _title_view.update_layout()
      left_panel.children.push(_title_view.layout)
    }

    const {panel} = this
    const side = (() => {
      if (panel != null && orientation == panel.orientation)
        return panel.side
      else
        return orientation == "horizontal" ? "below" : "right"
    })()

    const stack = (() => {
      switch (side) {
        case "above":
          return top_panel
        case "below":
          return bottom_panel
        case "left":
          return left_panel
        case "right":
          return right_panel
      }
    })()

    const {_axis_view} = this
    _axis_view.panel = new Panel(side)
    _axis_view.update_layout()
    if (_axis_view.layout != null)
      stack.children.push(_axis_view.layout)

    if (this.panel != null) {
      const outer = new Grid([{layout, row: 0, col: 0}])
      outer.absolute = true

      if (orientation == "horizontal") {
        outer.set_sizing({width_policy: "max", height_policy: "min"})
      } else {
        outer.set_sizing({width_policy: "min", height_policy: "max"})
      }

      this.layout = outer
    } else {
      this.layout = this._inner_layout
    }

    const {visible} = this.model
    this.layout.sizing.visible = visible
  }

  protected _create_axis(): Axis {
    return new LinearAxis()
  }

  protected _create_formatter(): TickFormatter {
    return new BasicTickFormatter()
  }

  protected _create_major_range(): Range {
    return new Range1d({start: 0, end: 1})
  }

  protected _create_major_scale(): Scale {
    return new LinearScale()
  }

  protected _create_ticker(): Ticker {
    return new BasicTicker()
  }

  protected _get_major_size_factor(): number | null {
    return null
  }

  protected abstract _paint_colors(ctx: Context2d, bbox: BBox): void

  protected _render(): void {
    const {ctx} = this.layer
    ctx.save()
    this._paint_bbox(ctx, this._inner_layout.bbox)
    this._paint_colors(ctx, this._inner_layout.center_panel.bbox)
    this._title_view.render()
    this._axis_view.render()
    ctx.restore()
  }

  protected _paint_bbox(ctx: Context2d, bbox: BBox): void {
    const {x, y} = bbox
    let {width, height} = bbox

    // XXX: shrink outline region by 1px to make right and bottom lines visible
    // if they are on the edge of the canvas.
    const {
      width: canvas_width,
      height: canvas_height,
    } = this.plot_view.canvas_view.bbox

    if (x + width >= canvas_width) {
      width -= 1
    }
    if (y + height >= canvas_height) {
      height -= 1
    }

    ctx.save()
    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fillRect(x, y, width, height)
    }
    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)
      ctx.strokeRect(x, y, width, height)
    }
    ctx.restore()
  }

  override serializable_state(): SerializableState {
    const {children = [], ...state} = super.serializable_state()
    children.push(this._title_view.serializable_state())
    children.push(this._axis_view.serializable_state())
    return {...state, children}
  }
}

export namespace BaseColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    location: p.Property<Anchor | [number, number]>
    orientation: p.Property<Orientation | "auto">
    title: p.Property<string | BaseText | null>
    title_standoff: p.Property<number>
    width: p.Property<number | "auto">
    height: p.Property<number | "auto">
    scale_alpha: p.Property<number>
    ticker: p.Property<Ticker | "auto">
    formatter: p.Property<TickFormatter | "auto">
    major_label_overrides: p.Property<Map<string | number, string | BaseText>>
    major_label_policy: p.Property<LabelingPolicy>
    label_standoff: p.Property<number>
    margin: p.Property<number>
    padding: p.Property<number>
    major_tick_in: p.Property<number>
    major_tick_out: p.Property<number>
    minor_tick_in: p.Property<number>
    minor_tick_out: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.MajorLabelText &
    mixins.TitleText      &
    mixins.MajorTickLine  &
    mixins.MinorTickLine  &
    mixins.BorderLine     &
    mixins.BarLine        &
    mixins.BackgroundFill

  export type Visuals = Annotation.Visuals & {
    major_label_text: visuals.Text
    title_text: visuals.Text
    major_tick_line: visuals.Line
    minor_tick_line: visuals.Line
    border_line: visuals.Line
    bar_line: visuals.Line
    background_fill: visuals.Fill
  }
}

export interface BaseColorBar extends BaseColorBar.Attrs {}

export class BaseColorBar extends Annotation {
  declare properties: BaseColorBar.Props
  declare __view_type__: BaseColorBarView

  constructor(attrs?: Partial<BaseColorBar.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<BaseColorBar.Mixins>([
      ["major_label_", mixins.Text],
      ["title_",       mixins.Text],
      ["major_tick_",  mixins.Line],
      ["minor_tick_",  mixins.Line],
      ["border_",      mixins.Line],
      ["bar_",         mixins.Line],
      ["background_",  mixins.Fill],
    ])

    this.define<BaseColorBar.Props>(({Alpha, Number, String, Tuple, Map, Or, Ref, Auto, Nullable}) => ({
      location:              [ Or(Anchor, Tuple(Number, Number)), "top_right" ],
      orientation:           [ Or(Orientation, Auto), "auto" ],
      title:                 [ Nullable(Or(String, Ref(BaseText))), null ],
      title_standoff:        [ Number, 2 ],
      width:                 [ Or(Number, Auto), "auto" ],
      height:                [ Or(Number, Auto), "auto" ],
      scale_alpha:           [ Alpha, 1.0 ],
      ticker:                [ Or(Ref(Ticker), Auto), "auto" ],
      formatter:             [ Or(Ref(TickFormatter), Auto), "auto" ],
      major_label_overrides: [ Map(Or(String, Number), Or(String, Ref(BaseText))), new globalThis.Map(), {
        convert(v: any) {
          return isPlainObject(v) ? new Dict(v) : v
        },
      }],
      major_label_policy:    [ Ref(LabelingPolicy), () => new NoOverlap() ],
      label_standoff:        [ Number, 5 ],
      margin:                [ Number, 30 ],
      padding:               [ Number, 10 ],
      major_tick_in:         [ Number, 5 ],
      major_tick_out:        [ Number, 0 ],
      minor_tick_in:         [ Number, 0 ],
      minor_tick_out:        [ Number, 0 ],
    }))

    this.override<BaseColorBar.Props>({
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      bar_line_color: null,
      border_line_color: null,
      major_label_text_font_size: "11px",
      major_tick_line_color: "#ffffff",
      minor_tick_line_color: null,
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
