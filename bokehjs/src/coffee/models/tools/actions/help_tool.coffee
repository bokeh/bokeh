import * as _ from "underscore"

import * as ActionTool from "./action_tool"
import * as p from "../../../core/properties"

class HelpToolView extends ActionTool.View
  do: () ->
    window.open(@model.redirect)

class HelpTool extends ActionTool.Model
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

export {
  HelpTool as Model
  HelpToolView as View
}
