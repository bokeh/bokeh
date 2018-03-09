import {ActionTool, ActionToolView} from "./action_tool"
import {Reset} from "core/bokeh_events"

export class ResetToolView extends ActionToolView {
  model: ResetTool

  doit(): void {
    this.plot_view.clear_state()
    this.plot_view.reset_range()
    this.plot_view.reset_selection()
    this.plot_model.plot.trigger_event(new Reset())
  }
}

export namespace ResetTool {
  export interface Attrs extends ActionTool.Attrs {}

  export interface Props extends ActionTool.Props {}
}

export interface ResetTool extends ResetTool.Attrs {}

export class ResetTool extends ActionTool {

  properties: ResetTool.Props

  constructor(attrs?: Partial<ResetTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ResetTool"
    this.prototype.default_view = ResetToolView
  }

  tool_name = "Reset"
  icon = "bk-tool-icon-reset"
}

ResetTool.initClass()
