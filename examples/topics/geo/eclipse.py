''' A map plot using `Google search interest data` to follow the path of an
eclipse across the United States. This example demonstrates using a
``LinearColorMapper`` and a color bar.

.. bokeh-example-metadata::
    :sampledata: us_states
    :apis: bokeh.plotting.figure.polygons, bokeh.models.sources.GeometryDataSource, bokeh.models.mappers.LinearColorMapper, bokeh.models.ColorBar
    :refs: :ref:`ug_basic_annotations_color_bars`
    :keywords: colorbar, label, map, patches

.. _Google search interest data: https://www.reddit.com/r/dataisbeautiful/comments/6qnkg0/google_search_interest_follows_the_path_of_the/

'''
from math import isfinite
from os.path import dirname, join, realpath

import pandas as pd
import shapefile as shp

from bokeh.models import Label
from bokeh.plotting import figure, show
from bokeh.sampledata.us_states import data
from bokeh.transform import linear_cmap

ROOT = dirname(realpath(__file__))

states = pd.DataFrame.from_dict(data, orient="index")
states.drop(["AK", "HI"], inplace=True)

trends = pd.read_csv(join(ROOT, "eclipse_data/trends.csv"))

df = states.merge(trends, left_on="name", right_on="Region")

totality_path = shp.Reader(join(ROOT, "eclipse_data/upath17")).shapes()[0]

p = figure(
    width=1000, height=600, background_fill_color="#333344",
    tools="", toolbar_location=None, x_axis_location=None, y_axis_location=None,
)

p.grid.grid_line_color = None

p.title.text = "Google Search Trends and the Path of Solar Eclipse, 21 August 2017"
p.title.align = "center"
p.title.text_font_size = "21px"
p.title.text_color = "#333344"

def geometry_from_nan_separated_xy(xs, ys):
    rings = []
    ring = []
    for x, y in zip(xs, ys):
        if isfinite(x) and isfinite(y):
            ring.append([x, y])
        elif ring:
            rings.append(ring)
            ring = []
    if ring:
        rings.append(ring)

    if len(rings) == 1:
        return {"type": "Polygon", "coordinates": rings}
    return {"type": "MultiPolygon", "coordinates": [[ring] for ring in rings]}

records = [
    {
        "geometry": geometry_from_nan_separated_xy(xs, ys),
        "trend": trend,
    }
    for xs, ys, trend in zip(df.lons, df.lats, df["solar eclipse"])
]

us = p.polygons(
    records,
    fill_color=linear_cmap("trend", palette="TolYlOrBr5", low=0, high=100),
    line_color="#333344", line_width=1,
)

p.x_range.renderers = p.y_range.renderers = [us]

totality = {"type": "Polygon", "coordinates": [[*totality_path.points]]}
p.polygons(
    totality,
    fill_color="black", fill_alpha=0.7, line_color=None,
)

p.add_layout(Label(
    text="Solar eclipse path of totality",
    x=-76.3, y=31.4, angle=-36.5, angle_units="deg",
    text_baseline="middle", text_font_size="11px", text_color="silver",
))

p.add_layout(us.construct_color_bar(
    title='Popularity of "solar eclipse" search term',
    location="bottom_left", orientation="horizontal",
    title_text_font_size="16px", title_text_font_style="bold",
    title_text_color="lightgrey", major_label_text_color="lightgrey",
    background_fill_alpha=0.0,
))

p.add_layout(Label(
    text="Source: Google Trends, NASA Scientific Visualization Studio",
    x=0, y=0, x_units="screen", y_units="screen", x_offset=40, y_offset=20,
    text_font_size="11px", text_color="gray", level="overlay",
))

show(p)
