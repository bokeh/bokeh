import {Control, ControlView} from "./control"

import {div, label} from "core/dom"
import * as p from "core/properties"

import inputs_css, * as inputs from "styles/widgets/inputs.css"

export type HTMLInputElementLike = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export abstract class InputWidgetView extends ControlView {
  override model: InputWidget

  protected input_el: HTMLInputElementLike
  protected label_el: HTMLLabelElement
  protected group_el: HTMLElement

  *controls() {
    yield this.input_el
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.title.change, () => {
      this.label_el.textContent = this.model.title
    })
  }

  override styles(): string[] {
    return [...super.styles(), inputs_css]
  }

  override render(): void {
    super.render()

    const {title} = this.model
    this.label_el = label({style: {display: title.length == 0 ? "none" : ""}}, title)

    this.group_el = div({class: inputs.input_group}, this.label_el)
    this.shadow_el.appendChild(this.group_el)
  }

  change_input(): void {}
}

export namespace InputWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    title: p.Property<string>
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
    this.define<InputWidget.Props>(({String}) => ({
      title: [ String, "" ],
    }))
  }
}
