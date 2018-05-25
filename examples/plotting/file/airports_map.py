from __future__ import print_function

from bokeh.layouts import row
from bokeh.models import Range1d, WMTSTileSource
from bokeh.plotting import figure, show
from bokeh.sampledata.airports import data as airports
from bokeh.tile_providers import CARTODBPOSITRON

title = "US Airports: Field Elevation > 1500m"

def plot(tile_source):

    # set to roughly extent of points
    x_range = Range1d(start=airports['x'].min() - 10000, end=airports['x'].max() + 10000, bounds=None)
    y_range = Range1d(start=airports['y'].min() - 10000, end=airports['y'].max() + 10000, bounds=None)

    # create plot and add tools
    p = figure(tools='hover,wheel_zoom,pan', x_range=x_range, y_range=y_range, title=title,
               tooltips=[("Name", "@name"), ("Elevation", "@elevation (m)")])
    p.axis.visible = False
    p.add_tile(tile_source)

    # create point glyphs
    p.circle(x='x', y='y', size=9, fill_color="#F46B42", line_color="#D2C4C1", line_width=1.5, source=airports)
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

show(row([carto, mq]))
