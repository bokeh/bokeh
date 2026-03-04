import {Switch, SwitchView} from "./switch"
import type * as p from "core/properties"

export class ThemeSwitchView extends SwitchView {
  declare model: ThemeSwitch

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
    document.documentElement.style.setProperty("--color-scheme", theme)
  }
}

export namespace ThemeSwitch {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Switch.Props
}

export interface ThemeSwitch extends ThemeSwitch.Attrs {}

export class ThemeSwitch extends Switch {
  declare properties: ThemeSwitch.Props
  declare __view_type__: ThemeSwitchView

  constructor(attrs?: Partial<ThemeSwitch.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ThemeSwitchView

    this.override<ThemeSwitch.Props>({
      on_icon: "light_theme",
      off_icon: "dark_theme",
    })
  }
}
