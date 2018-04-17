import * as p from "core/properties"
import {empty, prepend, nbsp, button} from "core/dom"
import {build_views, remove_views} from "core/build_views"

import {Widget, WidgetView} from "./widget"
import {AbstractIcon, AbstractIconView} from "./abstract_icon"

export type ButtonType = "default" | "primary" | "success" | "warning" | "danger" | "link"

export abstract class AbstractButtonView extends WidgetView {
  model: AbstractButton

  protected icon_views: {[key: string]: AbstractIconView}

  protected buttonEl: HTMLButtonElement

  initialize(options: any): void {
    super.initialize(options)
    this.icon_views = {}
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  remove(): void {
    remove_views(this.icon_views)
    super.remove()
  }

  _render_button(...children: (string | HTMLElement)[]): HTMLButtonElement {
    return button({
      type: "button",
      disabled: this.model.disabled,
      class: [`bk-bs-btn`, `bk-bs-btn-${this.model.button_type}`],
    }, ...children)
  }

  render(): void {
    super.render()

    empty(this.el)
    this.buttonEl = this._render_button(this.model.label)
    this.buttonEl.addEventListener("click", (event) => this._button_click(event))
    this.el.appendChild(this.buttonEl)

    const icon = this.model.icon
    if (icon != null) {
      build_views(this.icon_views, [icon], {parent: this})
      prepend(this.buttonEl, this.icon_views[icon.id].el, nbsp)
    }
  }

  protected _button_click(event: Event): void {
    event.preventDefault()
    this.change_input()
  }

  change_input(): void {
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace AbstractButton {
  export interface Attrs extends Widget.Attrs {
    label: string
    icon: AbstractIcon
    button_type: ButtonType
    callback: any // XXX
  }

  export interface Props extends Widget.Props {}
}

export interface AbstractButton extends AbstractButton.Attrs {}

export abstract class AbstractButton extends Widget {

  properties: AbstractButton.Props

  constructor(attrs?: Partial<AbstractButton.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "AbstractButton"

    this.define({
      label:       [ p.String, "Button"  ],
      icon:        [ p.Instance          ],
      button_type: [ p.String, "default" ], // TODO (bev)
      callback:    [ p.Instance          ],
    })
  }
}

AbstractButton.initClass()
