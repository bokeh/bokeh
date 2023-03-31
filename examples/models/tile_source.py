''' Example to demonstrate creating map-based visualizations and
working with geographical data using WMTSTileSource in Bokeh.

.. bokeh-example-metadata::
    :apis: bokeh.models.WMTSTileSource, bokeh.models.Range1d, bokeh.models.BoxZoomTool, bokeh.models.PanTool, bokeh.models.WheelZoomTool
    :refs: :ref:`ug_topics_tile_provider_maps`
    :keywords: tile source

'''
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (BoxZoomTool, PanTool, Plot, Range1d,
                          WheelZoomTool, WMTSTileSource)
from bokeh.resources import INLINE
from bokeh.util.browser import view

# set to roughly full extent of web mercator projection
x_range = Range1d(start=-200000, end=2000000)
y_range = Range1d(start=800000, end=7000000)

# create tile source from templated url
tile_options = {}
tile_options['url'] = 'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
tile_source = WMTSTileSource(**tile_options)

# instantiate plot and add tile source
p = Plot(x_range=x_range, y_range=y_range, height=800, width=800)
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
    print(f"Wrote {filename}")
    view(filename)
