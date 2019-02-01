import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"

export class HelpToolView extends ActionToolView {
  model: HelpTool

  doit(): void {
    window.open(this.model.redirect)
  }
}

export namespace HelpTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    help_tooltip: p.Property<string>
    redirect: p.Property<string>
  }
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
