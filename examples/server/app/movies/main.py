''' An interactivate categorized chart based on a movie dataset.
This example shows the ability of Bokeh to create a dashboard with different
sorting options based on a given dataset.

'''
import sqlite3 as sql
from os.path import dirname, join
from pathlib import Path

import numpy as np
import pandas.io.sql as psql

from bokeh.io import curdoc
from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Div, Select, Slider, TextInput
from bokeh.plotting import figure
from bokeh.sampledata.movies_data import movie_path

conn = sql.connect(movie_path)
query = (Path(__file__).parent / 'query.sql').read_text("utf8")
movies = psql.read_sql(query, conn)

movies["color"] = np.where(movies["Oscars"] > 0, "orange", "grey")
movies["alpha"] = np.where(movies["Oscars"] > 0, 0.9, 0.25)
movies.fillna(0, inplace=True)  # just replace missing values with zero
movies["revenue"] = movies.BoxOffice.apply(lambda x: f"{int(x)}")

with open(join(dirname(__file__), "razzies-clean.csv")) as f:
    razzies = f.read().splitlines()
movies.loc[movies.imdbID.isin(razzies), "color"] = "purple"
movies.loc[movies.imdbID.isin(razzies), "alpha"] = 0.9

axis_map = {
    "Tomato Meter": "Meter",
    "Numeric Rating": "numericRating",
    "Number of Reviews": "Reviews",
    "Box Office (dollars)": "BoxOffice",
    "Length (minutes)": "Runtime",
    "Year": "Year",
}

desc = Div(text=(Path(__file__).parent / "description.html").read_text("utf8"), sizing_mode="stretch_width")

# Create Input controls
reviews = Slider(title="Minimum number of reviews", value=80, start=10, end=300, step=10)
min_year = Slider(title="Year released", start=1940, end=2014, value=1970, step=1)
max_year = Slider(title="End Year released", start=1940, end=2014, value=2014, step=1)
oscars = Slider(title="Minimum number of Oscar wins", start=0, end=4, value=0, step=1)
boxoffice = Slider(title="Dollars at Box Office (millions)", start=0, end=800, value=0, step=1)
genre = Select(title="Genre", value="All",
               options=(Path(__file__).parent / 'genres.txt').read_text("utf8").split())
director = TextInput(title="Director name contains")
cast = TextInput(title="Cast names contains")
x_axis = Select(title="X Axis", options=sorted(axis_map.keys()), value="Tomato Meter")
y_axis = Select(title="Y Axis", options=sorted(axis_map.keys()), value="Number of Reviews")

# Create Column Data Source that will be used by the plot
source = ColumnDataSource(data=dict(x=[], y=[], color=[], title=[], year=[], revenue=[], alpha=[]))

TOOLTIPS=[
    ("Title", "@title"),
    ("Year", "@year"),
    ("$", "@revenue"),
]

p = figure(height=600, title="", toolbar_location=None, tooltips=TOOLTIPS, sizing_mode="stretch_width")
p.scatter(x="x", y="y", source=source, size=7, color="color", line_color=None, fill_alpha="alpha")


def select_movies():
    genre_val = genre.value
    director_val = director.value.strip()
    cast_val = cast.value.strip()
    selected = movies[
        (movies.Reviews >= reviews.value) &
        (movies.BoxOffice >= (boxoffice.value * 1e6)) &
        (movies.Year >= min_year.value) &
        (movies.Year <= max_year.value) &
        (movies.Oscars >= oscars.value)
    ]
    if (genre_val != "All"):
        selected = selected[selected.Genre.str.contains(genre_val)]
    if (director_val != ""):
        selected = selected[selected.Director.str.contains(director_val)]
    if (cast_val != ""):
        selected = selected[selected.Cast.str.contains(cast_val)]
    return selected


def update():
    df = select_movies()
    x_name = axis_map[x_axis.value]
    y_name = axis_map[y_axis.value]

    p.xaxis.axis_label = x_axis.value
    p.yaxis.axis_label = y_axis.value
    p.title.text = f"{len(df)} movies selected"
    source.data = dict(
        x=df[x_name],
        y=df[y_name],
        color=df["color"],
        title=df["Title"],
        year=df["Year"],
        revenue=df["revenue"],
        alpha=df["alpha"],
    )

controls = [reviews, boxoffice, genre, min_year, max_year, oscars, director, cast, x_axis, y_axis]
for control in controls:
    control.on_change('value', lambda attr, old, new: update())

inputs = column(*controls, width=320, height=800)

layout = column(desc, row(inputs, p, sizing_mode="inherit"), sizing_mode="stretch_width", height=800)

update()  # initial load of the data

curdoc().add_root(layout)
curdoc().title = "Movies"
