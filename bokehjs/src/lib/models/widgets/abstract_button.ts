import * as p from "core/properties"
import {ButtonType} from "core/enums"
import {prepend, nbsp, button, div} from "core/dom"
import {build_view} from "core/build_views"

import {Control, ControlView} from "./control"
import {AbstractIcon, AbstractIconView} from "./abstract_icon"

import {bk_btn, bk_btn_group, bk_btn_type} from "styles/buttons"

export abstract class AbstractButtonView extends ControlView {
  model: AbstractButton

  protected icon_view?: AbstractIconView

  protected button_el: HTMLButtonElement
  protected group_el: HTMLElement

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {icon} = this.model
    if (icon != null) {
      this.icon_view = await build_view(icon, {parent: this}) as AbstractIconView
    }
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  remove(): void {
    if (this.icon_view != null)
      this.icon_view.remove()
    super.remove()
  }

  _render_button(...children: (string | HTMLElement)[]): HTMLButtonElement {
    return button({
      type: "button",
      disabled: this.model.disabled,
      class: [bk_btn, bk_btn_type(this.model.button_type)],
    }, ...children)
  }

  render(): void {
    super.render()

    this.button_el = this._render_button(this.model.label)
    this.button_el.addEventListener("click", () => this.click())

    if (this.icon_view != null) {
      prepend(this.button_el, this.icon_view.el, nbsp())
      this.icon_view.render()
    }

    this.group_el = div({class: bk_btn_group}, this.button_el)
    this.el.appendChild(this.group_el)
  }

  click(): void {}
}

export namespace AbstractButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    label: p.Property<string>
    icon: p.Property<AbstractIcon>
    button_type: p.Property<ButtonType>
  }
}

export interface AbstractButton extends AbstractButton.Attrs {}

export abstract class AbstractButton extends Control {
  properties: AbstractButton.Props

  constructor(attrs?: Partial<AbstractButton.Attrs>) {
    super(attrs)
  }

  static init_AbstractButton(): void {
    this.define<AbstractButton.Props>({
      label:       [ p.String,     "Button"  ],
      icon:        [ p.Instance              ],
      button_type: [ p.ButtonType, "default" ], // TODO (bev)
    })
  }
}
