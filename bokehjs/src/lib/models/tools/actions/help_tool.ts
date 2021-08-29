import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {tool_icon_help} from "styles/icons.css"

export class HelpToolView extends ActionToolView {
  override model: HelpTool

  doit(): void {
    window.open(this.model.redirect)
  }
}

export namespace HelpTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    redirect: p.Property<string>
  }
}

export interface HelpTool extends HelpTool.Attrs {}

export class HelpTool extends ActionTool {
  override properties: HelpTool.Props
  override __view_type__: HelpToolView

  constructor(attrs?: Partial<HelpTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HelpToolView

    this.define<HelpTool.Props>(({String}) => ({
      redirect: [ String, "https://docs.bokeh.org/en/latest/docs/user_guide/tools.html"],
    }))

    this.override<HelpTool.Props>({
      description: "Click the question mark to learn more about Bokeh plot tools.",
    })

    this.register_alias("help", () => new HelpTool())
  }

  override tool_name = "Help"
  override tool_icon = tool_icon_help
}
