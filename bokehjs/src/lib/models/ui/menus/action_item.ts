import {MenuItem} from "./menu_item"
import type {Menu} from "./menu"
import {Callback} from "models/callbacks/callback"
import type {CallbackLike1} from "core/util/callbacks"
import type * as p from "core/properties"
import {ToolIcon} from "core/enums"
import {Or, Regex} from "core/kinds"

const IconLike = Or(ToolIcon, Regex(/^--/), Regex(/^\./), Regex(/^data:image/))
type IconLike = typeof IconLike["__type__"]

type ActionCallback = CallbackLike1<Menu, {item: ActionItem}>

export namespace ActionItem {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MenuItem.Props & {
    icon: p.Property<IconLike | null>
    label: p.Property<string>
    tooltip: p.Property<string | null>
    shortcut: p.Property<string | null>
    menu: p.Property<Menu | null>
    disabled: p.Property<boolean>
    action: p.Property<ActionCallback | null>
  }
}

export interface ActionItem extends ActionItem.Attrs {}

export class ActionItem extends MenuItem {
  declare properties: ActionItem.Props

  constructor(attrs?: Partial<ActionItem.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ActionItem.Props>(({Bool, Str, Nullable, AnyRef, Ref, Func}) => ({
      icon: [ Nullable(IconLike), null ],
      label: [ Str ],
      tooltip: [ Nullable(Str), null ],
      shortcut: [ Nullable(Str), null ],
      menu: [ Nullable(AnyRef<Menu>()), null ],
      disabled: [ Bool, false ],
      action: [ Nullable<ActionCallback>(Or(Ref(Callback), Func())), null ],
    }))
  }
}
