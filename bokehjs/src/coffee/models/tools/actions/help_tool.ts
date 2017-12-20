import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"

export class HelpToolView extends ActionToolView {
  model: HelpTool

  doit(): void {
    window.open(this.model.redirect)
  }
}

export class HelpTool extends ActionTool {
  help_tooltip: string
  redirect: string

  tool_name = "Help"
  icon = "bk-tool-icon-help"

  get tooltip(): string {
    return this.help_tooltip
  }
}

HelpTool.prototype.type = "HelpTool"

HelpTool.prototype.default_view = HelpToolView

HelpTool.define({
  help_tooltip: [ p.String, 'Click the question mark to learn more about Bokeh plot tools.'],
  redirect:     [ p.String, 'https://bokeh.pydata.org/en/latest/docs/user_guide/tools.html#built-in-tools'],
})
