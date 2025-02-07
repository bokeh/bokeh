import {Widget, WidgetView} from "./widget"
import {div} from "core/dom"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import * as toggle_input_css from "styles/widgets/toggle_input.css"

export abstract class ToggleInputView extends WidgetView {
  declare model: ToggleInput

  protected label_el: HTMLElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), toggle_input_css.default]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {active, disabled, label} = this.model.properties
    this.on_change(active, () => this._update_active())
    this.on_change(disabled, () => this._update_disabled())
    this.on_change(label, () => this._update_label())
  }

  protected abstract _update_active(): void

  protected abstract _update_disabled(): void

  protected _toggle_active(): void {
    if (!this.model.disabled) {
      this.model.active = !this.model.active
    }
  }

  override render(): void {
    super.render()
    this.label_el = div({class: toggle_input_css.label}, this.model.label)
  }

  protected _update_label(): void {
    this.label_el.textContent = this.model.label
  }
}

export namespace ToggleInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    active: p.Property<boolean>
    label: p.Property<string>
  }
}

export interface ToggleInput extends ToggleInput.Attrs {}

export abstract class ToggleInput extends Widget {
  declare properties: ToggleInput.Props
  declare __view_type__: ToggleInputView

  constructor(attrs?: Partial<ToggleInput.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToggleInput.Props>(({Bool, Str}) => ({
      active: [ Bool, false ],
      label: [ Str, "" ],
    }))
  }
}
