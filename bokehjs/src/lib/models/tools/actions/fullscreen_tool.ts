import {ActionTool, ActionToolView} from "./action_tool"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"

function request_fullscreen(el: Element, options?: FullscreenOptions): Promise<void> {
  if (typeof Element.prototype.webkitRequestFullscreen !== "undefined") {
    return el.webkitRequestFullscreen(options)
  } else {
    return el.requestFullscreen(options)
  }
}

export class FullscreenToolView extends ActionToolView {
  declare model: FullscreenTool

  override initialize(): void {
    super.initialize()

    const handler = () => {
      const active = document.fullscreenElement == this.parent.el
      this.model.active = active
    }

    document.addEventListener("fullscreenchange", handler, {signal: this.abort_signal})
    document.addEventListener("webkitfullscreenchange", handler, {signal: this.abort_signal})
  }

  async fullscreen(): Promise<void> {
    if (document.fullscreenElement != null) {
      await document.exitFullscreen()
    } else {
      await request_fullscreen(this.parent.el)
    }
  }

  doit(): void {
    void this.fullscreen()
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

  static {
    this.prototype.default_view = FullscreenToolView

  }

  override tool_name = "Fullscreen"
  override tool_icon = icons.tool_icon_fullscreen
}
