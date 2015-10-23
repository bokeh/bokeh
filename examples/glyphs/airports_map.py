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

import urllib.request

from pandas.io.json import json_normalize

title = "US Airports: Field Elevation > 1500m"
output_file("airports.html", title=title)
airports_service = 'http://s3.amazonaws.com/bokeh_data/airports.json'

with urllib.request.urlopen(airports_service) as response:

    content = response.read().decode('utf8')
    airports = json.loads(content)
    schema = [['attributes', 'nam'], ['attributes', 'zv3'], ['geometry', 'x'], ['geometry', 'y']]
    df = json_normalize(airports['features'], meta=schema)
    df.rename(columns={'attributes.nam': 'name', 'attributes.zv3': 'elevation'}, inplace=True)
    points_source = ColumnDataSource(df)

    # create tile source
    tile_options = {}
    tile_options['url'] = 'http://otile2.mqcdn.com/tiles/1.0.0/sat/{Z}/{X}/{Y}.png'
    tile_source = WMTSTileSource(**tile_options)

    # set to roughly extent of points
    x_range = Range1d(start=df['geometry.x'].min() - 10000, end=df['geometry.x'].max() + 10000)
    y_range = Range1d(start=df['geometry.y'].min() - 10000, end=df['geometry.y'].max() + 10000)

    hover_tool = HoverTool(tooltips=[("Name", "@name"), ("Elevation", "@elevation (m)")])
    p = Plot(x_range=x_range, y_range=y_range, plot_height=800, plot_width=800, title=title)
    p.add_tools(ResizeTool(), WheelZoomTool(), PanTool(), BoxZoomTool(), hover_tool)
    p.add_tile(tile_source)

    point_options = {}
    point_options['x'] = 'geometry.x'
    point_options['y'] = 'geometry.y'
    point_options['size'] = 9
    point_options['fill_color'] = "#60ACA1"
    point_options['line_color'] = "#D2C4C1"
    point_options['line_width'] = 1.5
    points_glyph = Circle(**point_options)
    p.add_glyph(points_source, points_glyph)

    doc = Document()
    doc.add(p)

if __name__ == "__main__":
    filename = "airports.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Bokeh Airports Example"))
    print("Wrote %s" % filename)
    view(filename)
