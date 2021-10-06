''' A map plot using `Google search interest data` to follow the path of an
eclipse across the United States. This example demonstrates using a
``LinearColorMapper`` and a color bar.

.. bokeh-example-metadata::
    :sampledata: us_states
    :apis: bokeh.plotting.Figure.patches, bokeh.models.sources.ColumnDataSource, bokeh.models.mappers.LinearColorMapper, bokeh.models.annotations.ColorBar
    :refs: :ref:`userguide_annotations` > :ref:`userguide_annotations_color_bars`
    :keywords: colorbar, label, map, patches

.. _Google search interest data: https://www.reddit.com/r/dataisbeautiful/comments/6qnkg0/google_search_interest_follows_the_path_of_the/

'''
from os.path import dirname, join, realpath

import pandas as pd
import shapefile as shp

from bokeh.models import ColorBar, ColumnDataSource, Label, LinearColorMapper
from bokeh.palettes import YlOrRd5
from bokeh.plotting import figure, show
from bokeh.sampledata.us_states import data

ROOT = dirname(realpath(__file__))

states = pd.DataFrame.from_dict(data, orient="index")
states.drop(["AK", "HI"], inplace=True)

trends = pd.read_csv(join(ROOT, "eclipse_data/trends.csv"))

states.set_index("name", inplace=True)
trends.set_index("Region", inplace=True)

states["trend"] = trends["solar eclipse"]

upath17 = shp.Reader(join(ROOT, "eclipse_data/upath17"))
(totality_path,) = upath17.shapes()

p = figure(width=1000, height=600, background_fill_color="#333344",
           tools="", toolbar_location=None, x_axis_location=None, y_axis_location=None)

p.grid.grid_line_color = None

p.title.text = "Google Search Trends and the Path of Solar Eclipse, 21 August 2017"
p.title.align = "center"
p.title.text_font_size = "21px"
p.title.text_color = "#333344"

mapper = LinearColorMapper(palette=list(reversed(YlOrRd5)), low=0, high=100)

source = ColumnDataSource(data=dict(
    state_xs=list(states.lons),
    state_ys=list(states.lats),
    trend=states.trend,
))
us = p.patches("state_xs", "state_ys",
    fill_color=dict(field="trend", transform=mapper),
    source=source,
    line_color="#333344", line_width=1)

p.x_range.renderers = [us]
p.y_range.renderers = [us]

totality_x, totality_y = zip(*totality_path.points)
p.patch(totality_x, totality_y,
    fill_color="black", fill_alpha=0.7,
    line_color=None)

path = Label(
    x=-76.3, y=31.4,
    angle=-36.5, angle_units="deg",
    text="Solar eclipse path of totality",
    text_baseline="middle", text_font_size="11px", text_color="silver")
p.add_layout(path)

color_bar = ColorBar(
    color_mapper=mapper,
    location="bottom_left", orientation="horizontal",
    title="Popularity of \"solar eclipse\" search term",
    title_text_font_size="16px", title_text_font_style="bold",
    title_text_color="lightgrey", major_label_text_color="lightgrey",
    background_fill_alpha=0.0)
p.add_layout(color_bar)

notes = Label(
    x=0, y=0, x_units="screen", y_units="screen",
    x_offset=40, y_offset=20,
    text="Source: Google Trends, NASA Scientific Visualization Studio",
    level="overlay",
    text_font_size="11px", text_color="gray")
p.add_layout(notes)

show(p)
