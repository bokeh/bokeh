import {Action, ActionView} from "./action"
import * as p from "core/properties"

export class CheckActionView extends ActionView {
  override model: CheckAction
}

export namespace CheckAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Action.Props & {
    checked: p.Property<boolean>
  }
}

export interface CheckAction extends CheckAction.Attrs {}

export class CheckAction extends Action {
  override properties: CheckAction.Props
  override __view_type__: CheckActionView

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
