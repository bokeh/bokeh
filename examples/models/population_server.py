from __future__ import print_function

from math import pi

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models.glyphs import Line, Quad
from bokeh.models import (
    Plot, ColumnDataSource, DataRange1d, FactorRange,
    LinearAxis, CategoricalAxis, Grid, Legend,
    SingleIntervalTicker
)
from bokeh.sampledata.population import load_population
from bokeh.models.widgets import Select
from bokeh.models.layouts import WidgetBox, Column

document = Document()
session = push_session(document)

df = load_population()
revision = 2012

year = 2010
location = "World"

years = [str(x) for x in sorted(df.Year.unique())]
locations = sorted(df.Location.unique())

source_pyramid = ColumnDataSource(data=dict())

def pyramid():
    xdr = DataRange1d()
    ydr = DataRange1d()

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=600, plot_height=500, toolbar_location=None)

    xaxis = LinearAxis()
    plot.add_layout(xaxis, 'below')
    yaxis = LinearAxis(ticker=SingleIntervalTicker(interval=5))
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

    male_quad = Quad(left="male", right=0, bottom="groups", top="shifted", fill_color="#3B8686")
    male_quad_glyph = plot.add_glyph(source_pyramid, male_quad)

    female_quad = Quad(left=0, right="female", bottom="groups", top="shifted", fill_color="#CFF09E")
    female_quad_glyph = plot.add_glyph(source_pyramid, female_quad)

    plot.add_layout(Legend(legends=[("Male", [male_quad_glyph]), ("Female", [female_quad_glyph])]))

    return plot

source_known = ColumnDataSource(data=dict(x=[], y=[]))
source_predicted = ColumnDataSource(data=dict(x=[], y=[]))

def population():
    xdr = FactorRange(factors=years)
    ydr = DataRange1d()

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=600, plot_height=150, toolbar_location=None)

    plot.add_layout(CategoricalAxis(major_label_orientation=pi/4), 'below')

    line_known = Line(x="x", y="y", line_color="violet", line_width=2)
    line_known_glyph = plot.add_glyph(source_known, line_known)

    line_predicted = Line(x="x", y="y", line_color="violet", line_width=2, line_dash="dashed")
    line_predicted_glyph = plot.add_glyph(source_predicted, line_predicted)

    plot.add_layout(
        Legend(
            location="bottom_right",
            legends=[("known", [line_known_glyph]), ("predicted", [line_predicted_glyph])],
        )
    )

    return plot

def update_pyramid():
    pyramid = df[(df.Location == location) & (df.Year == year)]

    male = pyramid[pyramid.Sex == "Male"]
    female = pyramid[pyramid.Sex == "Female"]

    total = male.Value.sum() + female.Value.sum()

    male_percent = -male.Value/total
    female_percent = female.Value/total

    groups = male.AgeGrpStart.tolist()
    shifted = groups[1:] + [groups[-1] + 5]

    source_pyramid.data = dict(
        groups=groups,
        shifted=shifted,
        male=male_percent,
        female=female_percent,
    )

def update_population():
    population = df[df.Location == location].groupby(df.Year).Value.sum()
    aligned_revision = revision//10 * 10

    known = population[population.index <= aligned_revision]
    predicted = population[population.index >= aligned_revision]

    source_known.data = dict(x=known.index.map(str), y=known.values)
    source_predicted.data = dict(x=predicted.index.map(str), y=predicted.values)

def update_data():
    update_population()
    update_pyramid()

def on_year_change(attr, old, new):
    global year
    year = int(new)
    update_data()

def on_location_change(attr, old, new):
    global location
    location = new
    update_data()

def create_layout():
    year_select = Select(title="Year:", value="2010", options=years)
    location_select = Select(title="Location:", value="World", options=locations)

    year_select.on_change('value', on_year_change)
    location_select.on_change('value', on_location_change)

    controls = WidgetBox(children=[year_select, location_select], height=150, width=600)
    layout = Column(children=[controls, pyramid(), population()])

    return layout

layout = create_layout()
update_data()

document.add_root(layout)
session.show(layout)

if __name__ == "__main__":
    print("\npress ctrl-C to exit")
    session.loop_until_closed()
