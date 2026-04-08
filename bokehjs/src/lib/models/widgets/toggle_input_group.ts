import {Widget, WidgetView} from "./widget"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import inputs_css from "styles/widgets/inputs.css"
import checkbox_css from "styles/widgets/checkbox.css"

export abstract class ToggleInputGroupView extends WidgetView {
  declare readonly model: ToggleInputGroup
  declare readonly signals: p.SignalsOf<ToggleInputGroup.Props>

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), inputs_css, checkbox_css]
  }
}

export namespace ToggleInputGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    labels: p.Property<string[]>
    inline: p.Property<boolean>
  }
}

export interface ToggleInputGroup extends ToggleInputGroup.Attrs {}

export abstract class ToggleInputGroup extends Widget {
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
