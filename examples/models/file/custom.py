from __future__ import print_function

from bokeh.core.properties import String, Float, Color, List, Override
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.callbacks import Callback
from bokeh.models.glyphs import Circle
from bokeh.models import Plot, LinearAxis, ColumnDataSource, PanTool, WheelZoomTool, TapTool
from bokeh.resources import INLINE
from bokeh.util.browser import view

class Popup(Callback):

    __implementation__ = "popup.coffee"

    message = String("", help="""
    Message to display in a popup window. This can be a template string,
    which will be formatted with data from the data source.
    """)

class MyPlot(Plot):

    __implementation__ = """
import {Plot, PlotView} from "models/plots/plot"
import * as p from "core/properties"
import "./custom.less"

export class MyPlotView extends PlotView
  render: () ->
    super()
    @el.classList.add("bk-my-plot")

    angle = "#{@model.gradient_angle}deg"

    offset = 0
    colors = []
    step = @model.gradient_step

    for color in @model.gradient_colors
      colors.push("#{color} #{offset}px")
      offset += step
      colors.push("#{color} #{offset}px")

    @el.style.backgroundImage = "repeating-linear-gradient(#{angle}, #{colors.join(', ')})"

export class MyPlot extends Plot
  type: "MyPlot"
  default_view: MyPlotView

  @define {
    gradient_angle:  [ p.Number, 0                      ]
    gradient_step:   [ p.Number, 20                     ]
    gradient_colors: [ p.Array,  ["white", "lightgray"] ]
  }

  @override {
    background_fill_alpha: 0.0
    border_fill_alpha: 0.0
  }
"""

    gradient_angle = Float(default=0)
    gradient_step = Float(default=20)
    gradient_colors = List(Color, default=["white", "gray"])

    background_fill_alpha = Override(default=0.0)
    border_fill_alpha = Override(default=0.0)

source = ColumnDataSource(
    data = dict(
        x = [1, 2, 3, 4, 4,   5, 5],
        y = [5, 4, 3, 2, 2.1, 1, 1.1],
        color = ["rgb(0, 100, 120)", "green", "blue", "#2c7fb8", "#2c7fb8", "rgba(120, 230, 150, 0.5)", "rgba(120, 230, 150, 0.5)"]
    )
)

plot = MyPlot(gradient_angle=45)

circle = Circle(x="x", y="y", radius=0.2, fill_color="color", line_color="black")
circle_renderer = plot.add_glyph(source, circle)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

tap = TapTool(renderers=[circle_renderer], callback=Popup(message="Selected color: @color"))
plot.add_tools(PanTool(), WheelZoomTool(), tap)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "custom.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of user-defined models"))
    print("Wrote %s" % filename)
    view(filename)
