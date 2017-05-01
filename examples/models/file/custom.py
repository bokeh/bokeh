from __future__ import print_function

from bokeh.core.properties import String, Int, Color
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.callbacks import Callback
from bokeh.models.glyphs import Circle
from bokeh.models import Plot, DataRange1d, LinearAxis, ColumnDataSource, PanTool, WheelZoomTool, TapTool
from bokeh.models.layouts import Row
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.util.compiler import CoffeeScript

class Popup(Callback):

    __implementation__ = "popup.coffee"

    message = String("", help="""
    Message to display in a popup window. This can be a template string,
    which will be formatted with data from the data source.
    """)

class MyRow(Row):

    __implementation__ = """
import {Row, RowView} from "models/layouts/row"
import * as p from "core/properties"
import "./custom.less"

export class MyRowView extends RowView
  render: () ->
    super()
    @el.classList.add("bk-my-row")
    @el.style.borderWidth = "#{@model.border_width}px"
    @el.style.borderColor = @model.border_color

export class MyRow extends Row
  type: "MyRow"
  default_view: MyRowView

  @define {
    border_width: [ p.Number, 3 ]
    border_color: [ p.Color, "black" ]
  }
"""

    border_width = Int(3)
    border_color = Color("black")

class MyRow2(MyRow):

    __implementation__ = CoffeeScript("""
import {MyRow, MyRowView} from "custom/my_row"

export class MyRow2View extends MyRowView
  render: () ->
    super()

export class MyRow2 extends MyRow
  type: "MyRow2"
  default_view: MyRow2View
""")

source = ColumnDataSource(
    data = dict(
        x = [1, 2, 3, 4, 4,   5, 5],
        y = [5, 4, 3, 2, 2.1, 1, 1.1],
        color = ["rgb(0, 100, 120)", "green", "blue", "#2c7fb8", "#2c7fb8", "rgba(120, 230, 150, 0.5)", "rgba(120, 230, 150, 0.5)"]
    )
)

xdr = DataRange1d()
ydr = DataRange1d()

plot = Plot(x_range=xdr, y_range=ydr)

circle = Circle(x="x", y="y", radius=0.2, fill_color="color", line_color="black")
circle_renderer = plot.add_glyph(source, circle)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

tap = TapTool(renderers=[circle_renderer], callback=Popup(message="Selected color: @color"))
plot.add_tools(PanTool(), WheelZoomTool(), tap)

doc = Document()
doc.add_root(MyRow2(children=[plot]))

if __name__ == "__main__":
    doc.validate()
    filename = "custom.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of user-defined models"))
    print("Wrote %s" % filename)
    view(filename)
