import {Tool, ToolView} from "../tool"
import {OnOffButtonView} from "../on_off_button"
import {PlotView} from "../../plots/plot"

import * as p from "core/properties"

export abstract class InspectToolView extends ToolView {
  override model: InspectTool
  override readonly parent: PlotView

  get plot_view(): PlotView {
    return this.parent
  }
}

export namespace InspectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Tool.Props & {
    toggleable: p.Property<boolean>
  }
}

export interface InspectTool extends InspectTool.Attrs {}

export abstract class InspectTool extends Tool {
  override properties: InspectTool.Props
  override __view_type__: InspectToolView

  constructor(attrs?: Partial<InspectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.button_view = OnOffButtonView

    this.define<InspectTool.Props>(({Boolean}) => ({
      toggleable: [ Boolean, true ],
    }))

    this.override<InspectTool.Props>({
      active: true,
    })
  }

  override event_type = "move" as "move"
}
