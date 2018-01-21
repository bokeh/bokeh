import {ActionTool, ActionToolView} from "./action_tool"
import {Reset} from "core/bokeh_events"

export class ResetToolView extends ActionToolView {

  model: ResetTool

  doit(): void {
    this.plot_view.clear_state()
    this.plot_view.reset_range()
    this.plot_view.reset_selection()
    this.plot_model.plot.trigger_event(new Reset())
  }
}

export class ResetTool extends ActionTool {

  static initClass() {
    this.prototype.type = "ResetTool"

    this.prototype.default_view = ResetToolView
  }

  reset_size: boolean

  tool_name = "Reset"
  icon = "bk-tool-icon-reset"
}

ResetTool.initClass()
