import {InspectTool, InspectToolView} from "./inspect_tool"
import {Renderer} from "../../renderers/renderer"
import {Span} from "../../annotations/span"
import {Dimensions, SpatialUnits, RenderMode} from "core/enums"
import {MoveEvent} from "core/ui_events"
import * as p from "core/properties"
import {Color} from "core/types"
import {values} from "core/util/object"

export class CrosshairToolView extends InspectToolView {
  model: CrosshairTool

  _move(ev: MoveEvent): void {
    if (!this.model.active)
      return

    const {sx, sy} = ev

    if (!this.plot_model.frame.bbox.contains(sx, sy))
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
      this.model.spans.width.computed_location  = y
    if (dims == "height" || dims == "both")
      this.model.spans.height.computed_location = x
  }
}

export namespace CrosshairTool {
  export interface Attrs extends InspectTool.Attrs {
    dimensions: Dimensions
    line_color: Color
    line_width: number
    line_alpha: number

    location_units: SpatialUnits
    render_mode: RenderMode
    spans: {width: Span, height: Span}
  }

  export interface Props extends InspectTool.Props {}
}

export interface CrosshairTool extends CrosshairTool.Attrs {}

export class CrosshairTool extends InspectTool {

  properties: CrosshairTool.Props

  constructor(attrs?: Partial<CrosshairTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CrosshairTool"
    this.prototype.default_view = CrosshairToolView

    this.define({
      dimensions: [ p.Dimensions, "both" ],
      line_color: [ p.Color, 'black'     ],
      line_width: [ p.Number, 1          ],
      line_alpha: [ p.Number, 1.0        ],
    })

    this.internal({
      location_units: [ p.SpatialUnits, "screen" ],
      render_mode:    [ p.RenderMode,   "css"    ],
      spans:          [ p.Any                    ],
    })
  }

  tool_name = "Crosshair"
  icon = "bk-tool-icon-crosshair"

  get tooltip(): string {
    return this._get_dim_tooltip("Crosshair", this.dimensions)
  }

  get synthetic_renderers(): Renderer[] {
    return values(this.spans)
  }

  initialize(): void {
    super.initialize()

    this.spans = {
      width: new Span({
        for_hover: true,
        dimension: "width",
        render_mode: this.render_mode,
        location_units: this.location_units,
        line_color: this.line_color,
        line_width: this.line_width,
        line_alpha: this.line_alpha,
      }),
      height: new Span({
        for_hover: true,
        dimension: "height",
        render_mode: this.render_mode,
        location_units: this.location_units,
        line_color: this.line_color,
        line_width: this.line_width,
        line_alpha: this.line_alpha,
      }),
    }
  }
}

CrosshairTool.initClass()
