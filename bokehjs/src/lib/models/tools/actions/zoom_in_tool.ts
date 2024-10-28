import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import type {KeyBinding} from "../tool"
import {tool_icon_zoom_in} from "styles/icons.css"

export class ZoomInToolView extends ZoomBaseToolView {
  declare model: ZoomBaseTool

  get factor(): number {
    return this.model.factor
  }

  override key_bindings(): KeyBinding[] {
    return [
      ...super.key_bindings(),
      {keys: ["+"], cmd: "zoom_in", action: () => this.doit()},
      {keys: ["z", "i"], cmd: "zoom_in", action: () => this.doit()},
    ]
  }
}

export interface ZoomInTool extends ZoomBaseTool.Attrs {}

export class ZoomInTool extends ZoomBaseTool {
  declare properties: ZoomBaseTool.Props
  declare __view_type__: ZoomBaseToolView

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

  override tool_name = "Zoom In"
  override tool_icon = tool_icon_zoom_in
}
