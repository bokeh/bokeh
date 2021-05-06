import * as p from "core/properties"
import {ButtonType} from "core/enums"
import {prepend, nbsp, button, div} from "core/dom"
import {build_view} from "core/build_views"

import {Control, ControlView} from "./control"
import {AbstractIcon, AbstractIconView} from "./abstract_icon"

import buttons_css, * as buttons from "styles/buttons.css"

export abstract class AbstractButtonView extends ControlView {
  override model: AbstractButton

  protected icon_view?: AbstractIconView

  protected button_el: HTMLButtonElement
  protected group_el: HTMLElement

  *controls() {
    yield this.button_el
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {icon} = this.model
    if (icon != null) {
      this.icon_view = await build_view(icon, {parent: this})
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  override remove(): void {
    if (this.icon_view != null)
      this.icon_view.remove()
    super.remove()
  }

  override styles(): string[] {
    return [...super.styles(), buttons_css]
  }

  _render_button(...children: (string | HTMLElement)[]): HTMLButtonElement {
    return button({
      type: "button",
      disabled: this.model.disabled,
      class: [buttons.btn, buttons[`btn_${this.model.button_type}` as const]],
    }, ...children)
  }

  override render(): void {
    super.render()

    this.button_el = this._render_button(this.model.label)
    this.button_el.addEventListener("click", () => this.click())

    if (this.icon_view != null) {
      if (this.model.label != "") {
        prepend(this.button_el, this.icon_view.el, nbsp())
      } else {
        prepend(this.button_el, this.icon_view.el)
      }
      this.icon_view.render()
    }

    this.group_el = div({class: buttons.btn_group}, this.button_el)
    this.shadow_el.appendChild(this.group_el)
  }

  click(): void {}
}

export namespace AbstractButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    label: p.Property<string>
    icon: p.Property<AbstractIcon | null>
    button_type: p.Property<ButtonType>
  }
}

export interface AbstractButton extends AbstractButton.Attrs {}

export abstract class AbstractButton extends Control {
  override properties: AbstractButton.Props
  override __view_type__: AbstractButtonView

  constructor(attrs?: Partial<AbstractButton.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AbstractButton.Props>(({String, Ref, Nullable}) => ({
      label:       [ String, "Button" ],
      icon:        [ Nullable(Ref(AbstractIcon)), null ],
      button_type: [ ButtonType, "default" ],
    }))
  }
}
