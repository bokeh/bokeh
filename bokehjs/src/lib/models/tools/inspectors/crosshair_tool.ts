import {InspectTool, InspectToolView} from "./inspect_tool"
import type {Renderer} from "../../renderers/renderer"
import {Span} from "../../annotations/span"
import type {Dimension} from "core/enums"
import {Dimensions} from "core/enums"
import type {MoveEvent} from "core/ui_events"
import type * as p from "core/properties"
import type {Color} from "core/types"
import {isArray} from "core/util/types"
import {tool_icon_crosshair} from "styles/icons.css"

export class CrosshairToolView extends InspectToolView {
  declare model: CrosshairTool

  protected _spans: Span[]

  override get overlays(): Renderer[] {
    return [...super.overlays, ...this._spans]
  }

  override initialize(): void {
    super.initialize()
    this._update_overlays()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {overlay, dimensions, line_color, line_width, line_alpha} = this.model.properties
    this.on_change([overlay, dimensions, line_color, line_width, line_alpha], () => {
      this._update_overlays()
      // TODO: notify change
    })
  }

  protected _update_overlays(): void {
    const {overlay} = this.model
    if (overlay == "auto") {
      const {dimensions, line_color, line_alpha, line_width} = this.model

      function span(dimension: Dimension) {
        return new Span({
          dimension,
          location_units: "canvas",
          level: "overlay",
          line_color,
          line_width,
          line_alpha,
        })
      }

      switch (dimensions) {
        case "width": {
          this._spans = [span("width")]
          break
        }
        case "height": {
          this._spans = [span("height")]
          break
        }
        case "both": {
          this._spans = [span("width"), span("height")]
          break
        }
      }
    } else if (isArray(overlay)) {
      this._spans = [...overlay]
    } else {
      this._spans = [overlay]
    }
  }

  override _move(ev: MoveEvent): void {
    if (!this.model.active) {
      return
    }

    const {sx, sy} = (() => {
      const {sx, sy} = ev
      if (this.plot_view.frame.bbox.contains(sx, sy)) {
        return {sx, sy}
      }

      const axis_view = this.plot_view.axis_views.find((view) => view.bbox.contains(sx, sy))
      if (axis_view != null) {
        switch (axis_view.dimension) {
          case 0: return {sx, sy: NaN}
          case 1: return {sx: NaN, sy}
        }
      }

      return {sx: NaN, sy: NaN}
    })()

    this._update_spans(sx, sy)
  }

  override _move_exit(_e: MoveEvent): void {
    this._update_spans(NaN, NaN)
  }

  _update_spans(sx: number, sy: number): void {
    const {frame} = this.plot_view

    function invert(span: Span, sx: number, sy: number) {
      const {dimension} = span
      switch (span.location_units) {
        case "canvas": {
          return dimension == "width" ? sy : sx
        }
        case "screen": {
          const {xview, yview} = frame.bbox
          return dimension == "width" ? yview.invert(sy) : xview.invert(sx)
        }
        case "data": {
          const {x_scale, y_scale} = frame
          return dimension == "width" ? y_scale.invert(sy) : x_scale.invert(sx)
        }
      }
    }

    for (const span of this._spans) {
      span.location = invert(span, sx, sy)
    }
  }
}

export namespace CrosshairTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InspectTool.Props & {
    overlay: p.Property<"auto" | Span | [Span, Span] >
    dimensions: p.Property<Dimensions>
    line_color: p.Property<Color>
    line_width: p.Property<number>
    line_alpha: p.Property<number>
  }
}

export interface CrosshairTool extends CrosshairTool.Attrs {}

export class CrosshairTool extends InspectTool {
  declare properties: CrosshairTool.Props
  declare __view_type__: CrosshairToolView

  constructor(attrs?: Partial<CrosshairTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CrosshairToolView

    this.define<CrosshairTool.Props>(({Alpha, Float, Color, Auto, Tuple, Ref, Or}) => ({
      overlay: [ Or(Auto, Ref(Span), Tuple(Ref(Span), Ref(Span))), "auto" ],
      dimensions: [ Dimensions, "both" ],
      line_color: [ Color, "black" ],
      line_width: [ Float, 1 ],
      line_alpha: [ Alpha, 1 ],
    }))

    this.register_alias("crosshair", () => new CrosshairTool())
    this.register_alias("xcrosshair", () => new CrosshairTool({dimensions: "width"}))
    this.register_alias("ycrosshair", () => new CrosshairTool({dimensions: "height"}))
  }

  override tool_name = "Crosshair"
  override tool_icon = tool_icon_crosshair

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }
}
