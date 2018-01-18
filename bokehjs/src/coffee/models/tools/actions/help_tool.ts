import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"

export class HelpToolView extends ActionToolView {
  model: HelpTool

  doit(): void {
    window.open(this.model.redirect)
  }
}

export class HelpTool extends ActionTool {

  static initClass() {
    this.prototype.type = "HelpTool"

    this.prototype.default_view = HelpToolView

    this.define({
      help_tooltip: [ p.String, 'Click the question mark to learn more about Bokeh plot tools.'],
      redirect:     [ p.String, 'https://bokeh.pydata.org/en/latest/docs/user_guide/tools.html#built-in-tools'],
    })
  }

  help_tooltip: string
  redirect: string

  tool_name = "Help"
  icon = "bk-tool-icon-help"

  get tooltip(): string {
    return this.help_tooltip
  }
}

HelpTool.initClass()
