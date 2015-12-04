from bokeh.plotting import figure
from bokeh.plotting import output_file
from bokeh.plotting import show
from bokeh.models import Range1d
from bokeh.models import ImageSource
from bokeh.tile_providers import STAMEN_TONER, STAMEN_TONER_LABELS

output_file('dynamic_map.html')

title = 'Dynamic Map: National Land Cover Dataset'
fig = figure(tools='wheel_zoom,pan', title=title)
fig.x_range = Range1d(start=-15473429, end=2108550)
fig.y_range = Range1d(start=-6315661, end=7264686)
fig.background_fill_color = "black"
fig.axis.visible = False

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

fig.add_tile(STAMEN_TONER)
fig.add_dynamic_image(image_source)
fig.add_tile(STAMEN_TONER_LABELS, render_parents=False)

show(fig)
