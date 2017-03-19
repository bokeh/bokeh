from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.callbacks import CustomJS
from bokeh.models.glyphs import Circle
from bokeh.models import Plot, DataRange1d, LinearAxis, ColumnDataSource, PanTool, WheelZoomTool, TapTool
from bokeh.resources import INLINE

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

customjs = CustomJS.from_coffeescript(args=dict(source=source), code="""
  import {get_indices} from "core/util/selection"

  for i in get_indices(source)
    color = source.data['color'][i]
    window.alert("Selected color: #{color}")
""")

tap = TapTool(renderers=[circle_renderer], callback=customjs)
plot.add_tools(PanTool(), WheelZoomTool(), tap)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "customjs.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of custom callback written in CoffeeScript"))
    print("Wrote %s" % filename)
    view(filename)
