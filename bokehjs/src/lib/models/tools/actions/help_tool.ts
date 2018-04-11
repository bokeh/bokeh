import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"

export class HelpToolView extends ActionToolView {
  model: HelpTool

  doit(): void {
    window.open(this.model.redirect)
  }
}

export namespace HelpTool {
  export interface Attrs extends ActionTool.Attrs {
    help_tooltip: string
    redirect: string
  }

  export interface Props extends ActionTool.Props {}
}

export interface HelpTool extends HelpTool.Attrs {}

export class HelpTool extends ActionTool {

  properties: HelpTool.Props

  constructor(attrs?: Partial<HelpTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "HelpTool"
    this.prototype.default_view = HelpToolView

    this.define({
      help_tooltip: [ p.String, 'Click the question mark to learn more about Bokeh plot tools.'],
      redirect:     [ p.String, 'https://bokeh.pydata.org/en/latest/docs/user_guide/tools.html#built-in-tools'],
    })
  }

  tool_name = "Help"
  icon = "bk-tool-icon-help"

  get tooltip(): string {
    return this.help_tooltip
  }
}

HelpTool.initClass()
