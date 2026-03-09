import {Switch, SwitchView} from "./switch"
import type * as p from "core/properties"

export class LightDarkView extends SwitchView {
  declare model: LightDark

  override connect_signals(): void {
    super.connect_signals()

    const {active} = this.model.properties
    this.on_change(active, () => this._update_theme())
  }

  override render(): void {
    super.render()
    this._update_theme()
  }

  protected _update_theme(): void {
    const theme = this.model.active ? "light" : "dark"
    document.documentElement.style.setProperty("--bokeh-color-scheme", theme)
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

  constructor(attrs?: Partial<LightDark.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LightDarkView

    this.override<LightDark.Props>({
      on_icon: "light_theme",
      off_icon: "dark_theme",
    })
  }
}
