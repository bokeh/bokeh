import {OnOffButton, OnOffButtonView} from "./on_off_button"
import {ToolProxy} from "./tool_proxy"
import type {ActionTool} from "./actions/action_tool"
import type * as p from "core/properties"

export class ClickButtonView extends OnOffButtonView {
  declare model: ClickButton

  override tap(): void {
    this.model.tool.do.emit(undefined)
  }

  protected override get _is_toggle(): boolean {
    const tool = this.values.tool as ActionTool | ToolProxy<ActionTool>
    return (tool instanceof ToolProxy ? tool.underlying : tool).checkable
  }
}

export namespace ClickButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OnOffButton.Props & {
    tool: p.Property<ActionTool>
  }
}

export interface ClickButton extends ClickButton.Attrs {
  tool: ActionTool
}

export class ClickButton extends OnOffButton {
  declare properties: ClickButton.Props
  declare __view_type__: ClickButtonView

  static {
    this.prototype.default_view = ClickButtonView
  }
}
