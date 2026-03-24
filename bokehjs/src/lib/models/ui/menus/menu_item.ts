import {Model} from "../../../model"
import type {Menu} from "./menu"
import {IconLike} from "../../common/kinds"
import {Callback} from "models/callbacks/callback"
import type {CallbackLike1} from "core/util/callbacks"
import {TranslatableText} from "../../dom/translatable_text"
import type * as p from "core/properties"

type ActionCallback = CallbackLike1<Menu, {item: MenuItem}>

export namespace MenuItem {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    checked: p.Property<(() => boolean) | boolean | null>
    icon: p.Property<IconLike | null>
    label: p.Property<TranslatableText | string>
    tooltip: p.Property<TranslatableText | string | null>
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
    this.define<MenuItem.Props>(({Bool, Str, Nullable, AnyRef, Ref, Func, Func0, Or}) => ({
      checked: [ Nullable(Or(Bool, Func0(Bool))), null ],
      icon: [ Nullable(IconLike), null ],
      label: [ Or(Ref(TranslatableText), Str) ],
      tooltip: [ Nullable(Or(Ref(TranslatableText), Str)), null ],
      shortcut: [ Nullable(Str), null ],
      menu: [ Nullable(AnyRef<Menu>()), null ],
      disabled: [ Or(Bool, Func0(Bool)), false ],
      action: [ Nullable(Or(Ref(Callback), Func())), null ],
    }))
  }
}
