import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {classes} from "core/dom"
import * as p from "core/properties"

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

  change_input(): void {
    this.model.active = !this.model.active
    super.change_input()
  }

  protected _update_active(): void {
    classes(this.buttonEl).toggle("bk-active", this.model.active)
  }
}

export namespace Toggle {
  export interface Attrs extends AbstractButton.Attrs {
    active: boolean
  }

  export interface Props extends AbstractButton.Props {
    active: p.Property<boolean>
  }
}

export interface Toggle extends Toggle.Attrs {}

export class Toggle extends AbstractButton {

  properties: Toggle.Props

  constructor(attrs?: Partial<Toggle.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Toggle"
    this.prototype.default_view = ToggleView

    this.define({
      active: [ p. Bool, false ],
    })

    this.override({
      label: "Toggle",
    })
  }
}

Toggle.initClass()
