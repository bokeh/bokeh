import {ButtonToolButtonView} from "./button_tool"
import * as tools from "styles/tool_button.css"
import {classes} from "core/dom"

export class OnOffButtonView extends ButtonToolButtonView {
  override render(): void {
    super.render()
    classes(this.el).toggle(tools.active, this.model.active)
  }

  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
}
