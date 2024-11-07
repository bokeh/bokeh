import {OnOffButton, OnOffButtonView} from "./on_off_button"
import type {ActionTool} from "./actions/action_tool"
import type * as p from "core/properties"

export class ClickButtonView extends OnOffButtonView {
  declare model: ClickButton

  protected override _clicked(): void {
    this.model.tool.do.emit(undefined)
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

  constructor(attrs?: Partial<ClickButton.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ClickButtonView
  }
}
