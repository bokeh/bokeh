import {ActionItem} from "./action_item"
import type * as p from "core/properties"

export namespace CheckableItem {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionItem.Props
}

export interface CheckableItem extends CheckableItem.Attrs {}

/** @deprecated */
export class CheckableItem extends ActionItem {
  declare properties: CheckableItem.Props

  constructor(attrs?: Partial<CheckableItem.Attrs>) {
    super(attrs)
  }
}
