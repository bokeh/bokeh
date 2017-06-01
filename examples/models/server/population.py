from __future__ import print_function

from math import pi

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models.glyphs import Line, HBar
from bokeh.models import (Plot, ColumnDataSource, DataRange1d, FactorRange,
                          LinearAxis, CategoricalAxis, Grid, Legend, CategoricalScale)
from bokeh.sampledata.population import load_population
from bokeh.models.widgets import Select
from bokeh.models.layouts import WidgetBox, Column

document = Document()
session = push_session(document)

df = load_population()
revision = 2012

year, location = 2010, "World"

years = [str(x) for x in sorted(df.Year.unique())]
locations = sorted(df.Location.unique())
groups =  [str(x) for x in df.AgeGrp.unique()]
groups.remove('80+') # remove oddball group

source_pyramid_m = ColumnDataSource(data=dict(value=[], group=[]))
source_pyramid_f = ColumnDataSource(data=dict(value=[], group=[]))

def pyramid():
    xdr = DataRange1d()
    ydr = FactorRange(factors=groups)
    y_scale = CategoricalScale()

    plot = Plot(x_range=xdr, y_range=ydr, y_scale=y_scale, plot_width=600, plot_height=500, toolbar_location=None)

    xaxis = LinearAxis()
    plot.add_layout(xaxis, 'below')
    plot.add_layout(CategoricalAxis(), 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))

    m = HBar(left="value", right=0, y="group", height=1, fill_color="#3B8686")
    mglyph = plot.add_glyph(source_pyramid_m, m)

    f = HBar(left=0, right="value", y="group", height=1, fill_color="#CFF09E")
    fglyph = plot.add_glyph(source_pyramid_f, f)

    plot.add_layout(Legend(items=[("Male" , [mglyph]), ("Female" , [fglyph])]))

    return plot

source_known = ColumnDataSource(data=dict(x=[], y=[]))
source_predicted = ColumnDataSource(data=dict(x=[], y=[]))

def population():
    xdr = FactorRange(factors=years)
    ydr = DataRange1d()
    x_scale = CategoricalScale()

    plot = Plot(x_range=xdr, y_range=ydr, x_scale=x_scale, plot_width=600, plot_height=150, toolbar_location=None)

    plot.add_layout(CategoricalAxis(major_label_orientation=pi / 4), 'below')

    known = Line(x="x", y="y", line_color="violet", line_width=2)
    known_glyph = plot.add_glyph(source_known, known)

    predicted = Line(x="x", y="y", line_color="violet", line_width=2, line_dash="dashed")
    predicted_glyph = plot.add_glyph(source_predicted, predicted)

    legend = Legend(location="bottom_right",
                    items=[("known", [known_glyph]), ("predicted", [predicted_glyph])])
    plot.add_layout(legend)

    return plot

def update_pyramid():
    pyramid = df[(df.Location == location) & (df.Year == year)]

    male = pyramid[pyramid.Sex == "Male"]
    female = pyramid[pyramid.Sex == "Female"]

    total = df.Value.sum()
    male_percent = -male.Value / total
    female_percent = female.Value / total

    source_pyramid_m.data = dict(
        group=[str(x) for x in male.AgeGrp.unique()],
        value=male_percent,
    )
    source_pyramid_f.data = dict(
        group=[str(x) for x in female.AgeGrp.unique()],
        value=female_percent,
    )

def update_population():
    population = df[df.Location == location].groupby(df.Year).Value.sum()
    aligned_revision = revision // 10 * 10

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
    document.validate()
    print("\npress ctrl-C to exit")
    session.loop_until_closed()
