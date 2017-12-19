import {ButtonToolButtonView} from "./button_tool"

export class OnOffButtonView extends ButtonToolButtonView {

  render(): void {
    super.render()
    if (this.model.active)
      this.el.classList.add('bk-active')
    else
      this.el.classList.remove('bk-active')
  }

  protected _clicked(): void {
    const active = this.model.active
    this.model.active = !active
  }
}
