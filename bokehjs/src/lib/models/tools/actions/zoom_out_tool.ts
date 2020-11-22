import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import {bk_tool_icon_zoom_out} from "styles/icons"

export class ZoomOutToolView extends ZoomBaseToolView {
  model: ZoomBaseTool
}

export interface ZoomOutTool extends ZoomBaseTool.Attrs {}

export class ZoomOutTool extends ZoomBaseTool {
  properties: ZoomBaseTool.Props
  __view_type__: ZoomBaseToolView

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static init_ZoomOutTool(): void {
    this.prototype.default_view = ZoomOutToolView

    this.register_alias("zoom_out", () => new ZoomOutTool({dimensions: "both"}))
    this.register_alias("xzoom_out", () => new ZoomOutTool({dimensions: "width"}))
    this.register_alias("yzoom_out", () => new ZoomOutTool({dimensions: "height"}))
  }

  sign = -1 as -1
  tool_name = "Zoom Out"
  icon = bk_tool_icon_zoom_out
}
