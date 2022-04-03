import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import * as p from "core/properties"
import {Dimensions, BoxOrigin, SelectionMode} from "core/enums"
import {PanEvent, KeyEvent} from "core/ui_events"
import {RectGeometry} from "core/geometry"
import {Keys} from "core/dom"
import {tool_icon_box_select} from "styles/icons.css"

export class BoxSelectToolView extends SelectToolView {
  override model: BoxSelectTool

  override connect_signals(): void {
    super.connect_signals()

    const {pan} = this.model.overlay
    this.connect(pan, (phase) => {
      if ((phase == "pan" && this.model.select_every_mousemove) || phase == "pan:end") {
        const {left, top, right, bottom} = this.model.overlay
        if (left != null && top != null && right != null && bottom != null)
          this._do_select([left, right], [top, bottom], false, this.model.mode)
      }
    })

    const {active} = this.model.properties
    this.on_change(active, () => {
      if (!this.model.active)
        this._clear_overlay()
    })
  }

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

  override _pan_start(ev: PanEvent): void {
    const {sx, sy} = ev
    this._base_point = [sx, sy]
  }

  override _pan(ev: PanEvent): void {
    const {sx, sy} = ev
    const [sxlim, sylim] = this._compute_limits([sx, sy])

    const [left, right] = sxlim
    const [top, bottom] = sylim
    this.model.overlay.update({left, right, top, bottom})

    if (this.model.select_every_mousemove) {
      this._do_select(sxlim, sylim, false, this._select_mode(ev))
    }
  }

  override _pan_end(ev: PanEvent): void {
    const {sx, sy} = ev
    const [sxlim, sylim] = this._compute_limits([sx, sy])
    this._do_select(sxlim, sylim, true, this._select_mode(ev))

    if (!this.model.overlay.editable) {
      this._clear_overlay()
    }

    this._base_point = null
    this.plot_view.state.push("box_select", {selection: this.plot_view.get_selection()})
  }

  override _keyup(ev: KeyEvent): void {
    super._keyup(ev)

    // TODO: only if overlay is visible
    if (this.model.overlay.editable && ev.keyCode == Keys.Esc) {
      this._clear_overlay()
    }
  }

  _clear_overlay(): void {
    this.model.overlay.update({left: null, right: null, top: null, bottom: null})
  }

  _do_select([sx0, sx1]: [number, number], [sy0, sy1]: [number, number], final: boolean, mode: SelectionMode = "replace"): void {
    const geometry: RectGeometry = {type: "rect", sx0, sx1, sy0, sy1}
    this._select(geometry, final, mode)
  }
}

const DEFAULT_BOX_OVERLAY = () => {
  return new BoxAnnotation({
    level: "overlay",
    top_units: "canvas",
    left_units: "canvas",
    bottom_units: "canvas",
    right_units: "canvas",
    fill_color: "lightgrey",
    fill_alpha: 0.5,
    line_color: "black",
    line_alpha: 1.0,
    line_width: 2,
    line_dash: [4, 4],
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
  override properties: BoxSelectTool.Props
  override __view_type__: BoxSelectToolView

  override overlay: BoxAnnotation

  constructor(attrs?: Partial<BoxSelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxSelectToolView

    this.define<BoxSelectTool.Props>(({Boolean, Ref}) => ({
      dimensions:             [ Dimensions, "both" ],
      select_every_mousemove: [ Boolean, false ],
      overlay:                [ Ref(BoxAnnotation), DEFAULT_BOX_OVERLAY ],
      origin:                 [ BoxOrigin, "corner" ],
    }))

    this.register_alias("box_select", () => new BoxSelectTool())
    this.register_alias("xbox_select", () => new BoxSelectTool({dimensions: "width"}))
    this.register_alias("ybox_select", () => new BoxSelectTool({dimensions: "height"}))
  }

  override tool_name = "Box Select"
  override tool_icon = tool_icon_box_select
  override event_type = "pan" as "pan"
  override default_order = 30

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  override get computed_overlays() {
    return [...super.computed_overlays, this.overlay]
  }
}
