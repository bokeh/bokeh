import {Tool, ToolView} from "../tool"
import {OnOffButton} from "../on_off_button"
import type {PlotView} from "../../plots/plot"
import type {EventType} from "core/ui_events"
import type * as p from "core/properties"

export abstract class GestureToolView extends ToolView {
  declare model: GestureTool
  declare readonly parent: PlotView

  get plot_view(): PlotView {
    return this.parent
  }
}

export namespace GestureTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Tool.Props
}

export interface GestureTool extends GestureTool.Attrs {}

export abstract class GestureTool extends Tool {
  declare properties: GestureTool.Props
  declare __view_type__: GestureToolView

  constructor(attrs?: Partial<GestureTool.Attrs>) {
    super(attrs)
  }

  abstract readonly default_order: number

  abstract override readonly event_type: EventType | EventType[]

  override tool_button(): OnOffButton {
    return new OnOffButton({tool: this})
  }
}
