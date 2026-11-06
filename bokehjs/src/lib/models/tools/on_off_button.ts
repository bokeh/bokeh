import {ToolButton, ToolButtonView} from "./tool_button"
import type * as p from "core/properties"

export class OnOffButtonView extends ToolButtonView {
  declare model: OnOffButton

  protected override _is_active(): boolean {
    return this._tool_state("active")
  }

  tap(): void {
    const {active} = this.model.tool
    this.model.tool.active = !active
  }
}

export namespace OnOffButton {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ToolButton.Props
}

export interface OnOffButton extends OnOffButton.Attrs {}

export class OnOffButton extends ToolButton {
  declare properties: OnOffButton.Props
  declare __view_type__: OnOffButtonView

  static {
    this.prototype.default_view = OnOffButtonView
  }
}
