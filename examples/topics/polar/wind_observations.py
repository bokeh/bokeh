''' Explore synthetic wind observations by direction, speed, temperature, and gust strength.

Bearings run clockwise from north. Color shows temperature and marker size
shows the gust increment above the sustained speed. The observations are
synthetic and use a fixed random seed.

.. bokeh-example-metadata::
    :title: Polar wind observations
    :keywords: polar, scatter, wind, compass, color mapping, hover
    :apis: bokeh.models.PolarMapping, bokeh.models.PolarAxis, bokeh.models.HoverTool, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_polar`
    :gallery: Colored wind observations cluster around compass directions on a polar speed grid beside a temperature color bar.

'''
from datetime import datetime, timedelta

import numpy as np

from bokeh.models import (
    ColumnDataSource,
    CustomJSTickFormatter,
    FixedTicker,
    HoverTool,
    PolarAxis,
    PolarMapping,
    Range1d,
)
from bokeh.palettes import Turbo256
from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap

rng = np.random.default_rng(23)
n = 300
bearing = (rng.choice([225, 315, 65], n, p=[0.52, 0.36, 0.12]) + rng.normal(0, 20, n)) % 360
speed = np.clip(rng.weibull(2.1, n)*6 + 0.6, 0, 15.7)
temperature = np.clip(17 + 4*np.sin(np.deg2rad(bearing)) + rng.normal(0, 1.5, n), 9, 25)
gust = speed + rng.uniform(0.5, 5, n)
source = ColumnDataSource(dict(
    bearing=bearing, speed=speed, temperature=temperature, gust=gust,
    size=5 + (gust - speed)*1.3,
    time=[datetime(2026, 10, 1) + timedelta(minutes=10*i) for i in range(n)],
))

p = figure(
    title="Synthetic wind observations",
    width=620, height=530,
    coordinate_system=PolarMapping(radial_range=Range1d(0, 16), zero_direction="north", direction="clock"),
    tools="pan,wheel_zoom,box_select,lasso_select,tap,reset,save",
    active_scroll="wheel_zoom",
    background_fill_color="#fbfcfe",
)
color = linear_cmap("temperature", Turbo256, low=9, high=25)
markers = p.scatter(radius="speed", angle="bearing", source=source, size="size",
                    fill_color=color, fill_alpha=0.76, line_color="white", line_width=0.65)
p.add_layout(markers.construct_color_bar(title="Temperature (°C)", width=12), "right")
p.add_tools(HoverTool(renderers=[markers], tooltips=[
    ("Observed", "@time{%a %H:%M}"),
    ("Direction", "@bearing{0}°"),
    ("Speed", "@speed{0.0} m/s"),
    ("Gust", "@gust{0.0} m/s"),
    ("Temperature", "@temperature{0.0} °C"),
], formatters={"@time": "datetime"}))

angular_axis = next(axis for axis in p.select(PolarAxis)
                    if isinstance(axis, PolarAxis) and axis.dimension == "angular")
angular_axis.ticker = FixedTicker(ticks=list(range(0, 360, 45)))
angular_axis.formatter = CustomJSTickFormatter(code="""
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(tick/45) % 8]
""")

show(p)
