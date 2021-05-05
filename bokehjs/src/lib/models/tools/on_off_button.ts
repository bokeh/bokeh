import {ButtonToolButtonView} from "./button_tool"
import * as toolbars from "styles/toolbar.css"
import {classes} from "core/dom"

export class OnOffButtonView extends ButtonToolButtonView {
  override render(): void {
    super.render()
    classes(this.el).toggle(toolbars.active, this.model.active)
  }

  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
}
