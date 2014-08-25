from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Circle
from bokeh.objects import (
    GMapPlot, Range1d, ColumnDataSource,
    PanTool, WheelZoomTool, BoxSelectTool,
    BoxSelectionOverlay, ObjectExplorerTool, MapOptions)
from bokeh.resources import INLINE

x_range = Range1d()
y_range = Range1d()

map_options = MapOptions(lat=30.2861, lng=-97.7394, zoom=15)

plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    data_sources=[],
    title = "Austin"
)

source = ColumnDataSource(
    data=dict(
        lat=[30.2861, 30.2855, 30.2869],
        lon=[-97.7394, -97.7390, -97.7405],
        fill=['orange', 'blue', 'green']
    )
)

circle = Circle(x="lon", y="lat", size=15, fill_color="fill", line_color="black")
plot.add_glyph(source, x_range, y_range, circle)

pan = PanTool()
wheel_zoom = WheelZoomTool()
object_explorer = ObjectExplorerTool()
box_select = BoxSelectTool()

plot.add_tools(pan, wheel_zoom, object_explorer, box_select)

overlay = BoxSelectionOverlay(tool=box_select)
plot.add_layout(overlay)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "maps.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps Example"))
    print("Wrote %s" % filename)
    view(filename)
