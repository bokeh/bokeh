import {ActionItem} from "./action_item"
import type * as p from "core/properties"

export namespace CheckableItem {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionItem.Props & {
    checked: p.Property<boolean>
  }
}

export interface CheckableItem extends CheckableItem.Attrs {}

export class CheckableItem extends ActionItem {
  declare properties: CheckableItem.Props

  constructor(attrs?: Partial<CheckableItem.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CheckableItem.Props>(({Bool}) => ({
      checked: [ Bool, false ],
    }))
  }
}
