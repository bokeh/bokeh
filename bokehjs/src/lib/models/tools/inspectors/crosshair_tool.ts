import {InspectTool, InspectToolView} from "./inspect_tool"
import {Renderer} from "../../renderers/renderer"
import {Span} from "../../annotations/span"
import {Dimension, Dimensions} from "core/enums"
import {MoveEvent} from "core/ui_events"
import * as p from "core/properties"
import {Color} from "core/types"
import {values} from "core/util/object"
import {tool_icon_crosshair} from "styles/icons.css"

export class CrosshairToolView extends InspectToolView {
  override model: CrosshairTool

  override _move(ev: MoveEvent): void {
    if (!this.model.active)
      return

    const {sx, sy} = ev

    if (!this.plot_view.frame.bbox.contains(sx, sy))
      this._update_spans(null, null)
    else
      this._update_spans(sx, sy)
  }

  override _move_exit(_e: MoveEvent): void {
    this._update_spans(null, null)
  }

  _update_spans(sx: number | null, sy: number | null): void {
    const {width, height} = this.model.spans
    const {frame} = this.plot_view

    function yinvert(sv: number) {
      switch (width.location_units) {
        case "canvas": return sv
        case "screen": return frame.bbox.yview.invert(sv)
        case "data":   return frame.y_scale.invert(sv)
      }
    }
    function xinvert(sv: number) {
      switch (height.location_units) {
        case "canvas": return sv
        case "screen": return frame.bbox.xview.invert(sv)
        case "data":   return frame.x_scale.invert(sv)
      }
    }

    const dims = this.model.dimensions
    width.location = sy != null && (dims == "width" || dims == "both") ? yinvert(sy) : null
    height.location = sx != null && (dims == "height" || dims == "both") ? xinvert(sx) : null
  }
}

export namespace CrosshairTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InspectTool.Props & {
    dimensions: p.Property<Dimensions>
    line_color: p.Property<Color>
    line_width: p.Property<number>
    line_alpha: p.Property<number>
    spans: p.Property<{width: Span, height: Span}>
  }
}

export interface CrosshairTool extends CrosshairTool.Attrs {}

export class CrosshairTool extends InspectTool {
  override properties: CrosshairTool.Props
  override __view_type__: CrosshairToolView

  constructor(attrs?: Partial<CrosshairTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CrosshairToolView

    this.define<CrosshairTool.Props>(({Alpha, Number, Color, Struct, Ref}) => ({
      dimensions: [ Dimensions, "both" ],
      line_color: [ Color, "black" ],
      line_width: [ Number, 1 ],
      line_alpha: [ Alpha, 1 ],
      spans: [
        Struct({width: Ref(Span), height: Ref(Span)}),
        (self) => ({
          width: span(self as CrosshairTool, "width"),
          height: span(self as CrosshairTool, "height"),
        }),
      ],
    }))

    function span(self: CrosshairTool, dimension: Dimension) {
      return new Span({
        dimension,
        location_units: "canvas",
        level: "overlay",
        line_color: self.line_color,
        line_width: self.line_width,
        line_alpha: self.line_alpha,
      })
    }

    this.register_alias("crosshair", () => new CrosshairTool())
  }

  override tool_name = "Crosshair"
  override tool_icon = tool_icon_crosshair

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  override get computed_overlays(): Renderer[] {
    return values(this.spans)
  }
}
