from __future__ import print_function

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE

from bokeh.plotting import output_file

from bokeh.models import Plot
from bokeh.models import Range1d
from bokeh.models import WheelZoomTool, ResizeTool, PanTool, BoxZoomTool
from bokeh.models import ImageSource

title = 'Dynamic Map: National Land Cover Dataset'

output_file("dynamic_map.html", title=title)
service_url = 'http://raster.nationalmap.gov/arcgis/rest/services/LandCover/USGS_EROS_LandCover_NLCD/MapServer/export?'
service_url += 'bbox={XMIN},{YMIN},{XMAX},{YMAX}&bboxSR=102008&size={HEIGHT}%2C{WIDTH}&imageSR=102008&format=png&transparent=true&f=image'

# set to roughly full extent of US in Albers Equal-Area Conic projection
x_range = Range1d(start=-3700000, end=2700000)
y_range = Range1d(start=-2100000, end=4300000)

# create tile source from templated url
image_source_options = {}
image_source_options['url'] = service_url
image_source = ImageSource(**image_source_options)

# instantiate plot and add tile source
p = Plot(x_range=x_range, y_range=y_range, plot_height=700, plot_width=700, title=title)
p.background_fill = "black"
p.add_tools(ResizeTool(), WheelZoomTool(), PanTool(), BoxZoomTool())

tile_renderer_options = {}
p.add_dynamic_image(image_source)

doc = Document()
doc.add(p)

if __name__ == "__main__":
    filename = "dynamic_map.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, title))
    print("Wrote %s" % filename)
    view(filename)
