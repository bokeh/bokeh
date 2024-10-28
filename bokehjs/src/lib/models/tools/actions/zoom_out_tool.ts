import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import type {KeyBinding} from "../tool"
import {tool_icon_zoom_out} from "styles/icons.css"
import type * as p from "core/properties"

export class ZoomOutToolView extends ZoomBaseToolView {
  declare model: ZoomBaseTool

  get factor(): number {
    const {factor} = this.model
    return -factor / (1 - factor)
  }

  override key_bindings(): KeyBinding[] {
    return [
      ...super.key_bindings(),
      {keys: ["-"], cmd: "zoom_out", action: () => this.doit()},
      {keys: ["z", "o"], cmd: "zoom_in", action: () => this.doit()},
    ]
  }
}

export namespace ZoomOutTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ZoomBaseTool.Props & {
    maintain_focus: p.Property<boolean>
  }
}

export interface ZoomOutTool extends ZoomBaseTool.Attrs {}

export class ZoomOutTool extends ZoomBaseTool {
  declare properties: ZoomOutTool.Props
  declare __view_type__: ZoomBaseToolView

  maintain_focus: boolean

  static {
    this.prototype.default_view = ZoomOutToolView

    this.define<ZoomOutTool.Props>(({Bool}) => ({
      maintain_focus: [ Bool, true ],
    }))

  }

  override tool_name = "Zoom Out"
  override tool_icon = tool_icon_zoom_out
}
