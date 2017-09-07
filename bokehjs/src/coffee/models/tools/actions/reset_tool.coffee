import {ActionTool, ActionToolView} from "./action_tool"
import {Reset} from "core/bokeh_events"
import * as p from "core/properties"

export class ResetToolView extends ActionToolView

  doit: () ->
    @plot_view.clear_state()
    @plot_view.reset_range()
    @plot_view.reset_selection()
    @plot_model.plot.trigger_event(new Reset())

export class ResetTool extends ActionTool
  default_view: ResetToolView
  type: "ResetTool"
  tool_name: "Reset"
  icon: "bk-tool-icon-reset"

  @define {
    reset_size: [ p.Bool, true ]
  }
