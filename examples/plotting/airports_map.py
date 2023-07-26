'''This example shows the same data on two separate tile plots.
The left plot uses the built-in CartoDB tile source, and the right plot uses
a customized tile source configured for OpenStreetMap.

.. bokeh-example-metadata::
    :sampledata: airports
    :apis: bokeh.plotting.figure.add_tile, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_geo_geojson_data`, :ref:`ug_topics_geo_tile_provider_maps`
    :keywords: tile, map, field, elevation, geo

'''
from bokeh.layouts import column, gridplot
from bokeh.models import Div, Range1d, TileSource, WMTSTileSource
from bokeh.plotting import figure, show
from bokeh.sampledata.airports import data as airports

title = "US Airports: Field Elevation > 1500m"

def plot(tile_source: TileSource):
    # set to roughly extent of points
    x_range = Range1d(start=airports['x'].min() - 10000, end=airports['x'].max() + 10000, bounds=None)
    y_range = Range1d(start=airports['y'].min() - 10000, end=airports['y'].max() + 10000, bounds=None)

    # create plot and add tools
    p = figure(tools='hover,wheel_zoom,pan,reset', x_range=x_range, y_range=y_range, title=title,
               tooltips=[("Name", "@name"), ("Elevation", "@elevation (m)")],
               width=400, height=400)
    p.axis.visible = False
    p.add_tile(tile_source)

    # create point glyphs
    p.scatter(x='x', y='y', size=10, fill_color="#F46B42", line_color="white", line_width=2, source=airports)
    return p

# create a tile source
mq_tile_source = WMTSTileSource(
    url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png",
    extra_url_vars=dict(r=""), # or "@2x" for 2x scaled (Retina) images
    attribution="""
&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>
&copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>
&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>
&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>
""",
)

carto = plot("CartoDB Positron")
mq = plot(mq_tile_source)

# link panning
mq.x_range = carto.x_range
mq.y_range = carto.y_range

div = Div(text="""
<p>This example shows the same data on two separate tile plots.
The left plot uses the built-in CartoDB tile source, and the right plot uses
a customized tile source configured for OpenStreetMap.</p>
""", width=800)

layout = column(div, gridplot([[carto, mq]], toolbar_location="right"))

show(layout)
