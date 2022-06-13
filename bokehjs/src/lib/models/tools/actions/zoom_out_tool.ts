import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import {tool_icon_zoom_out} from "styles/icons.css"
import * as p from "core/properties"

export class ZoomOutToolView extends ZoomBaseToolView {
  override model: ZoomBaseTool
}

export namespace ZoomOutTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ZoomBaseTool.Props & {
    maintain_focus: p.Property<boolean>
  }
}

export interface ZoomOutTool extends ZoomBaseTool.Attrs {}

export class ZoomOutTool extends ZoomBaseTool {
  override properties: ZoomOutTool.Props
  override __view_type__: ZoomBaseToolView

  maintain_focus: boolean

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ZoomOutToolView

    this.define<ZoomOutTool.Props>(({Boolean}) => ({
      maintain_focus: [ Boolean, true ],
    }))

    this.register_alias("zoom_out", () => new ZoomOutTool({dimensions: "both"}))
    this.register_alias("xzoom_out", () => new ZoomOutTool({dimensions: "width"}))
    this.register_alias("yzoom_out", () => new ZoomOutTool({dimensions: "height"}))
  }

  override sign = -1 as -1
  override tool_name = "Zoom Out"
  override tool_icon = tool_icon_zoom_out
}
