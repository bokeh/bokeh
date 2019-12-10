from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Circle, ColumnDataSource, CustomJS, LinearAxis,
                          PanTool, Plot, TapTool, WheelZoomTool,)
from bokeh.resources import INLINE
from bokeh.util.browser import view

source = ColumnDataSource(
    data = dict(
        x = [1, 2, 3, 4, 4,   5, 5],
        y = [5, 4, 3, 2, 2.1, 1, 1.1],
        color = ["red", "green", "blue", "#2c7fb8", "grey", "#2c7fb8", "lightgrey"]
    )
)

plot = Plot()
plot.title.text = "Click a circle execute a JavaScript callback"

circle = Circle(x="x", y="y", radius=0.2, fill_color="color", line_color="black")
circle_renderer = plot.add_glyph(source, circle)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

customjs = CustomJS(args=dict(source=source), code="""
  const colors = source.selected.indices.map((i) => source.data["color"][i])
  window.alert("Selected colors: " + colors)
""")

tap = TapTool(renderers=[circle_renderer], callback=customjs)
plot.add_tools(PanTool(), WheelZoomTool(), tap)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "customjs.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Demonstration of custom callback written in TypeScript"))
    print("Wrote %s" % filename)
    view(filename)
