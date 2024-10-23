import type * as p from "core/properties"
import {ButtonType} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {prepend, nbsp, text, button, div} from "core/dom"
import type {ViewOf, IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import {isString} from "core/util/types"

import {Control, ControlView} from "./control"
import {DOMNode} from "../dom/dom_node"
import {Text} from "../dom/text"
import {Icon} from "../ui/icons/icon"

import buttons_css, * as buttons from "styles/buttons.css"

export abstract class AbstractButtonView extends ControlView {
  declare model: AbstractButton

  protected label_view?: ViewOf<DOMNode>
  protected icon_view?: ViewOf<Icon>

  button_el: HTMLButtonElement
  protected group_el: HTMLElement

  public *controls() {
    yield this.button_el
  }

  override *children(): IterViews {
    yield* super.children()
    if (this.label_view != null) {
      yield this.label_view
    }
    if (this.icon_view != null) {
      yield this.icon_view
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._rebuild_label()
    await this._rebuild_icon()
  }

  async _rebuild_label(): Promise<void> {
    this.label_view?.remove()
    const label = (() => {
      const {label} = this.model
      return isString(label) ? new Text({content: label}) : label
    })()
    this.label_view = await this.owner.build_view(label, this)
  }

  async _rebuild_icon(): Promise<void> {
    this.icon_view?.remove()
    const {icon} = this.model
    if (icon != null) {
      this.icon_view = await build_view(icon, {parent: this})
    }
  }

  override connect_signals(): void {
    super.connect_signals()

    const {label, icon, button_type, disabled} = this.model.properties
    this.on_transitive_change(label, async () => {
      await this._rebuild_label()
      this.rerender()
    })
    this.on_transitive_change(icon, async () => {
      await this._rebuild_icon()
      this.rerender()
    })
    this.on_change([button_type, disabled], () => {
      this.rerender()
    })
  }

  override remove(): void {
    this.label_view?.remove()
    this.icon_view?.remove()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), buttons_css]
  }

  _render_button(...children: (string | ChildNode | null | undefined)[]): HTMLButtonElement {
    return button({
      type: "button",
      disabled: this.model.disabled,
      class: [buttons.btn, buttons[`btn_${this.model.button_type}` as const]],
    }, ...children)
  }

  override render(): void {
    super.render()

    this.label_view?.render()
    this.button_el = this._render_button(this.label_view?.el)
    this.button_el.addEventListener("click", () => this.click())

    if (this.icon_view != null) {
      const separator = this.model.label != "" ? nbsp() : text("")
      prepend(this.button_el, this.icon_view.el, separator)
      this.icon_view.render()
    }

    this.group_el = div({class: buttons.btn_group}, this.button_el)
    this.shadow_el.append(this.group_el)
  }

  click(): void {}
}

export namespace AbstractButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    label: p.Property<DOMNode | string>
    icon: p.Property<Icon | null>
    button_type: p.Property<ButtonType>
  }
}

export interface AbstractButton extends AbstractButton.Attrs {}

export abstract class AbstractButton extends Control {
  declare properties: AbstractButton.Props
  declare __view_type__: AbstractButtonView

  constructor(attrs?: Partial<AbstractButton.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AbstractButton.Props>(({Str, Ref, Or, Nullable}) => ({
      label:       [ Or(Ref(DOMNode), Str), "Button" ],
      icon:        [ Nullable(Ref(Icon)), null ],
      button_type: [ ButtonType, "default" ],
    }))
  }
}
