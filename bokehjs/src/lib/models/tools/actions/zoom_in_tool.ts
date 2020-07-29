import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import {bk_tool_icon_zoom_in} from "styles/icons"

export interface ZoomInTool extends ZoomBaseTool.Attrs {}

export class ZoomInTool extends ZoomBaseTool {
  properties: ZoomBaseTool.Props
  __view_type__: ZoomBaseToolView

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static init_ZoomInTool(): void {
    this.prototype.default_view = ZoomBaseToolView

    this.register_alias("zoom_in", () => new ZoomInTool({dimensions: 'both'}))
    this.register_alias("xzoom_in", () => new ZoomInTool({dimensions: 'width'}))
    this.register_alias("yzoom_in", () => new ZoomInTool({dimensions: 'height'}))
  }

  sign = 1
  tool_name = "Zoom In"
  icon = bk_tool_icon_zoom_in

}
