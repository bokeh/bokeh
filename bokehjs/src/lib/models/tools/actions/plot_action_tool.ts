import {ActionTool, ActionToolView} from "./action_tool"
import type {PlotView} from "../../plots/plot_canvas"
import type * as p from "core/properties"

export abstract class PlotActionToolView<P extends PlotView = PlotView> extends ActionToolView {
  declare model: PlotActionTool
  declare readonly parent: P

  get plot_view(): P {
    return this.parent
  }
}

export namespace PlotActionTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface PlotActionTool extends PlotActionTool.Attrs {}

export abstract class PlotActionTool extends ActionTool {
  declare properties: PlotActionTool.Props
  declare __view_type__: PlotActionToolView

}
