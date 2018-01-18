import {ActionTool, ActionToolView} from "./action_tool"

export class SaveToolView extends ActionToolView {

  model: SaveTool

  doit(): void {
    this.plot_view.save("bokeh_plot")
  }
}

export class SaveTool extends ActionTool {

  static initClass() {
    this.prototype.type = "SaveTool"

    this.prototype.default_view = SaveToolView
  }

  tool_name = "Save"
  icon = "bk-tool-icon-save"
}

SaveTool.initClass()
