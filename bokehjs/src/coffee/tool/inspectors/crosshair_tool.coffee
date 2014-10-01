
define [
  "underscore"
  "common/collection"
  "tool/inspect_tool"
], (_, Collection, InspectTool) ->

  class CrosshairToolView extends InspectTool.View

  class CrosshairTool extends InspectTool.Model
    default_view: CrosshairToolView
    type: "CrosshairTool"
    tool_name: "Crosshair"

  class CrosshairTools extends Collection
    model: CrosshairTool

  return {
    "Model": CrosshairTool
    "Collection": new CrosshairTools(),
    "View": CrosshairToolView
  }
