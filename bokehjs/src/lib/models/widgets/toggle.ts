import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {classes} from "core/dom"
import * as p from "core/properties"

import {bk_active} from "styles/mixins"

export class ToggleView extends AbstractButtonView {
  model: Toggle

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => this._update_active())
  }

  render(): void {
    super.render()
    this._update_active()
  }

  click(): void {
    this.model.active = !this.model.active
    super.click()
  }

  protected _update_active(): void {
    classes(this.button_el).toggle(bk_active, this.model.active)
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
  properties: Toggle.Props

  constructor(attrs?: Partial<Toggle.Attrs>) {
    super(attrs)
  }

  static init_Toggle(): void {
    this.prototype.default_view = ToggleView

    this.define<Toggle.Props>({
      active: [ p.Boolean, false ],
    })

    this.override({
      label: "Toggle",
    })
  }
}
