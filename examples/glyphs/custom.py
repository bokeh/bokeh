from __future__ import print_function

from bokeh.core.properties import String
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.callbacks import Callback
from bokeh.models.glyphs import Circle
from bokeh.models import Plot, DataRange1d, LinearAxis, ColumnDataSource, PanTool, WheelZoomTool, TapTool
from bokeh.models.widgets import HBox
from bokeh.resources import INLINE
from bokeh.util.browser import view

class Popup(Callback):

    __implementation__ = """
_ = require "underscore"
Util = require "util/util"
HasProperties = require "common/has_properties"

class Popup extends HasProperties
  type: "Popup"

  execute: (data_source) ->
    for i in Util.get_indices(data_source)
      message = Util.replace_placeholders(@get("message"), data_source, i)
      window.alert(message)
    null

  defaults: ->
    return _.extend {}, super(), {
      message: ""
    }

module.exports =
  Model: Popup
"""

    message = String("", help="""
    Message to display in a popup window. This can be a template string,
    which will be formatted with data from the data source.
    """)

class MyHBox(HBox):

    __implementation__ = """
_ = require "underscore"
build_views = require "common/build_views"
ContinuumView = require "common/continuum_view"
HBox = require "widget/hbox"

class MyHBoxView extends HBox.View
  render: () ->
    super()
    @$el.css({border: "5px solid black"})

class MyHBox extends HBox.Model
  type: "MyHBox"
  default_view: MyHBoxView

module.exports = {
  Model: MyHBox
  View: MyHBoxView
}
"""

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
doc.add_root(MyHBox(children=[plot]))

if __name__ == "__main__":
    filename = "custom.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of user-defined models"))
    print("Wrote %s" % filename)
    view(filename)
