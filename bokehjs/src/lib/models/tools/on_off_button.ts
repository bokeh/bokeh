import {ButtonToolButtonView} from "./button_tool"
import {bk_active} from "styles/mixins"
import {classes} from "core/dom"

export class OnOffButtonView extends ButtonToolButtonView {

  render(): void {
    super.render()
    classes(this.el).toggle(bk_active, this.model.active)
  }

  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
}
