import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import {tool_icon_zoom_in} from "styles/icons.css"

export class ZoomInToolView extends ZoomBaseToolView {
  override model: ZoomBaseTool
}

export interface ZoomInTool extends ZoomBaseTool.Attrs {}

export class ZoomInTool extends ZoomBaseTool {
  override properties: ZoomBaseTool.Props
  override __view_type__: ZoomBaseToolView

  readonly maintain_focus: boolean = true

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ZoomInToolView

    this.register_alias("zoom_in", () => new ZoomInTool({dimensions: "both"}))
    this.register_alias("xzoom_in", () => new ZoomInTool({dimensions: "width"}))
    this.register_alias("yzoom_in", () => new ZoomInTool({dimensions: "height"}))
  }

  override sign = 1 as 1
  override tool_name = "Zoom In"
  override tool_icon = tool_icon_zoom_in
}
