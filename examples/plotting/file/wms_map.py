from bokeh.models import WMSImageSource, Range1d
from bokeh.plotting import figure, output_file, show

title = 'WMS Map: NOAA Weather Radar Map'
p = figure(tools='wheel_zoom,pan', title=title)
p.x_range = Range1d(start=-15473429, end=2108550, bounds=None)
p.y_range = Range1d(start=-6315661, end=7264686, bounds=None)
p.background_fill_color = "black"
p.axis.visible = False

# National Land Cover Dataset (http://www.mrlc.gov/nlcd2011.php)
service_url = (
    "http://demo.boundlessgeo.com/geoserver/wms"
)
layers = 'topp:states'
crs = 'EPSG:3857'
image_source = WMSImageSource(url=service_url,
                              layers=layers,
                              crs=crs)

p.add_dynamic_image(image_source)

output_file('wms_map.html', title="wms_map.py example")
show(p)
