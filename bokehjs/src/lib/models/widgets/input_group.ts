import {Control, ControlView} from "./control"
import * as p from "core/properties"

export abstract class InputGroupView extends ControlView {
  model: InputGroup
}

export namespace InputGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props
}

export interface InputGroup extends InputGroup.Attrs {}

export abstract class InputGroup extends Control {
  properties: InputGroup.Props

  constructor(attrs?: Partial<InputGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "InputGroup"
  }
}
InputGroup.initClass()
