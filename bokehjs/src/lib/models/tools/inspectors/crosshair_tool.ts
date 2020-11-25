import {InspectTool, InspectToolView} from "./inspect_tool"
import {Renderer} from "../../renderers/renderer"
import {Span} from "../../annotations/span"
import {Dimension, Dimensions} from "core/enums"
import {MoveEvent} from "core/ui_events"
import * as p from "core/properties"
import {Color} from "core/types"
import {values} from "core/util/object"
import {bk_tool_icon_crosshair} from "styles/icons"

export class CrosshairToolView extends InspectToolView {
  model: CrosshairTool

  _move(ev: MoveEvent): void {
    if (!this.model.active)
      return

    const {sx, sy} = ev

    if (!this.plot_view.frame.bbox.contains(sx, sy))
      this._update_spans(null, null)
    else
      this._update_spans(sx, sy)
  }

  _move_exit(_e: MoveEvent): void {
    this._update_spans(null, null)
  }

  _update_spans(x: number | null, y: number | null): void {
    const dims = this.model.dimensions
    if (dims == "width" || dims == "both")
      this.model.spans.width.location  = y
    if (dims == "height" || dims == "both")
      this.model.spans.height.location = x
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
  properties: CrosshairTool.Props
  __view_type__: CrosshairToolView

  constructor(attrs?: Partial<CrosshairTool.Attrs>) {
    super(attrs)
  }

  static init_CrosshairTool(): void {
    this.prototype.default_view = CrosshairToolView

    this.define<CrosshairTool.Props>(({Alpha, Number, Color}) => ({
      dimensions: [ Dimensions, "both" ],
      line_color: [ Color, "black" ],
      line_width: [ Number, 1 ],
      line_alpha: [ Alpha, 1 ],
    }))

    function span(self: CrosshairTool, dimension: Dimension) {
      return new Span({
        for_hover: true,
        dimension,
        location_units: "screen",
        level: "overlay",
        line_color: self.line_color,
        line_width: self.line_width,
        line_alpha: self.line_alpha,
      })
    }

    this.internal<CrosshairTool.Props>(({Struct, Ref}) => ({
      spans: [
        Struct({width: Ref(Span), height: Ref(Span)}),
        (self) => ({
          width: span(self as CrosshairTool, "width"),
          height: span(self as CrosshairTool, "height"),
        }),
      ],
    }))

    this.register_alias("crosshair", () => new CrosshairTool())
  }

  tool_name = "Crosshair"
  icon = bk_tool_icon_crosshair

  get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  get synthetic_renderers(): Renderer[] {
    return values(this.spans)
  }
}
