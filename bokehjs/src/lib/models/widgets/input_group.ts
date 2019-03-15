import {Control, ControlView} from "./control"
import * as p from "core/properties"

export abstract class InputGroupView extends ControlView {
  model: InputGroup

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }
}

export namespace InputGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props
}

export interface InputGroup extends InputGroup.Attrs {}

export abstract class InputGroup extends Control {
  properties: InputGroup.Props & {
    active: p.Property<unknown>
  }

  constructor(attrs?: Partial<InputGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "InputGroup"
  }
}
InputGroup.initClass()
