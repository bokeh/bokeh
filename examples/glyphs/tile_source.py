from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.plotting import figure, output_file
from bokeh.models import Plot
from bokeh.models import Range1d
from bokeh.models import WheelZoomTool,ResizeTool,PanTool,BoxZoomTool 
from bokeh.models import WMTSTileSource

WMTSTileSource, Range1d

output_file("tile_source_example.html", title="Tile Source Example")

# create tile source from templated url
osm_url = 'http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png'
tile_source = WMTSTileSource()
tile_source.url = osm_url

# set to roughly full extent of web mercator projection
x_range = Range1d(start=-20000000, end=20000000)
y_range = Range1d(start=-20000000, end=20000000)

# instantiate plot and add tile source
p = Plot(x_range=x_range, y_range=y_range, plot_height=800, plot_width=800)
p.add_tools(ResizeTool(), WheelZoomTool(), PanTool(), BoxZoomTool())
p.add_tile(tile_source)

doc = Document()
doc.add(p)

if __name__ == "__main__":
    filename = "tile_source.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Tile Source Example"))
    print("Wrote %s" % filename)
    view(filename)
