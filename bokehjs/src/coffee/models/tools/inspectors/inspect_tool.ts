import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

import * as p from "core/properties"

export abstract class InspectToolView extends ButtonToolView {
  model: InspectTool
}

export namespace InspectTool {
  export interface Attrs extends ButtonTool.Attrs {
    toggleable: boolean
  }

  export interface Opts extends ButtonTool.Opts {}
}

export interface InspectTool extends InspectTool.Attrs {}

export abstract class InspectTool extends ButtonTool {

  constructor(attrs?: Partial<InspectTool.Attrs>, opts?: InspectTool.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "InspectTool"
    this.prototype.button_view = OnOffButtonView

    this.define({
      toggleable: [ p.Bool, true ],
    })

    this.override({
      active: true,
    })
  }

  event_type = "move"
}

InspectTool.initClass()
