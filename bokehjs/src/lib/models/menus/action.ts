import {MenuItem, MenuItemView} from "./menu_item"
import {Menu} from "./menu"
import {Icon} from "../ui/icons/icon"
import {Keys, span} from "core/dom"
import * as p from "core/properties"

// import * as menus from "styles/menus.css"

export class ActionView extends MenuItemView {
  override model: Action

  protected _click(): void {

  }

  override render(): void {
    super.render()

    const {label, description} = this.model

    this.el.tabIndex = 0
    this.el.title = description ?? ""

    this.el.appendChild(span(label))

    this.el.addEventListener("click", () => {
      this._click()
    })
    this.el.addEventListener("keydown", (event) => {
      if (event.keyCode == Keys.Enter) {
        this._click()
      }
    })
  }
}

export namespace Action {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MenuItem.Props & {
    icon: p.Property<Icon | null>
    label: p.Property<string>
    description: p.Property<string | null>
    menu: p.Property<Menu | null>
  }
}

export interface Action extends Action.Attrs {}

export class Action extends MenuItem {
  override properties: Action.Props
  override __view_type__: ActionView

  constructor(attrs?: Partial<Action.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ActionView

    this.define<Action.Props>(({String, Nullable, Ref}) => ({
      icon: [ Nullable(Ref(Icon)), null ],
      label: [ String ],
      description: [ Nullable(String), null ],
      menu: [ Nullable(Ref(Menu)), null ],
    }))
  }
}
