import {Switch, SwitchView} from "./switch"
import type * as p from "core/properties"

export class LightDarkView extends SwitchView {
  declare model: LightDark

  override connect_signals(): void {
    super.connect_signals()

    const {active} = this.model.properties
    this.on_change(active, () => this._update_scheme())

    const {document} = this.model
    if (document != null) {
      const {color_scheme} = document.config.properties
      this.on_change(color_scheme, () => this._update_active_from_config())
    }
  }

  override render(): void {
    super.render()
    if (this.model.active == null) {
      this._update_active_from_config()
    } else {
      this._update_scheme()
    }
  }

  protected _update_scheme(): void {
    const {active, document} = this.model
    if (document != null) {
      const is_system = active === null
      const scheme = !is_system && active ? "light" : is_system ? "auto" : "dark"
      document.config.color_scheme = scheme
    }
  }

  protected _update_active_from_config(): void {
    const {document} = this.model
    if (document != null) {
      this.model.active = (() => {
        switch (document.config.color_scheme) {
          case "light": return true
          case "dark": return false
          default: return null
        }
      })()
    }
  }
}

export namespace LightDark {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Switch.Props
}

export interface LightDark extends LightDark.Attrs {}

export class LightDark extends Switch {
  declare properties: LightDark.Props
  declare __view_type__: LightDarkView

  protected constructor(attrs?: Partial<LightDark.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LightDarkView

    this.override<LightDark.Props>({
      active: null,
      on_icon: "light_theme",
      off_icon: "dark_theme",
      indeterminate_icon: "system_theme",
      tri_state: true,
    })
  }
}
