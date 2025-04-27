import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"

export class ToggleTextSelectionToolView extends PlotActionToolView {
  declare model: ToggleTextSelectionTool

  override initialize(): void {
    super.initialize()
    this.model.active = this.plot_view.model.selectable_text
  }

  override connect_signals(): void {
    super.connect_signals()
    const {selectable_text} = this.plot_view.model.properties
    this.on_change(selectable_text, () => this.model.active = this.plot_view.model.selectable_text)
  }

  doit(): void {
    const plot = this.plot_view.model
    plot.selectable_text = !plot.selectable_text
  }
}

export namespace ToggleTextSelectionTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = PlotActionTool.Props
}

export interface ToggleTextSelectionTool extends ToggleTextSelectionTool.Attrs {}

export class ToggleTextSelectionTool extends PlotActionTool {
  declare properties: ToggleTextSelectionTool.Props
  declare __view_type__: ToggleTextSelectionToolView

  constructor(attrs?: Partial<ToggleTextSelectionTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToggleTextSelectionToolView

    this.register_alias("toggle_text_selection", () => new ToggleTextSelectionTool())
  }

  override tool_name = "ToggleTextSelection"
  override tool_icon = icons.tool_icon_text_cursor
}
