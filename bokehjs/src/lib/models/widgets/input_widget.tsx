import {Widget, WidgetView} from "./widget"
import {Tooltip} from "../ui/tooltip"
import {HTML} from "../dom/html"
import {build_view} from "core/build_views"
import type {StyleSheetLike} from "core/dom"
import type {ViewOf} from "core/build_views"
import {View} from "core/view"
import type {ChildView} from "core/view"
import type * as p from "core/properties"
import {bind} from "core/class"
import {server_event, ModelEvent} from "core/bokeh_events"
import * as inputs_css from "styles/widgets/inputs.css"

import {signal, effect} from "@preact/signals"

export type HTMLInputElementLike = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

@server_event("clear_input")
export class ClearInput extends ModelEvent {
  constructor(readonly model: InputWidget) {
    super()
    this.origin = model
  }

  static override from_values(values: object): ClearInput {
    const {model} = values as {model: InputWidget}
    return new ClearInput(model)
  }
}

export abstract class InputWidgetView extends WidgetView {
  declare readonly model: InputWidget
  declare readonly signals: p.SignalsOf<InputWidget.Props>
  declare readonly values: InputWidget.Attrs

  protected input_el: HTMLInputElementLike = document.createElement("input")
  protected group_el: HTMLElement

  override _children_views(): ChildView[] {
    const title = this.computed_title.value
    const description = this.computed_description.value
    const title_view = title instanceof View ? [title] : []
    const description_view = description instanceof View ? [description] : []
    return [...super._children_views(), ...title_view, ...description_view]
  }

  readonly computed_title = signal<ViewOf<HTML> | string | null>(null)
  readonly computed_description = signal<ViewOf<Tooltip> | string | null>(null)

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    await this._build_title()
    await this._build_description()
  }

  override connect_signals(): void {
    effect(() => {
      void this._build_title()
    })
    effect(() => {
      void this._build_description()
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), inputs_css.default]
  }

  @bind
  protected _title_el() {
    const title = this.computed_title.value
    // const description = this.signals.description.value
    if (title != null) {
      return (
        <label for="input">
          {title}
          <div class={inputs_css.description} /*title={description}*/>
            <div class={inputs_css.icon}/>
          </div>
        </label>
      )
    } else {
      return null
    }
  }

  /*
    const description = this.signals.description.value
    if (description == null) {
      return null
    } else {

      const icon_el = div({class: inputs_css.icon})
      const desc_el = div({class: inputs_css.description}, icon_el)

      if (isString(description)) {
        desc_el.title = description
      } else {
        if (description.model.target == "auto") {
          description.target_override.value = desc_el
        }

        let persistent = false

        const toggle = (visible: boolean) => {
          description.model.setv({
            visible,
            closable: persistent,
          })
          icon_el.classList.toggle(inputs_css.opaque, visible && persistent)
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
    */

  protected async _build_title(): Promise<void> {
    this.computed_title.value = await (async () => {
      const {title} = this.model
      if (title instanceof HTML) {
        const view = await build_view(title, {parent: this})
        view.render()
        return view
      } else if (title == "") {
        return null
      } else {
        return title
      }
    })()
  }

  protected async _build_description(): Promise<void> {
    const {description} = this.model
    if (description instanceof Tooltip) {
      this.computed_description.value = await build_view(description, {parent: this})
    } else {
      this.computed_description.value = description
    }
  }

  protected abstract _render_input(): HTMLElement

  change_input(): void {}
}

export namespace InputWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    title: p.Property<string | HTML>
    description: p.Property<string | Tooltip | null>
  }
}

export interface InputWidget extends InputWidget.Attrs {}

export abstract class InputWidget extends Widget {
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
