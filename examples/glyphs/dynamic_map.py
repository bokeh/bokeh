from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE

from bokeh.models import Plot
from bokeh.models import Range1d
from bokeh.models import WheelZoomTool, PanTool
from bokeh.models import ImageSource, WMTSTileSource

# create plot object
title = 'Dynamic Map: National Land Cover Dataset'
x_range = Range1d(start=-15473429, end=2108550)
y_range = Range1d(start=-6315661, end=7264686)
p = Plot(x_range=x_range, y_range=y_range, plot_height=700, plot_width=700, title=title)
p.background_fill = "black"
p.add_tools(WheelZoomTool(), PanTool())

# add base layer
tile_options = {}
tile_options['url'] = 'http://tile.stamen.com/toner/{Z}/{X}/{Y}.png'
tile_source = WMTSTileSource(**tile_options)
p.add_tile(tile_source)

# add dynamic data layer
# National Land Cover Dataset (http://www.mrlc.gov/nlcd2011.php)
service_url = 'http://raster.nationalmap.gov/arcgis/rest/services/LandCover/USGS_EROS_LandCover_NLCD/MapServer/export?'
service_url += 'bbox={XMIN},{YMIN},{XMAX},{YMAX}&bboxSR=102100&size={HEIGHT}%2C{WIDTH}&imageSR=102100&format=png32&transparent=true&f=image'
image_source_options = {}
image_source_options['url'] = service_url
image_source = ImageSource(**image_source_options)
p.add_dynamic_image(image_source)

# create labels layer
tile_label_options = {}
tile_label_options['url'] = 'http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png'
tile_label_source = WMTSTileSource(**tile_label_options)
p.add_tile(tile_label_source, **dict(render_parents=True))

doc = Document()
doc.add(p)

if __name__ == "__main__":
    filename = "dynamic_map.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, title))
    print("Wrote %s" % filename)
    view(filename)
