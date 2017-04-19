from __future__ import print_function

from bokeh.util.browser import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Circle
from bokeh.models import (
    GMapPlot, Range1d, ColumnDataSource, PanTool, WheelZoomTool, BoxSelectTool, GMapOptions,
    LinearAxis, MercatorTickFormatter, MercatorTicker, Label)
from bokeh.resources import INLINE

x_range = Range1d()
y_range = Range1d()

# JSON style string taken from: https://snazzymaps.com/style/1/pale-dawn
map_options = GMapOptions(lat=30.2861, lng=-97.7394, map_type="roadmap", zoom=13, styles="""
[{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"on"},{"lightness":33}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2e5d4"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#c5dac6"}]},{"featureType":"poi.park","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":20}]},{"featureType":"road","elementType":"all","stylers":[{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#c5c6c6"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#e4d7c6"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#fbfaf7"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"color":"#acbcc9"}]}]
""")

# Google Maps now requires an API key. You can find out how to get one here:
# https://developers.google.com/maps/documentation/javascript/get-api-key
API_KEY = "GOOGLE_API_KEY"

plot = GMapPlot(
    x_range=x_range, y_range=y_range,
    map_options=map_options,
    api_key=API_KEY,
)

if plot.api_key == "GOOGLE_API_KEY":
    plot.add_layout(Label(x=140, y=400, x_units='screen', y_units='screen',
                          text='Replace GOOGLE_API_KEY with your own key',
                          text_color='red'))

plot.title.text = "Austin"

source = ColumnDataSource(
    data=dict(
        lat=[30.2861, 30.2855, 30.2869],
        lon=[-97.7394, -97.7390, -97.7405],
        fill=['orange', 'blue', 'green']
    )
)

circle = Circle(x="lon", y="lat", size=15, fill_color="fill", line_color="black")
plot.add_glyph(source, circle)

pan = PanTool()
wheel_zoom = WheelZoomTool()
box_select = BoxSelectTool()

plot.add_tools(pan, wheel_zoom, box_select)

xformatter = MercatorTickFormatter(dimension="lon")
xticker = MercatorTicker(dimension="lon")
xaxis = LinearAxis(formatter=xformatter, ticker=xticker)
plot.add_layout(xaxis, 'below')

yformatter = MercatorTickFormatter(dimension="lat")
yticker = MercatorTicker(dimension="lat")
yaxis = LinearAxis(formatter=yformatter, ticker=yticker)
plot.add_layout(yaxis, 'left')

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "maps.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps Example"))
    print("Wrote %s" % filename)
    view(filename)
