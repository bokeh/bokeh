import {Control, ControlView} from "./control"
import {Tooltip, TooltipView} from "../ui/tooltip"

import {assert} from "core/util/assert"
import {isString} from "core/util/types"
import {build_view} from "core/build_views"
import {div, label} from "core/dom"
import * as p from "core/properties"

import inputs_css, * as inputs from "styles/widgets/inputs.css"
import icons_css from "styles/icons.css"

export type HTMLInputElementLike = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export abstract class InputWidgetView extends ControlView {
  override model: InputWidget

  protected description: TooltipView | null = null

  protected input_el: HTMLInputElementLike
  protected label_el: HTMLLabelElement
  protected desc_el: HTMLElement | null = null
  protected group_el: HTMLElement

  *controls() {
    yield this.input_el
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {description} = this.model
    if (description instanceof Tooltip) {
      this.description = await build_view(description, {parent: this})
    }
  }

  override remove(): void {
    this.description?.remove()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.title.change, () => {
      this.label_el.textContent = this.model.title
    })
  }

  override styles(): string[] {
    return [...super.styles(), inputs_css, icons_css]
  }

  override render(): void {
    super.render()

    const {title, description} = this.model

    if (description == null)
      this.desc_el = null
    else {
      const icon_el = div({class: inputs.icon})
      this.desc_el = div({class: inputs.description}, icon_el)

      if (isString(description))
        this.desc_el.title = description
      else {
        const {description} = this
        assert(description != null)

        const {desc_el} = this
        description.model.target = desc_el

        let persistent = false

        const toggle = (visible: boolean) => {
          description.model.setv({
            visible,
            closable: persistent,
          })
          icon_el.style.visibility = visible && persistent ? "visible" : ""
        }

        this.on_change(description.model.properties.visible, () => {
          const {visible} = description.model
          if (!visible) {
            persistent = false
          }
          toggle(visible)
        })
        desc_el.addEventListener("mouseenter", () => {
          toggle(true)
        })
        desc_el.addEventListener("mouseleave", () => {
          if (!persistent)
            toggle(false)
        })
        document.addEventListener("mousedown", (event) => {
          const path = event.composedPath()
          if (path.includes(description.el)) {
            return
          } else if (path.includes(this.el)) {
            persistent = !persistent
            toggle(persistent)
          } else {
            persistent = false
            toggle(false)
          }
        })
        window.addEventListener("blur", () => {
          persistent = false
          toggle(false)
        })
      }
    }

    this.label_el = label({style: {display: title.length == 0 ? "none" : ""}}, title, this.desc_el)
    this.group_el = div({class: inputs.input_group}, this.label_el)
    this.shadow_el.appendChild(this.group_el)
  }

  change_input(): void {}
}

export namespace InputWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    title: p.Property<string>
    description: p.Property<string | Tooltip | null>
  }
}

export interface InputWidget extends InputWidget.Attrs {}

export abstract class InputWidget extends Control {
  override properties: InputWidget.Props
  override __view_type__: InputWidgetView

  constructor(attrs?: Partial<InputWidget.Attrs>) {
    super(attrs)
  }

  static {
    this.define<InputWidget.Props>(({String, Nullable, Or, Ref}) => ({
      title: [ String, "" ],
      description: [ Nullable(Or(String, Ref(Tooltip))), null ],
    }))
  }
}
