import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {bk_tool_icon_help} from "styles/icons"

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
  __view_type__: HelpToolView

  constructor(attrs?: Partial<HelpTool.Attrs>) {
    super(attrs)
  }

  static init_HelpTool(): void {
    this.prototype.default_view = HelpToolView

    this.define<HelpTool.Props>(({String}) => ({
      help_tooltip: [ String, 'Click the question mark to learn more about Bokeh plot tools.'],
      redirect:     [ String, 'https://docs.bokeh.org/en/latest/docs/user_guide/tools.html'],
    }))

    this.register_alias("help", () => new HelpTool())
  }

  tool_name = "Help"
  icon = bk_tool_icon_help

  get tooltip(): string {
    return this.help_tooltip
  }
}
