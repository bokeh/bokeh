import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import {tool_icon_zoom_in} from "styles/icons.css"

export class ZoomInToolView extends ZoomBaseToolView {
  declare model: ZoomBaseTool

  get factor(): number {
    return this.model.factor
  }
}

export interface ZoomInTool extends ZoomBaseTool.Attrs {}

export class ZoomInTool extends ZoomBaseTool {
  declare properties: ZoomBaseTool.Props
  declare __view_type__: ZoomBaseToolView

  readonly maintain_focus: boolean = true

  static {
    this.prototype.default_view = ZoomInToolView

  }

  override tool_name = "Zoom In"
  override tool_icon = tool_icon_zoom_in
}
