import {ActionTool, ActionToolView} from "./action_tool"

export class SaveToolView extends ActionToolView

  doit: () -> @plot_view.save("bokeh_plot")

export class SaveTool extends ActionTool
  default_view: SaveToolView
  type: "SaveTool"
  tool_name: "Save"
  icon: "bk-tool-icon-save"
