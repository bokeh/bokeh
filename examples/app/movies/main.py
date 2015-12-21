from bokeh.plotting import Figure
from bokeh.models import ColumnDataSource, HoverTool
from bokeh.models.widgets import HBox, Slider, TextInput, VBoxForm, Select, TextInput, Paragraph, PreText
from bokeh.io import curdoc
from bokeh.sampledata.movies_data import movie_path
import pandas as pd
import numpy as np
import pandas.io.sql as psql
import sqlite3 as sql

# To get the movies sample data execute the following from a python prompt
#   >>> import bokeh.sampledata
#   >>> bokeh.sampledata.download()

con = sql.connect(movie_path)
movies = psql.read_sql('select omdb.ID, imdbID, Title, Year, omdb.Rating, Runtime, Genre, Released, \
    Director, Writer, imdbRating, imdbVotes, Language, Country, Oscars, \
    tomatoes.Rating, Meter, Reviews, Fresh, Rotten, userMeter, userRating, userReviews, \
    BoxOffice, Production \
    from omdb, tomatoes \
    where omdb.ID = tomatoes.ID \
    and Reviews >= 10', con)

movies["has_oscars"] = movies["Oscars"] > 0
movies["pt_color"] = np.where(movies["Oscars"] > 0, "orange", "grey")
movies.rename(columns={'Rating_right':'Rating'}, inplace=True)
# Replace missing BoxOffice values with zeroes
# and then format with commas so easier to read.
movies.fillna(0, inplace=True)
print("Movies.BoxOffice class: ", movies.BoxOffice.__class__)
print("BoxOffice: ", movies.BoxOffice[:20])
movies["revenue"] = movies.BoxOffice.apply(lambda x: '{:,d}'.format(int(x)))

# Dictionary to map axis selection drop down to column of data
axis_vars = {"Tomato Meter": "Meter",
             "Numeric Rating": "Rating",
             "Number of reviews":"Reviews",
             "Dollars at box office":"BoxOffice",
             "Year": "Year",
             "Length (minutes)":"Runtime"}

# Create Input controls
reviews = Slider(title="Minimum number of reviews on Rotten Tomatoes", value=80, start=10, end=300, step=10)
min_year = Slider(title="Year released", start=1940, end=2014, value=1970, step=1)
max_year = Slider(title="End Year released", start=1940, end=2014, value=2014, step=1)
oscars = Slider(title="Minimum number of Oscar wins (all categories)", start=0, end=4, value=0, step=1)
boxoffice = Slider(title="Dollars at Box Office (millions)", start=0, end=800, value=0, step=1)
genre = Select(title="Genre (a movie can have multiple genres)",
            options=["All", "Action", "Adventure", "Animation", "Biography", "Comedy",
            "Crime", "Documentary", "Drama", "Family", "Fantasy", "History",
            "Horror", "Music", "Musical", "Mystery", "Romance", "Sci-Fi",
            "Short", "Sport", "Thriller", "War", "Western"], value="All")
director = TextInput(title="Director name contains (e.g., Miyazaki)")
cast = TextInput(title="Cast names contains (e.g. Tom Hanks)")
x_axis = Select(title="X Axis", options=list(axis_vars.keys()), value="Tomato Meter")
y_axis = Select(title="Y Axis", options=list(axis_vars.keys()), value="Number of reviews")
# movie_count_txt = Paragraph(text="Number of selected movies: 0")
movie_count_txt = Paragraph(text="Number of selected movies: 0")

def select_movies():
    genre_choice = genre.value
    director_entry = director.value.strip()
    cast_entry = cast.value.strip()
    selected = movies[(movies.Reviews >= reviews.value) &
                        (movies.BoxOffice >= (boxoffice.value * 1e6)) &
                        (movies.Year >= min_year.value) &
                        (movies.Year <= max_year.value) &
                        (movies.Oscars >= oscars.value) ]
    if (genre_choice != "All"):
        selected = selected[selected.Genre.str.contains(genre_choice)==True]
    if (director_entry != ""):
        selected = selected[selected.Director.str.contains(director_entry)==True]
    if (cast_entry != ""):
        selected = selected[selected.Cast.str.contains(cast_entry)==True]
    return selected

# Create Column Data Source that will be used by the plot
df = ColumnDataSource(data=dict(x="", y="", pt_color="", title="", year="", revenue=""))

hover = HoverTool(
        tooltips=[
            ("Title","@title"),
            ("Year", "@year"),
            ("$", "@revenue")
        ]
)

p = Figure(plot_height=600, plot_width=800, title="",
              toolbar_location=None, tools=[hover])
p.circle(x="x", y="y", source=df, size=6, color="pt_color", fill_alpha=0.2)
p.yaxis.axis_label = "Number of Reviews"
p.xaxis.axis_label = "Tomato Meter"

# Callback to update the plot when an input changes
def update_data(attrname, old, new):
    # Get the name of the variable selected from the Axis dropdowns
    print("----- in update_data")
    x_var = axis_vars[x_axis.value]
    y_var = axis_vars[y_axis.value]
    # Get data that meets criteria and update the plot
    new_df = select_movies()
    df.data = dict(x=new_df[x_var], y=new_df[y_var], pt_color=new_df["pt_color"], title=new_df["Title"], year=new_df["Year"], revenue=new_df["revenue"])
    p.xaxis.axis_label = x_axis.value
    p.yaxis.axis_label = y_axis.value

# Assign callback to variables. Currently using just a single callback.
for control in [reviews, boxoffice, genre, director, cast, min_year, max_year, oscars, x_axis, y_axis]:
    control.on_change('value', update_data)

# Initial load of the data so visibile on first display.
# Could have loaded the intial data when creating the ColumnDataSource.
update_data("", "", "")

# Place all inputs in a column. Use HBox to limit width of controls and
# set the hights so the controls will be closer together than default.
inputs=VBoxForm(children=[HBox(reviews, width=250, height=80),
                        HBox(min_year, width=250, height=50),
                        HBox(max_year, width=250, height=70),
                        HBox(oscars, width=250, height=90),
                        HBox(boxoffice, width=250, height=80),
                        HBox(genre, width=200, height=80),
                        HBox(director, width=200, height=90),
                        HBox(cast, width=200, height=90),
                        HBox(x_axis, width=150, height=60),
                        HBox(y_axis, width=150, height=60)])

plot_out=VBoxForm(children=[p, movie_count_txt])

# Add the inputs and plot to the document so they will be displayed.
curdoc().add(HBox(inputs, plot_out))
