import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import * as icons from "styles/icons.css"

export class FullscreenToolView extends ActionToolView {
  declare model: FullscreenTool

  doit(): void {
    if (document.fullscreenElement != null) {
      document.exitFullscreen()
    } else {
      (async () => {
        await this.parent.el.requestFullscreen()
      })()
    }
  }
}

export namespace FullscreenTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ActionTool.Props
}

export interface FullscreenTool extends FullscreenTool.Attrs {}

export class FullscreenTool extends ActionTool {
  declare properties: FullscreenTool.Props
  declare __view_type__: FullscreenToolView

  constructor(attrs?: Partial<FullscreenTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FullscreenToolView

    this.register_alias("fullscreen", () => new FullscreenTool())
  }

  override tool_name = "Fullscreen"
  override tool_icon = icons.tool_icon_fullscreen
}
