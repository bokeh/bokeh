''' Map measured airport winds, converting reported wind-from bearings into flow vectors.

Use a regional subset of a fixed global `NOAA METAR snapshot
<https://aviationweather.gov/data/api/>`__ from November 18, 2026.
Arrows show the direction the air moves and are scaled by speed. Calm and
variable-direction reports are omitted. Stations are spaced at least 90 km apart
for readability. No interpolation between stations is implied.

.. bokeh-example-metadata::
    :title: Measured winds in the Pacific Northwest
    :keywords: wind, vector field, map, METAR, bearings, Web Mercator
    :categories: topics/vector_fields, topics/geo
    :apis: bokeh.plotting.figure.arrow, bokeh.models.HoverTool, bokeh.models.NormalHead, bokeh.models.ScatterMarking
    :sampledata: us_states, wind_observations
    :gallery: Airport-code labels and wind arrows on a Pacific Northwest map, colored by wind speed.

'''
import numpy as np
from pyproj import Transformer

from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    LabelSet,
    NormalHead,
    ScatterMarking,
)
from bokeh.palettes import Viridis256
from bokeh.plotting import figure, show
from bokeh.sampledata.us_states import data as states
from bokeh.sampledata.wind_observations import data as observations
from bokeh.transform import linear_cmap

# Convert WGS84 longitude/latitude to Web Mercator meters.
mercator = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True).transform

# These stations are at least 90 km apart to keep the map readable.
stations = """
CWEL CWFJ CWJR CWLM CWPR CWYY CWZA K1YT K3W7 K4S1
K4S2 K63S K6S2 K7S0 K9S9 KALW KAST KAWO KBDN KBKE
KBNO KBOI KCLS KCOE KGNG KHIO KHRF KLKV KLLJ KLMT
KLWS KMFR KMYL KP69 KRBG KREO KS12 KUIL
""".split()
data = observations.loc[observations.station.isin(stations)].copy()
x, y = mercator(data.longitude, data.latitude)

# METAR reports the bearing wind comes from, clockwise from north.
angle = np.radians(data.direction)

# Web Mercator expands local distances by sec(latitude). Scale arrows consistently.
scale = 6500/np.cos(np.radians(data.latitude))

data['x'], data['y'] = x, y
data['x_end'] = x - scale*data.speed*np.sin(angle)
data['y_end'] = y - scale*data.speed*np.cos(angle)
source = ColumnDataSource(data)

x_range, y_range = mercator((-125, -113), (42, 49.5))

p = figure(width=900, height=660, x_range=x_range, y_range=y_range, match_aspect=True,
           x_axis_type="mercator", y_axis_type="mercator", tools="", toolbar_location=None,
           title="Observed airport winds · 18 November 2026 · speed in knots")
p.background_fill_color = "#e7f2f8"
p.grids.grid_line_alpha = 0.2

for code in ('WA', 'OR', 'ID', 'MT', 'CA', 'NV', 'UT', 'WY'):
    sx, sy = mercator(states[code]['lons'], states[code]['lats'])
    p.patch(sx, sy, fill_color="#f6f4ed", line_color="#a3b0b9", line_width=1)

color = linear_cmap('speed', Viridis256, low=0, high=20)
arrows = p.arrow(x_start='x', y_start='y', x_end='x_end', y_end='y_end', source=source, level="glyph",
                 line_color=color, line_width=2.5,
                 start=ScatterMarking(marker="circle", size=5, fill_color="#34485b", line_color=None),
                 end=NormalHead(size=9, fill_color=color, line_color=None))

p.add_layout(arrows.construct_color_bar(title="Wind speed (kt)"), "right")
p.add_layout(LabelSet(x='x', y='y', text='station', source=source, x_offset=5, y_offset=5,
                      text_font_size='9px', text_color='#34485b',
                      background_fill_color='#f6f4ed', background_fill_alpha=0.8))

p.add_tools(HoverTool(renderers=[arrows], tooltips=[
    ('station', '@station'), ('observed (UTC)', '@time{%H:%M}'),
    ('wind from', '@direction{0}°'), ('speed', '@speed{0} kt'),
], formatters={"@time": "datetime"}))

show(p)
