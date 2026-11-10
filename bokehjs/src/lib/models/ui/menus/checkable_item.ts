import {MenuItem} from "./menu_item"
import type * as p from "core/properties"

/** @deprecated use MenuItem with checked=true or checked=false */
export namespace CheckableItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

/** @deprecated use MenuItem with checked=true or checked=false */
export interface CheckableItem extends CheckableItem.Attrs {}

/** @deprecated use MenuItem with checked=true or checked=false */
export class CheckableItem extends MenuItem {
  declare properties: CheckableItem.Props

}
