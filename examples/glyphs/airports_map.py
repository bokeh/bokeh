from __future__ import print_function

import json

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.models.glyphs import Circle
from bokeh.plotting import output_file
from bokeh.models import Plot
from bokeh.models import Range1d
from bokeh.models import WheelZoomTool, ResizeTool, PanTool, BoxZoomTool, HoverTool
from bokeh.models import WMTSTileSource
from bokeh.models import ColumnDataSource

from bokeh.sampledata.airports import data as airports

title = "US Airports: Field Elevation > 1500m"
output_file("airports_map.html", title=title)

points_source = ColumnDataSource(airports)

# create tile source
tile_options = {}
tile_options['url'] = 'http://otile2.mqcdn.com/tiles/1.0.0/sat/{Z}/{X}/{Y}.png'
tile_source = WMTSTileSource(**tile_options)

# set to roughly extent of points
x_range = Range1d(start=airports['x'].min() - 10000, end=airports['x'].max() + 10000)
y_range = Range1d(start=airports['y'].min() - 10000, end=airports['y'].max() + 10000)

# create plot and add tools
hover_tool = HoverTool(tooltips=[("Name", "@name"), ("Elevation", "@elevation (m)")])
p = Plot(x_range=x_range, y_range=y_range, plot_height=690, plot_width=990, title=title)
p.add_tools(ResizeTool(), WheelZoomTool(), PanTool(), BoxZoomTool(), hover_tool)
p.add_tile(tile_source)

# create point glyphs
point_options = {}
point_options['x'] = 'x'
point_options['y'] = 'y'
point_options['size'] = 9
point_options['fill_color'] = "#60ACA1"
point_options['line_color'] = "#D2C4C1"
point_options['line_width'] = 1.5
points_glyph = Circle(**point_options)
p.add_glyph(points_source, points_glyph)

doc = Document()
doc.add(p)

if __name__ == "__main__":
    filename = "airports_map.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Bokeh Airports Example"))
    print("Wrote %s" % filename)
    view(filename)
