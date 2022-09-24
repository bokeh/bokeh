import {Tool, ToolView} from "../tool"
import {OnOffButton} from "../on_off_button"
import {PlotView} from "../../plots/plot"
import {EventType} from "core/ui_events"
import * as p from "core/properties"

export abstract class GestureToolView extends ToolView {
  override model: GestureTool
  override readonly parent: PlotView

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
  override properties: GestureTool.Props
  override __view_type__: GestureToolView

  constructor(attrs?: Partial<GestureTool.Attrs>) {
    super(attrs)
  }

  abstract readonly default_order: number

  abstract override readonly event_type: EventType | EventType[]

  override tool_button(): OnOffButton {
    return new OnOffButton({tool: this})
  }
}
