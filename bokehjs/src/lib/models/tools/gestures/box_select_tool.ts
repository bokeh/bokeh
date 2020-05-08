import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import * as p from "core/properties"
import {Dimensions, BoxOrigin} from "core/enums"
import {PanEvent} from "core/ui_events"
import {RectGeometry} from "core/geometry"
import {MenuItem} from "core/util/menus"
import {bk_tool_icon_box_select} from "styles/icons"

export class BoxSelectToolView extends SelectToolView {
  model: BoxSelectTool

  protected _base_point: [number, number] | null

  protected _compute_limits(curpoint: [number, number]): [[number, number], [number, number]] {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    let base_point = this._base_point!
    if (this.model.origin == "center") {
      const [cx, cy] = base_point
      const [dx, dy] = curpoint
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    return this.model._get_dim_limits(base_point, curpoint, frame, dims)
  }

  _pan_start(ev: PanEvent): void {
    const {sx, sy} = ev
    this._base_point = [sx, sy]
  }

  _pan(ev: PanEvent): void {
    const {sx, sy} = ev
    const curpoint: [number, number] = [sx, sy]

    const [sxlim, sylim] = this._compute_limits(curpoint)
    this.model.overlay.update({left: sxlim[0], right: sxlim[1], top: sylim[0], bottom: sylim[1]})

    if (this.model.select_every_mousemove) {
      const append = ev.shiftKey
      this._do_select(sxlim, sylim, false, append)
    }
  }

  _pan_end(ev: PanEvent): void {
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
    const geometry: RectGeometry = {type: 'rect', sx0, sx1, sy0, sy1}
    this._select(geometry, final, append)
  }

}

const DEFAULT_BOX_OVERLAY = () => {
  return new BoxAnnotation({
    level: "overlay",
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
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    dimensions: p.Property<Dimensions>
    select_every_mousemove: p.Property<boolean>
    overlay: p.Property<BoxAnnotation>
    origin: p.Property<BoxOrigin>
  }
}

export interface BoxSelectTool extends BoxSelectTool.Attrs {}

export class BoxSelectTool extends SelectTool {
  properties: BoxSelectTool.Props

  /** @override */
  overlay: BoxAnnotation

  constructor(attrs?: Partial<BoxSelectTool.Attrs>) {
    super(attrs)
  }

  static init_BoxSelectTool(): void {
    this.prototype.default_view = BoxSelectToolView

    this.define<BoxSelectTool.Props>({
      dimensions:             [ p.Dimensions, "both"              ],
      select_every_mousemove: [ p.Boolean,    false               ],
      overlay:                [ p.Instance,   DEFAULT_BOX_OVERLAY ],
      origin:                 [ p.BoxOrigin,  "corner"            ],
    })

    this.register_alias("box_select", () => new BoxSelectTool())
    this.register_alias("xbox_select", () => new BoxSelectTool({dimensions: 'width'}))
    this.register_alias("ybox_select", () => new BoxSelectTool({dimensions: 'height'}))
  }

  tool_name = "Box Select"
  icon = bk_tool_icon_box_select
  event_type = "pan" as "pan"
  default_order = 30

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }

  get menu(): MenuItem[] | null {
    return [
      {
        icon: "bk-tool-icon-replace-mode",
        tooltip: "Replace the current selection",
        handler: () => console.log("replace")
      }, {
        icon: "bk-tool-icon-append-mode",
        tooltip: "Append to the current selection (Shift)",
        handler: () => console.log("append"),
      }, {
        icon: "bk-tool-icon-intersect-mode",
        tooltip: "Intersect with the current selection (Ctrl)",
        handler: () => console.log("intersect"),
      }, {
        icon: "bk-tool-icon-subtract-mode",
        tooltip: "Subtract from the current selection (Shift+Ctrl)",
        handler: () => console.log("subtract"),
      },
      null,
      {
        icon: "bk-tool-icon-clear-selection",
        tooltip: "Clear the current selection (Esc)",
        handler: () => console.log("clear"),
      },
    ]
  }
}
