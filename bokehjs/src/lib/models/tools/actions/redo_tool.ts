import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {tool_icon_redo} from "styles/icons.css"

export class RedoToolView extends ActionToolView {
  model: RedoTool

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.plot_view.state.changed, () => this.model.disabled = !this.plot_view.state.can_redo)
  }

  doit(): void {
    const state = this.plot_view.state.redo()

    if (state?.range != null) {
      this._trigger_ranges_update()
    }
  }
}

export namespace RedoTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface RedoTool extends RedoTool.Attrs {}

export class RedoTool extends ActionTool {
  properties: RedoTool.Props
  __view_type__: RedoToolView

  constructor(attrs?: Partial<RedoTool.Attrs>) {
    super(attrs)
  }

  static init_RedoTool(): void {
    this.prototype.default_view = RedoToolView

    this.override<RedoTool.Props>({
      disabled: true,
    })

    this.register_alias("redo", () => new RedoTool())
  }

  tool_name = "Redo"
  icon = tool_icon_redo
}
