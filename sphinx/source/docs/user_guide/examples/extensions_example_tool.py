from bokeh.core.properties import Instance
from bokeh.io import output_file, show
from bokeh.models import ColumnDataSource, Tool
from bokeh.plotting import figure
from bokeh.util.compiler import TypeScript

output_file('tool.html')

TS_CODE = """
import {GestureTool, GestureToolView} from "models/tools/gestures/gesture_tool"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PanEvent} from "core/ui_events"
import * as p from "core/properties"

export class DrawToolView extends GestureToolView {
  model: DrawTool

  //this is executed when the pan/drag event starts
  _pan_start(_ev: PanEvent): void {
    this.model.source.data = {x: [], y: []}
  }

  //this is executed on subsequent mouse/touch moves
  _pan(ev: PanEvent): void {
    const {frame} = this.plot_view

    const {sx, sy} = ev
    if (!frame.bbox.contains(sx, sy))
      return

    const x = frame.x_scale.invert(sx)
    const y = frame.y_scale.invert(sy)

    const {source} = this.model
    source.get_array("x").push(x)
    source.get_array("y").push(y)
    source.change.emit()
  }

  // this is executed then the pan/drag ends
  _pan_end(_ev: PanEvent): void {}
}

export namespace DrawTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    source: p.Property<ColumnDataSource>
  }
}

export interface DrawTool extends DrawTool.Attrs {}

export class DrawTool extends GestureTool {
  properties: DrawTool.Props
  __view_type__: DrawToolView

  constructor(attrs?: Partial<DrawTool.Attrs>) {
    super(attrs)
  }

  tool_name = "Drag Span"
  icon = "bk-tool-icon-lasso-select"
  event_type = "pan" as "pan"
  default_order = 12

  static init_DrawTool(): void {
    this.prototype.default_view = DrawToolView

    this.define<DrawTool.Props>({
      source: [ p.Instance ],
    })
  }
}
"""


class DrawTool(Tool):
    __implementation__ = TypeScript(TS_CODE)
    source = Instance(ColumnDataSource)


source = ColumnDataSource(data=dict(x=[], y=[]))

plot = figure(x_range=(0, 10), y_range=(0, 10), tools=[DrawTool(source=source)])
plot.title.text = "Drag to draw on the plot"
plot.line('x', 'y', source=source)

show(plot)
