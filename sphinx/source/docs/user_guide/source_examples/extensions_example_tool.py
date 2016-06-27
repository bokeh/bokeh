from bokeh.core.properties import Instance
from bokeh.io import output_file, show
from bokeh.models import ColumnDataSource, Tool, CustomJS
from bokeh.plotting import figure

output_file('tool.html')

JS_CODE = """
p = require "core/properties"
GestureTool = require "models/tools/gestures/gesture_tool"

class DrawToolView extends GestureTool.View

  # this is executed when the pan/drag event starts
  _pan_start: (e) ->
    @model.source.data = {x: [], y: []}

  # this is executed on subsequent mouse/touch moves
  _pan: (e) ->
    frame = @plot_model.frame
    canvas = @plot_view.canvas

    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not frame.contains(vx, vy)
      return null

    x = frame.get('x_mappers').default.map_from_target(vx)
    y = frame.get('y_mappers').default.map_from_target(vy)

    @model.source.data.x.push(x)
    @model.source.data.y.push(y)
    @model.source.trigger('change')

  # this is executed then the pan/drag ends
  _pan_end: (e) -> return null

class DrawTool extends GestureTool.Model
  default_view: DrawToolView
  type: "DrawTool"

  tool_name: "Drag Span"
  icon: "bk-tool-icon-lasso-select"
  event_type: "pan"
  default_order: 12

  @define { source: [ p.Instance ] }

module.exports =
  Model: DrawTool
  View: DrawToolView
"""

class DrawTool(Tool):
    __implementation__ = JS_CODE
    source = Instance(ColumnDataSource)

source = ColumnDataSource(data=dict(x=[], y=[]))

plot = figure(x_range=(0,10), y_range=(0,10), tools=[DrawTool(source=source)])
plot.title.text ="Drag to draw on the plot"
plot.line('x', 'y', source=source)

show(plot)
