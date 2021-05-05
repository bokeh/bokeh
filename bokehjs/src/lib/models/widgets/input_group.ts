import {Control, ControlView} from "./control"
import * as p from "core/properties"

import inputs_css from "styles/widgets/inputs.css"

export abstract class InputGroupView extends ControlView {
  override model: InputGroup

  protected _inputs: HTMLInputElement[]
  *controls() {
    yield* this._inputs
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  override styles(): string[] {
    return [...super.styles(), inputs_css]
  }
}

export namespace InputGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props
}

export interface InputGroup extends InputGroup.Attrs {}

export abstract class InputGroup extends Control {
  override properties: InputGroup.Props & {active: p.Property<unknown>}
  override __view_type__: InputGroupView

  constructor(attrs?: Partial<InputGroup.Attrs>) {
    super(attrs)
  }
}
