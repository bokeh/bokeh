import {ToolButton, ToolButtonView} from "./tool_button"
import type {ActionTool} from "models/tools/actions/action_tool"
import type * as p from "core/properties"

export class ClickButtonView extends ToolButtonView {
  declare model: ClickButton

  protected _clicked(): void {
    this.model.tool.do.emit(undefined)
  }
}

export namespace ClickButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ToolButton.Props & {
    tool: p.Property<ActionTool>
  }
}

export interface ClickButton extends ClickButton.Attrs {
  tool: ActionTool
}

export class ClickButton extends ToolButton {
  declare properties: ClickButton.Props
  declare __view_type__: ClickButtonView

  constructor(attrs?: Partial<ClickButton.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ClickButtonView
  }
}
