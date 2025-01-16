import {Model} from "../../../model"
import type {Menu} from "./menu"
import {Callback} from "models/callbacks/callback"
import type {CallbackLike1} from "core/util/callbacks"
import type * as p from "core/properties"
import {ToolIcon} from "core/enums"
import {Or, Regex} from "core/kinds"

const IconLike = Or(ToolIcon, Regex(/^--/), Regex(/^\./), Regex(/^data:image/))
type IconLike = typeof IconLike["__type__"]

type ActionCallback = CallbackLike1<Menu, {item: MenuItem}>

export namespace MenuItem {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    checked: p.Property<(() => boolean) | boolean | null>
    icon: p.Property<IconLike | null>
    label: p.Property<string>
    tooltip: p.Property<string | null>
    shortcut: p.Property<string | null>
    menu: p.Property<Menu | null>
    disabled: p.Property<(() => boolean) | boolean>
    action: p.Property<ActionCallback | null>
  }
}

export interface MenuItem extends MenuItem.Attrs {}

export class MenuItem extends Model {
  declare properties: MenuItem.Props

  constructor(attrs?: Partial<MenuItem.Attrs>) {
    super(attrs)
  }

  static {
    this.define<MenuItem.Props>(({Bool, Str, Nullable, AnyRef, Ref, Func, Func0}) => ({
      checked: [ Nullable(Or(Bool, Func0(Bool))), null ],
      icon: [ Nullable(IconLike), null ],
      label: [ Str ],
      tooltip: [ Nullable(Str), null ],
      shortcut: [ Nullable(Str), null ],
      menu: [ Nullable(AnyRef<Menu>()), null ],
      disabled: [ Or(Bool, Func0(Bool)), false ],
      action: [ Nullable(Or(Ref(Callback), Func())), null ],
    }))
  }
}
