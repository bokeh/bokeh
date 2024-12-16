import {ToolButton, ToolButtonView} from "./tool_button"
import * as tools from "styles/tool_button.css"
import type * as p from "core/properties"

export class OnOffButtonView extends ToolButtonView {
  declare model: OnOffButton

  protected _toggle_active(): void {
    this.class_list.toggle(tools.active, this.model.tool.active)
  }

  override connect_signals(): void {
    super.connect_signals()
    const {active} = this.model.tool.properties
    this.on_change(active, () => {
      this._toggle_active()
    })
  }

  override render(): void {
    super.render()
    this._toggle_active()
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

  constructor(attrs?: Partial<OnOffButton.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = OnOffButtonView
  }
}
