from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.glyphs import Circle
from bokeh.objects import (
    GMapPlot, Range1d, ColumnDataSource,
    Glyph, PanTool, WheelZoomTool, BoxSelectTool,
    BoxSelectionOverlay, ObjectExplorerTool, MapOptions)
from bokeh.resources import INLINE

# The Google Maps plot
x_range = Range1d()
y_range = Range1d()
map_options = MapOptions(lat=30.2861, lng=-97.7394, zoom=15)
plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    data_sources=[],
    title = "Austin")

select_tool = BoxSelectTool()
overlay = BoxSelectionOverlay(tool=select_tool)
plot.renderers.append(overlay)
plot.tools.append(select_tool)

pantool = PanTool(plot=plot)
wheelzoomtool = WheelZoomTool(plot=plot)
objectexplorer = ObjectExplorerTool()
plot.tools.extend([pantool, wheelzoomtool, objectexplorer])

# Plot some data on top
source = ColumnDataSource(
        data=dict(
            lat=[30.2861, 30.2855, 30.2869],
            lon=[-97.7394, -97.7390, -97.7405],
            fill=['orange', 'blue', 'green']
        )
)

circle_renderer = Glyph(
        data_source = source,
        xdata_range = x_range,
        ydata_range = y_range,
        glyph = Circle(x="lon", y="lat", fill_color="fill", size=15,
                radius_units="screen", line_color="black")
        )
plot.data_sources.append(source)
plot.renderers.append(circle_renderer)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "maps.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps Example"))
    print("Wrote %s" % filename)
    view(filename)
