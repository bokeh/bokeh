from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE

from bokeh.plotting import output_file

from bokeh.models import Plot
from bokeh.models import Range1d
from bokeh.models import WheelZoomTool, PanTool, BoxZoomTool
from bokeh.models import WMTSTileSource

output_file("tile_source_example.html", title="Tile Source Example")

# set to roughly full extent of web mercator projection
x_range = Range1d(start=-20000000, end=20000000)
y_range = Range1d(start=-20000000, end=20000000)

# create tile source from templated url
tile_options = {}
tile_options['url'] = 'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
tile_source = WMTSTileSource(**tile_options)

# instantiate plot and add tile source
p = Plot(x_range=x_range, y_range=y_range, plot_height=800, plot_width=800)
p.add_tools(WheelZoomTool(), PanTool(), BoxZoomTool(match_aspect=True))

tile_renderer_options = {}
p.add_tile(tile_source, **tile_renderer_options)

doc = Document()
doc.add_root(p)

if __name__ == "__main__":
    doc.validate()
    filename = "tile_source.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Tile Source Example"))
    print("Wrote %s" % filename)
    view(filename)
