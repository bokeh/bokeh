import * as _ from "underscore"

import {ActionTool, ActionToolView} from "./action_tool"

export class SaveToolView extends ActionToolView

  do: () ->
    canvas = @plot_view.get_canvas_element()
    name = "bokeh_plot.png"

    if canvas.msToBlob?
      blob = canvas.msToBlob()
      window.navigator.msSaveBlob(blob, name)
    else
      link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = name
      link.target = "_blank"
      link.dispatchEvent(new MouseEvent('click'))

export class SaveTool extends ActionTool
  default_view: SaveToolView
  type: "SaveTool"
  tool_name: "Save"
  icon: "bk-tool-icon-save"
