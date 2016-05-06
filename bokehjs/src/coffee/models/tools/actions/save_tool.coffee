_ = require "underscore"

ActionTool = require "./action_tool"

class SaveToolView extends ActionTool.View

  do: () ->
    canvas = @plot_view.canvas_view.canvas[0]
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

class SaveTool extends ActionTool.Model
  default_view: SaveToolView
  type: "SaveTool"
  tool_name: "Save"
  icon: "bk-tool-icon-save"

module.exports = {
  Model: SaveTool
  View: SaveToolView
}
