import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import * as p from "core/properties"
import {Dimensions} from "core/enums"
import {GestureEvent} from "core/ui_events"
import {RectGeometry} from "core/geometry"

export class BoxSelectToolView extends SelectToolView {
  model: BoxSelectTool

  protected _base_point: [number, number] | null

  protected _compute_limits(curpoint: [number, number]): [[number, number], [number, number]] {
    const frame = this.plot_model.frame
    const dims = this.model.dimensions

    let base_point = this._base_point!
    if (this.model.origin == "center") {
      const [cx, cy] = base_point
      const [dx, dy] = curpoint
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    return this.model._get_dim_limits(base_point, curpoint, frame, dims)
  }

  _pan_start(ev: GestureEvent): void {
    const {sx, sy} = ev
    this._base_point = [sx, sy]
  }

  _pan(ev: GestureEvent): void {
    const {sx, sy} = ev
    const curpoint: [number, number] = [sx, sy]

    const [sxlim, sylim] = this._compute_limits(curpoint)
    this.model.overlay.update({left: sxlim[0], right: sxlim[1], top: sylim[0], bottom: sylim[1]})

    if (this.model.select_every_mousemove) {
      const append = ev.shiftKey
      this._do_select(sxlim, sylim, false, append)
    }
  }

  _pan_end(ev: GestureEvent): void {
    const {sx, sy} = ev
    const curpoint: [number, number] = [sx, sy]

    const [sxlim, sylim] = this._compute_limits(curpoint)
    const append = ev.shiftKey
    this._do_select(sxlim, sylim, true, append)

    this.model.overlay.update({left: null, right: null, top: null, bottom: null})

    this._base_point = null

    this.plot_view.push_state('box_select', {selection: this.plot_view.get_selection()})
  }

  _do_select([sx0, sx1]: [number, number], [sy0, sy1]: [number, number], final: boolean, append: boolean = false): void {
    const geometry: RectGeometry = {
      type: 'rect',
      sx0: sx0,
      sx1: sx1,
      sy0: sy0,
      sy1: sy1,
    }
    this._select(geometry, final, append)
  }

  _emit_callback(geometry: RectGeometry): void {
    const r = this.computed_renderers[0]
    const frame = this.plot_model.frame

    const xscale = frame.xscales[r.x_range_name]
    const yscale = frame.yscales[r.y_range_name]

    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = xscale.r_invert(sx0, sx1)
    const [y0, y1] = yscale.r_invert(sy0, sy1)

    const g = {x0, y0, x1, y1, ...geometry}
    this.model.callback.execute(this.model, {geometry: g})
  }
}

const DEFAULT_BOX_OVERLAY = () => {
  return new BoxAnnotation({
    level: "overlay",
    render_mode: "css",
    top_units: "screen",
    left_units: "screen",
    bottom_units: "screen",
    right_units: "screen",
    fill_color: {value: "lightgrey"},
    fill_alpha: {value: 0.5},
    line_color: {value: "black"},
    line_alpha: {value: 1.0},
    line_width: {value: 2},
    line_dash: {value: [4, 4]},
  })
}

export namespace BoxSelectTool {
  export interface Attrs extends SelectTool.Attrs {
    dimensions: Dimensions
    select_every_mousemove: boolean
    callback: any // XXX
    overlay: BoxAnnotation
    origin: "corner" | "center"
  }

  export interface Props extends SelectTool.Props {}
}

export interface BoxSelectTool extends BoxSelectTool.Attrs {}

export class BoxSelectTool extends SelectTool {

  properties: BoxSelectTool.Props

  constructor(attrs?: Partial<BoxSelectTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "BoxSelectTool"
    this.prototype.default_view = BoxSelectToolView

    this.define({
      dimensions:             [ p.Dimensions, "both"              ],
      select_every_mousemove: [ p.Bool,       false               ],
      callback:               [ p.Instance                        ],
      overlay:                [ p.Instance,   DEFAULT_BOX_OVERLAY ],
      origin:                 [ p.String,     "corner"            ], // Enum
    })
  }

  tool_name = "Box Select"
  icon = "bk-tool-icon-box-select"
  event_type = "pan" as "pan"
  default_order = 30

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}

BoxSelectTool.initClass()
