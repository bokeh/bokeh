# Based on https://www.reddit.com/r/dataisbeautiful/comments/6qnkg0/google_search_interest_follows_the_path_of_the/

import shapefile as shp
import pandas as pd

from bokeh.plotting import figure, show
from bokeh.palettes import YlOrRd5
from bokeh.models import ColumnDataSource, LinearColorMapper, Label, ColorBar
from bokeh.sampledata.us_states import data

states = pd.DataFrame.from_dict(data, orient="index")
states.drop(["AK", "HI"], inplace=True)

trends = pd.read_csv("eclipse_data/trends.csv")

states.set_index("name", inplace=True)
trends.set_index("Region", inplace=True)

states["trend"] = trends["solar eclipse"]

upath17 = shp.Reader("eclipse_data/upath17")
(totality_path,) = upath17.shapes()

p = figure(plot_width=1000, plot_height=600)

p.grid.grid_line_color = None

p.title.text = "Google Search Trends and the Path of Solar Eclipse, 21 August 2017"
p.title.align = "center"
p.title.text_font_size = "16pt"

mapper = LinearColorMapper(palette=list(reversed(YlOrRd5)), low=0, high=100)

source = ColumnDataSource(data=dict(
    state_xs=list(states.lons),
    state_ys=list(states.lats),
    trend=states.trend,
))
us = p.patches("state_xs", "state_ys",
    fill_color=dict(field="trend", transform=mapper),
    source=source,
    line_color="white", line_width=1)

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
    text_baseline="middle", text_font_size="8pt", text_color="silver")
p.add_layout(path)

color_bar = ColorBar(
    color_mapper=mapper,
    location="bottom_left", orientation="horizontal",
    title="Popularity of \"solar eclipse\" search term",
    title_text_font_size="12pt", title_text_font_style="bold",
    background_fill_alpha=0.0)
p.add_layout(color_bar)

notes = Label(
    x=0, y=0, x_units="screen", y_units="screen",
    x_offset=40, y_offset=20,
    text="Source: Google Trends, NASA Scientific Visualization Studio",
    level="overlay",
    text_font_size="8pt", text_color="gray")
p.add_layout(notes)

show(p)
