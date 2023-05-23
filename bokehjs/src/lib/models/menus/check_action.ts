import {Action, ActionView} from "./action"
import type * as p from "core/properties"

export class CheckActionView extends ActionView {
  declare model: CheckAction
}

export namespace CheckAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Action.Props & {
    checked: p.Property<boolean>
  }
}

export interface CheckAction extends CheckAction.Attrs {}

export class CheckAction extends Action {
  declare properties: CheckAction.Props
  declare __view_type__: CheckActionView

  constructor(attrs?: Partial<CheckAction.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CheckActionView

    this.define<CheckAction.Props>(({Boolean}) => ({
      checked: [ Boolean, false ],
    }))
  }
}
