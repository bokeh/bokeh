import {MenuAction} from "./menu_action"
import type * as p from "core/properties"

export namespace CheckAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MenuAction.Props & {
    checked: p.Property<boolean>
  }
}

export interface CheckAction extends CheckAction.Attrs {}

export class CheckAction extends MenuAction {
  declare properties: CheckAction.Props

  constructor(attrs?: Partial<CheckAction.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CheckAction.Props>(({Boolean}) => ({
      checked: [ Boolean, false ],
    }))
  }
}
