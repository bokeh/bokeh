import {Tool, ToolView} from "../tool"
import {OnOffButton} from "../on_off_button"
import type {PlotView} from "../../plots/plot"
import * as p from "core/properties"

export abstract class InspectToolView extends ToolView {
  declare model: InspectTool
  declare readonly parent: PlotView

  get plot_view(): PlotView {
    return this.parent
  }
}

export namespace InspectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Tool.Props & {
    /** @deprecated */
    toggleable: p.Property<boolean>
  }
}

export interface InspectTool extends InspectTool.Attrs {}

export abstract class InspectTool extends Tool {
  declare properties: InspectTool.Props
  declare __view_type__: InspectToolView

  constructor(attrs?: Partial<InspectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<InspectTool.Props>(() => ({
      toggleable: [ new p.PropertyAlias("visible") ],
    }))

    this.override<InspectTool.Props>({
      active: true,
    })
  }

  override event_type = "move" as "move"

  override tool_button(): OnOffButton {
    return new OnOffButton({tool: this})
  }
}
