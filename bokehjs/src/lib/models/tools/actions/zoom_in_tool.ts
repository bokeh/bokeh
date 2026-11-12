import {ZoomBaseTool, ZoomBaseToolView} from "./zoom_base_tool"
import {tool_icon_zoom_in} from "styles/icons.css"
import type {InternalKeyBinding} from "core/keyboard"
import type {Command} from "core/commands"

export class ZoomInToolView extends ZoomBaseToolView {
  declare model: ZoomBaseTool

  get factor(): number {
    return this.model.factor
  }

  override commands(): Command[] {
    return [
      ...super.commands(),
      {name: "zoom_in", description: "Zoom in", execute: () => this.doit(), origin: this.model},
    ]
  }

  override key_bindings(): InternalKeyBinding[] {
    return [
      ...super.key_bindings(),
      {keys: ["+"], command: "zoom_in", origin: this.model},
      {keys: ["z", "i"], command: "zoom_in", origin: this.model},
    ]
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
