import {logger} from "core/logging"
import * as p from "core/properties"
import {ActionTool, ActionToolView} from "models/tools/actions/action_tool"
import screenfull from "screenfull"

export class FullscreenToolView extends ActionToolView {
  model: FullscreenTool

  doit(): void {
    if (screenfull.isEnabled)
      screenfull.toggle((this.root as any).el);
    else
      logger.warn('Could not toggle fullscreen on, ensure the allowfullscreen attribute is set.')
  }
}

export namespace FullscreenTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ActionTool.Props
}

export interface FullscreenTool extends FullscreenTool.Attrs {}

export class FullscreenTool extends ActionTool {
  properties: FullscreenTool.Props

  constructor(attrs?: Partial<FullscreenTool.Attrs>) {
    super(attrs)
  }

  static init_FullscreenTool(): void {
    this.prototype.default_view = FullscreenToolView
  }

  tool_name = "Fullscreen"
  icon = "bk-tool-icon-reset"
}
