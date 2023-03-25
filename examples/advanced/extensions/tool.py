from bokeh.core.properties import Instance
from bokeh.models import ColumnDataSource, Tool
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript

CODE = """
import {GestureTool, GestureToolView} from "models/tools/gestures/gesture_tool"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PanEvent} from "core/ui_events"
import * as p from "core/properties"

export class DrawToolView extends GestureToolView {
  declare model: DrawTool

  // this is executed when the pan/drag event starts
  _pan_start(_e: PanEvent): void {
    this.model.source.data = {x: [], y: []}
  }

  // this is executed on subsequent mouse/touch moves
  _pan(e: PanEvent): void {
    const {frame} = this.plot_view
    const {sx, sy} = e

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
  _pan_end(_e: PanEvent): void {}
}

export namespace DrawTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    source: p.Property<ColumnDataSource>
  }
}

export interface DrawTool extends DrawTool.Attrs {}

export class DrawTool extends GestureTool {
  declare properties: DrawTool.Props
  declare __view_type__: DrawToolView

  constructor(attrs?: Partial<DrawTool.Attrs>) {
    super(attrs)
  }

  tool_name = "Draw Tool"
  tool_icon = "bk-tool-icon-lasso-select"
  event_type = "pan" as "pan"
  default_order = 12

  static {
    this.prototype.default_view = DrawToolView

    this.define<DrawTool.Props>(({Ref}) => ({
      source: [ Ref(ColumnDataSource) ],
    }))
  }
}
"""

class DrawTool(Tool):
    __implementation__ = TypeScript(CODE)
    source = Instance(ColumnDataSource)

source = ColumnDataSource(data=dict(x=[], y=[]))

plot = figure(x_range=(0,10), y_range=(0,10), title="Click and drag to draw",
              background_fill_color="#efefef", tools="")

plot.add_tools(DrawTool(source=source))

plot.line('x', 'y', line_width=3, source=source)

show(plot)
