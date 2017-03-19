import {ActionTool, ActionToolView} from "./action_tool"

import * as p from "core/properties"

export class ResetToolView extends ActionToolView

  do: () ->
    @plot_view.clear_state()
    @plot_view.reset_range()
    @plot_view.reset_selection()
    if @model.reset_size
      @plot_view.reset_dimensions()

export class ResetTool extends ActionTool
  default_view: ResetToolView
  type: "ResetTool"
  tool_name: "Reset"
  icon: "bk-tool-icon-reset"

  @define {
    reset_size: [ p.Bool, true ]
  }
