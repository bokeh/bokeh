import {ActionTool, ActionToolView} from "./action_tool"
import type {PlotRendererView} from "../../plots/plot_renderer"
import type * as p from "core/properties"

export abstract class PlotActionToolView extends ActionToolView {
  declare model: PlotActionTool
  declare readonly parent: PlotRendererView

  get plot_view(): PlotRendererView {
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

  constructor(attrs?: Partial<PlotActionTool.Attrs>) {
    super(attrs)
  }
}
