import {Control, ControlView} from "./control"
import type {TooltipView} from "../ui/tooltip"
import {Tooltip} from "../ui/tooltip"
import {HTML, HTMLView} from "../dom/html"

import {assert} from "core/util/assert"
import {isString} from "core/util/types"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type {StyleSheetLike} from "core/dom"
import {div, label} from "core/dom"
import type * as p from "core/properties"

import inputs_css, * as inputs from "styles/widgets/inputs.css"
import icons_css from "styles/icons.css"

export type HTMLInputElementLike = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export abstract class InputWidgetView extends ControlView {
  declare model: InputWidget

  protected title: HTMLView | string
  protected description: TooltipView | null = null

  protected input_el: HTMLInputElementLike
  protected title_el: HTMLLabelElement
  desc_el: HTMLElement | null = null
  protected group_el: HTMLElement

  public *controls() {
    yield this.input_el
  }

  override *children(): IterViews {
    yield* super.children()
    if (this.title instanceof HTMLView) {
      yield this.title
    }
    if (this.description != null) {
      yield this.description
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {title, description} = this.model
    if (title instanceof HTML) {
      this.title = await build_view(title, {parent: this})
    } else {
      this.title = title
    }
    if (description instanceof Tooltip) {
      this.description = await build_view(description, {parent: this})
    }
  }

  override remove(): void {
    if (this.title instanceof HTMLView) {
      this.title.remove()
    }
    this.description?.remove()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.title.change, () => {
      this.title_el = this._build_title_el()
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), inputs_css, icons_css]
  }

  override render(): void {
    super.render()

    this.desc_el = this._build_description_el()
    this.title_el = this._build_title_el()
    const input_or_container_el = this._render_input()
    this.input_el.id = "input"
    this.group_el = div({class: inputs.input_group}, this.title_el, input_or_container_el)
    this.shadow_el.appendChild(this.group_el)
  }

  protected _build_description_el(): HTMLElement | null {
    const {description} = this.model
    if (description == null) {
      return null
    } else {
      const icon_el = div({class: inputs.icon})
      const desc_el = div({class: inputs.description}, icon_el)

      if (isString(description)) {
        desc_el.title = description
      } else {
        const {description} = this
        assert(description != null)

        if (description.model.target == "auto") {
          description.target = desc_el
        }

        let persistent = false

        const toggle = (visible: boolean) => {
          description.model.setv({
            visible,
            closable: persistent,
          })
          icon_el.classList.toggle(inputs.opaque, visible && persistent)
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
          if (!persistent) {
            toggle(false)
          }
        })
        document.addEventListener("mousedown", (event) => {
          const path = event.composedPath()
          if (path.includes(description.el)) {
            return
          } else if (path.includes(desc_el)) {
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
      return desc_el
    }
  }

  protected _build_title_el(): HTMLLabelElement {
    const {title} = this
    const content = (() => {
      if (title instanceof HTMLView) {
        title.render()
        return title.el
      } else {
        return title
      }
    })()
    const display = title == "" ? "none" : ""
    return label({for: "input", style: {display}}, content, this.desc_el)
  }

  protected abstract _render_input(): HTMLElement

  change_input(): void {}
}

export namespace InputWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    title: p.Property<string | HTML>
    description: p.Property<string | Tooltip | null>
  }
}

export interface InputWidget extends InputWidget.Attrs {}

export abstract class InputWidget extends Control {
  declare properties: InputWidget.Props
  declare __view_type__: InputWidgetView

  constructor(attrs?: Partial<InputWidget.Attrs>) {
    super(attrs)
  }

  static {
    this.define<InputWidget.Props>(({Str, Nullable, Or, Ref}) => ({
      title: [ Or(Str, Ref(HTML)), "" ],
      description: [ Nullable(Or(Str, Ref(Tooltip))), null ],
    }))
  }
}
