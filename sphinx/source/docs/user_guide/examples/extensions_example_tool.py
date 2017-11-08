from bokeh.core.properties import Instance
from bokeh.io import output_file, show
from bokeh.models import ColumnDataSource, Tool
from bokeh.plotting import figure

output_file('tool.html')

JS_CODE = """
import * as p from "core/properties"
import {GestureTool, GestureToolView} from "models/tools/gestures/gesture_tool"

export class DrawToolView extends GestureToolView

  # this is executed when the pan/drag event starts
  _pan_start: (e) ->
    @model.source.data = {x: [], y: []}

  # this is executed on subsequent mouse/touch moves
  _pan: (e) ->
    frame = @plot_model.frame

    {sx, sy} = e.bokeh
    if not frame.bbox.contains(sx, sy)
      return null

    x = frame.xscales['default'].invert(sx)
    y = frame.yscales['default'].invert(sy)

    @model.source.data.x.push(x)
    @model.source.data.y.push(y)
    @model.source.change.emit()

  # this is executed then the pan/drag ends
  _pan_end: (e) -> return null

export class DrawTool extends GestureTool
  default_view: DrawToolView
  type: "DrawTool"

  tool_name: "Drag Span"
  icon: "bk-tool-icon-lasso-select"
  event_type: "pan"
  default_order: 12

  @define { source: [ p.Instance ] }
"""

class DrawTool(Tool):
    __implementation__ = JS_CODE
    source = Instance(ColumnDataSource)

source = ColumnDataSource(data=dict(x=[], y=[]))

plot = figure(x_range=(0,10), y_range=(0,10), tools=[DrawTool(source=source)])
plot.title.text ="Drag to draw on the plot"
plot.line('x', 'y', source=source)

show(plot)
