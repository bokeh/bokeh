import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

import * as p from "core/properties"

export abstract class InspectToolView extends ButtonToolView {
  model: InspectTool
}

export namespace InspectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ButtonTool.Props & {
    toggleable: p.Property<boolean>
  }
}

export interface InspectTool extends InspectTool.Attrs {}

export abstract class InspectTool extends ButtonTool {
  properties: InspectTool.Props

  constructor(attrs?: Partial<InspectTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.button_view = OnOffButtonView

    this.define<InspectTool.Props>({
      toggleable: [ p.Boolean, true ],
    })

    this.override({
      active: true,
    })
  }

  event_type = "move" as "move"
}
InspectTool.initClass()
