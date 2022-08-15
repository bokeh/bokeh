import {Control, ControlView} from "./control"
import {StyleSheetLike} from "core/dom"
import * as p from "core/properties"

import inputs_css from "styles/widgets/inputs.css"

export abstract class ToggleInputGroupView extends ControlView {
  override model: ToggleInputGroup

  protected _inputs: HTMLInputElement[]
  *controls() {
    yield* this._inputs
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), inputs_css]
  }
}

export namespace ToggleInputGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props
}

export interface ToggleInputGroup extends ToggleInputGroup.Attrs {}

export abstract class ToggleInputGroup extends Control {
  override properties: ToggleInputGroup.Props & {active: p.Property<unknown>}
  override __view_type__: ToggleInputGroupView

  constructor(attrs?: Partial<ToggleInputGroup.Attrs>) {
    super(attrs)
  }
}
