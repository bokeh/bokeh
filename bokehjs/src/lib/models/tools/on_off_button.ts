import {ToolButtonView} from "./tool_button"
import * as tools from "styles/tool_button.css"

export class OnOffButtonView extends ToolButtonView {
  override render(): void {
    super.render()
    this.el.classList.toggle(tools.active, this.model.active)
  }

  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
}
