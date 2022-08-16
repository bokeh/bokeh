import {ActionTool, ActionToolView} from "./action_tool"
import {PlotView} from "../../plots/plot_canvas"
import * as p from "core/properties"

export abstract class PlotActionToolView extends ActionToolView {
  override model: PlotActionTool
  override readonly parent: PlotView

  get plot_view(): PlotView {
    return this.parent
  }
}

export namespace PlotActionTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface PlotActionTool extends PlotActionTool.Attrs {}

export abstract class PlotActionTool extends ActionTool {
  override properties: PlotActionTool.Props
  override __view_type__: PlotActionToolView

  constructor(attrs?: Partial<PlotActionTool.Attrs>) {
    super(attrs)
  }
}
