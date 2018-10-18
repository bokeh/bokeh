from __future__ import print_function

from bokeh.layouts import column, gridplot
from bokeh.models import Div, Range1d, WMTSTileSource
from bokeh.plotting import figure, show
from bokeh.sampledata.airports import data as airports
from bokeh.tile_providers import CARTODBPOSITRON

title = "US Airports: Field Elevation > 1500m"

def plot(tile_source):

    # set to roughly extent of points
    x_range = Range1d(start=airports['x'].min() - 10000, end=airports['x'].max() + 10000, bounds=None)
    y_range = Range1d(start=airports['y'].min() - 10000, end=airports['y'].max() + 10000, bounds=None)

    # create plot and add tools
    p = figure(tools='hover,wheel_zoom,pan,reset', x_range=x_range, y_range=y_range, title=title,
               tooltips=[("Name", "@name"), ("Elevation", "@elevation (m)")],
               plot_width=400, plot_height=400)
    p.axis.visible = False
    p.add_tile(tile_source)

    # create point glyphs
    p.circle(x='x', y='y', size=10, fill_color="#F46B42", line_color="white", line_width=2, source=airports)
    return p

# create a tile source
tile_options = {}
tile_options['url'] = 'http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png'
tile_options['attribution'] = """
    Map tiles by <a href="http://stamen.com">Stamen Design</a>, under
    <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.
    Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,
    under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.
    """
mq_tile_source = WMTSTileSource(**tile_options)

carto = plot(CARTODBPOSITRON)
mq = plot(mq_tile_source)

# link panning
mq.x_range = carto.x_range
mq.y_range = carto.y_range

div = Div(text="""
<p>This example shows the same data on two separate tile plots. The left plot
is using a built-in CartoDB tile source, and is using  a customized tile source
configured for OpenStreetMap.</p>
""", width=800)

layout = column(div, gridplot([[carto, mq]], toolbar_location="right"))

show(layout)
