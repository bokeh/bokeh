import {Control, ControlView} from "./control"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import inputs_css from "styles/widgets/inputs.css"
import checkbox_css from "styles/widgets/checkbox.css"

export abstract class ToggleInputGroupView extends ControlView {
  declare model: ToggleInputGroup

  protected _inputs: HTMLInputElement[]
  *controls() {
    yield* this._inputs
  }

  override connect_signals(): void {
    super.connect_signals()

    const {labels, inline} = this.model.properties
    this.on_change([labels, inline], () => this.rerender())
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), inputs_css, checkbox_css]
  }
}

export namespace ToggleInputGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    labels: p.Property<string[]>
    inline: p.Property<boolean>
  }
}

export interface ToggleInputGroup extends ToggleInputGroup.Attrs {}

export abstract class ToggleInputGroup extends Control {
  declare properties: ToggleInputGroup.Props & {active: p.Property<unknown>}
  declare __view_type__: ToggleInputGroupView

  constructor(attrs?: Partial<ToggleInputGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToggleInputGroup.Props>(({Bool, Str, List}) => ({
      labels: [ List(Str), [] ],
      inline: [ Bool, false ],
    }))
  }
}
