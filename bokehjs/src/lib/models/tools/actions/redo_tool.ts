import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {tool_icon_redo} from "styles/icons.css"

export class RedoToolView extends ActionToolView {
  override model: RedoTool

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.plot_view.state.changed, () => this.model.disabled = !this.plot_view.state.can_redo)
  }

  doit(): void {
    const state = this.plot_view.state.redo()

    if (state?.range != null) {
      this.plot_view.trigger_ranges_update_event()
    }
  }
}

export namespace RedoTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface RedoTool extends RedoTool.Attrs {}

export class RedoTool extends ActionTool {
  override properties: RedoTool.Props
  override __view_type__: RedoToolView

  constructor(attrs?: Partial<RedoTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RedoToolView

    this.override<RedoTool.Props>({
      disabled: true,
    })

    this.register_alias("redo", () => new RedoTool())
  }

  override tool_name = "Redo"
  override tool_icon = tool_icon_redo
}
