import * as _ from "underscore"

import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "../../../core/properties"

export class HelpToolView extends ActionToolView
  do: () ->
    window.open(@model.redirect)

export class HelpTool extends ActionTool
  default_view: HelpToolView
  type: "HelpTool"
  tool_name: "Help"
  icon: "bk-tool-icon-help"

  @define {
    help_tooltip: [
      p.String,
      'Click the question mark to learn more about Bokeh plot tools.'
    ]
    redirect:     [
      p.String
      'http://bokeh.pydata.org/en/latest/docs/user_guide/tools.html'
    ]
  }

  @getters {
    tooltip: () -> @help_tooltip
  }
