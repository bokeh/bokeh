from __future__ import print_function

import time
from math import pi

import requests
from requests.exceptions import ConnectionError

import pandas as pd

from bokeh.objects import (Plot, ColumnDataSource, DataRange1d, FactorRange,
    LinearAxis, CategoricalAxis, Grid, Glyph, Legend, SingleIntervalTicker, HoverTool)
from bokeh.widgetobjects import Select, HBox, VBox
from bokeh.glyphs import Line, Quad
from bokeh.document import Document
from bokeh.session import Session
from bokeh.sampledata.population import load_population

document = Document()
session = Session()
session.use_doc('population_server')
session.load_document(document)

df = load_population()
revision = 2012

year = 2010
location = "World"

years = list(map(str, sorted(df.Year.unique())))
locations = sorted(df.Location.unique())

source_pyramid = ColumnDataSource(data=dict())

def pyramid():
    xdr = DataRange1d(sources=[source_pyramid.columns("male"), source_pyramid.columns("female")])
    ydr = DataRange1d(sources=[source_pyramid.columns("groups")])

    plot = Plot(title=None, data_sources=[source_pyramid], x_range=xdr, y_range=ydr, plot_width=600, plot_height=600)

    xaxis = LinearAxis(plot=plot)
    plot.below.append(xaxis)
    yaxis = LinearAxis(plot=plot, ticker=SingleIntervalTicker(interval=5))
    plot.left.append(yaxis)

    xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker)
    ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)

    male_quad = Quad(left="male", right=0, bottom="groups", top="shifted", fill_color="#3B8686")
    male_quad_glyph = Glyph(data_source=source_pyramid, xdata_range=xdr, ydata_range=ydr, glyph=male_quad)
    plot.renderers.append(male_quad_glyph)

    female_quad = Quad(left=0, right="female", bottom="groups", top="shifted", fill_color="#CFF09E")
    female_quad_glyph = Glyph(data_source=source_pyramid, xdata_range=xdr, ydata_range=ydr, glyph=female_quad)
    plot.renderers.append(female_quad_glyph)

    legend = Legend(plot=plot, legends=dict(Male=[male_quad_glyph], Female=[female_quad_glyph]))
    plot.renderers.append(legend)

    return plot

source_known = ColumnDataSource(data=dict(x=[], y=[]))
source_predicted = ColumnDataSource(data=dict(x=[], y=[]))

def population():
    xdr = FactorRange(factors=years)
    ydr = DataRange1d(sources=[source_known.columns("y"), source_predicted.columns("y")])

    plot = Plot(title=None, data_sources=[source_known, source_predicted], x_range=xdr, y_range=ydr, plot_width=800, plot_height=200)

    xaxis = CategoricalAxis(plot=plot, major_label_orientation=pi/4)
    plot.below.append(xaxis)

    line_known = Line(x="x", y="y", line_color="violet", line_width=2)
    line_known_glyph = Glyph(data_source=source_known, xdata_range=xdr, ydata_range=ydr, glyph=line_known)
    plot.renderers.append(line_known_glyph)

    line_predicted = Line(x="x", y="y", line_color="violet", line_width=2, line_dash="dashed")
    line_predicted_glyph = Glyph(data_source=source_predicted, xdata_range=xdr, ydata_range=ydr, glyph=line_predicted)
    plot.renderers.append(line_predicted_glyph)

    legend = Legend(plot=plot, orientation="bottom_right", legends=dict(known=[line_known_glyph], predicted=[line_predicted_glyph]))
    plot.renderers.append(legend)

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
    session.store_document(document)

def on_year_change(obj, attr, old, new):
    global year
    year = int(new)
    update_data()

def on_location_change(obj, attr, old, new):
    global location
    location = new
    update_data()

def layout():
    year_select = Select(title="Year:", value="2010", options=years)
    location_select = Select(title="Location:", value="World", options=locations)

    year_select.on_change('value', on_year_change)
    location_select.on_change('value', on_location_change)

    controls = HBox(children=[year_select, location_select])
    layout = VBox(children=[controls, pyramid(), population()])

    return layout

document.add(layout())
update_data()

if __name__ == "__main__":
    link = session.object_link(document._plotcontext)
    print("Please visit %s to see the plots" % link)

    try:
        while True:
            session.load_document(document)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print()
    except ConnectionError:
        print("Connection to bokeh-server was terminated")
