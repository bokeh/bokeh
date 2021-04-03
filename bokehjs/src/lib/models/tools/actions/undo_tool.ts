import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {tool_icon_undo} from "styles/icons.css"

export class UndoToolView extends ActionToolView {
  model: UndoTool

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.plot_view.state.changed, () => this.model.disabled = !this.plot_view.state.can_undo)
  }

  doit(): void {
    const state = this.plot_view.state.undo()

    if (state?.range != null) {
      this._trigger_ranges_update()
    }
  }
}

export namespace UndoTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface UndoTool extends UndoTool.Attrs {}

export class UndoTool extends ActionTool {
  properties: UndoTool.Props
  __view_type__: UndoToolView

  constructor(attrs?: Partial<UndoTool.Attrs>) {
    super(attrs)
  }

  static init_UndoTool(): void {
    this.prototype.default_view = UndoToolView

    this.override<UndoTool.Props>({
      disabled: true,
    })

    this.register_alias("undo", () => new UndoTool())
  }

  tool_name = "Undo"
  icon = tool_icon_undo
}
