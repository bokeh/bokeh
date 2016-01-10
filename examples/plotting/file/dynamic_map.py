from bokeh.models import ImageSource, Range1d
from bokeh.plotting import figure, output_file, show
from bokeh.tile_providers import STAMEN_TONER, STAMEN_TONER_LABELS

title = 'Dynamic Map: National Land Cover Dataset'
p = figure(tools='wheel_zoom,pan', title=title)
p.x_range = Range1d(start=-15473429, end=2108550, bounds=None)
p.y_range = Range1d(start=-6315661, end=7264686, bounds=None)
p.background_fill_color = "black"
p.axis.visible = False

# National Land Cover Dataset (http://www.mrlc.gov/nlcd2011.php)
service_url = (
    "http://raster.nationalmap.gov/"
    "arcgis/rest/services/LandCover/USGS_EROS_LandCover_NLCD/MapServer/export"
    "?bbox={XMIN},{YMIN},{XMAX},{YMAX}"
    "&bboxSR=102100"
    "&size={HEIGHT}%2C{WIDTH}"
    "&imageSR=102100"
    "&format=png32"
    "&transparent=true"
    "&f=image"
)
image_source = ImageSource(url=service_url)

p.add_tile(STAMEN_TONER)
p.add_dynamic_image(image_source)
p.add_tile(STAMEN_TONER_LABELS, render_parents=False)

output_file('dynamic_map.html', title="dynamic_map.py example")

show(p)
