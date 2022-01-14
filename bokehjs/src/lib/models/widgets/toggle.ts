import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {classes} from "core/dom"
import * as p from "core/properties"

import * as buttons from "styles/buttons.css"

export class ToggleView extends AbstractButtonView {
  override model: Toggle

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => this._update_active())
  }

  override render(): void {
    super.render()
    this._update_active()
  }

  override click(): void {
    this.model.active = !this.model.active
    super.click()
  }

  protected _update_active(): void {
    classes(this.button_el).toggle(buttons.active, this.model.active)
  }
}

export namespace Toggle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractButton.Props & {
    active: p.Property<boolean>
  }
}

export interface Toggle extends Toggle.Attrs {}

export class Toggle extends AbstractButton {
  override properties: Toggle.Props
  override __view_type__: ToggleView

  constructor(attrs?: Partial<Toggle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToggleView

    this.define<Toggle.Props>(({Boolean}) => ({
      active: [ Boolean, false ],
    }))

    this.override<Toggle.Props>({
      label: "Toggle",
    })
  }
}
