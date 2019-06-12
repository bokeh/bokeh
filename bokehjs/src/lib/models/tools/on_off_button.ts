import {ButtonToolButtonView} from "./button_tool"
import {bk_active} from "styles/mixins"

export class OnOffButtonView extends ButtonToolButtonView {

  render(): void {
    super.render()
    if (this.model.active)
      this.el.classList.add(bk_active)
    else
      this.el.classList.remove(bk_active)
  }

  protected _clicked(): void {
    const active = this.model.active
    this.model.active = !active
  }
}
