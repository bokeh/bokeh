""" To view this example, first start a Bokeh server:

    bokeh serve --allow-websocket-origin=localhost:8000

And then load the example into the Bokeh server by
running the script:

    python widget.py

in this directory. Finally, start a simple web server
by running:

    python -m SimpleHTTPServer  (python 2)

or

    python -m http.server  (python 3)

in this directory. Navigate to

    http://localhost:8000/widget.html

"""
from __future__ import print_function

import io

from numpy import pi

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.embed import autoload_server
from bokeh.layouts import row, column
from bokeh.models import (Plot, DataRange1d, LinearAxis, CategoricalAxis,
                          Legend, ColumnDataSource, Grid, Line,
                          HBar, Select, FactorRange)
from bokeh.sampledata.population import load_population

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

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=600, plot_height=500, toolbar_location=None)

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

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=600, plot_height=150, toolbar_location=None)

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

    controls = row(children=[year_select, location_select])
    layout = column(children=[controls, pyramid(), population()])

    return layout

layout = create_layout()

update_data()

html = """
<html>
    <head></head>
    <body>
        %s
    </body>
</html>
""" % autoload_server(layout, session_id=session.id)

with io.open("widget.html", mode='w+', encoding='utf-8') as f:
    f.write(html)

print(__doc__)

document.add_root(layout)

if __name__ == "__main__":
    print("\npress ctrl-C to exit")
    session.loop_until_closed()
