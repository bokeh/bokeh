# -*- coding: utf-8 -*-

import time
from threading import Thread

import numpy as np
import scipy.special

from bokeh.embed import autoload_server
from bokeh.objects import Glyph
from bokeh.plotting import (annular_wedge, curplot, cursession, figure, hold,
                            legend, line, output_server, quad, xgrid, ygrid)

from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def render_plot():
    distribution_plot = distribution()
    tag1, id1 = make_snippet("plot", distribution_plot[0], distribution_plot[1])

    animated_plot = animated()
    tag2, id2 = make_snippet("animated", animated_plot[0], animated_plot[1], update_animation)

    tag3, id3 = make_snippet("widget", pop.layout, pop.session, update_population)

    return render_template('app_plot.html',
                           tag1=tag1, id1=id1,
                           tag2=tag2, id2=id2,
                           tag3=tag3, id3=id3)


def make_snippet(kind, plot, session=None, target=None):
    if kind == "plot":
        tag = autoload_server(plot, session)
        thread = Thread()
        thread.start()
    if kind == "animated":
        tag = autoload_server(plot, session)
        thread = Thread(target=target, args=(plot, session))
        thread.start()
    elif kind == "widget":
        tag = autoload_server(plot, session)
        thread = Thread(target=target, args=(pop,))
        thread.start()

    return tag, plot._id


def distribution():

    mu, sigma = 0, 0.5

    measured = np.random.normal(mu, sigma, 1000)
    hist, edges = np.histogram(measured, density=True, bins=20)

    x = np.linspace(-2, 2, 1000)
    pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(x - mu) ** 2 / (2 * sigma ** 2))
    cdf = (1 + scipy.special.erf((x - mu) / np.sqrt(2 * sigma ** 2))) / 2

    output_server("distribution_reveal")

    hold()

    figure(title="Interactive plots",
           tools="pan, wheel_zoom, box_zoom, reset, previewsave",
           background_fill="#E5E5E5")
    quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
         fill_color="#333333", line_color="#E5E5E5", line_width=3)

    # Use `line` renderers to display the PDF and CDF
    line(x, pdf, line_color="#348abd", line_width=8, alpha=0.7, legend="PDF")
    line(x, cdf, line_color="#7a68a6", line_width=8, alpha=0.7, legend="CDF")

    xgrid().grid_line_color = "white"
    xgrid().grid_line_width = 3
    ygrid().grid_line_color = "white"
    ygrid().grid_line_width = 3

    legend().orientation = "top_left"

    return curplot(), cursession()


def animated():

    from numpy import pi, cos, sin, linspace, zeros_like

    N = 50 + 1
    r_base = 8
    theta = linspace(0, 2 * pi, N)
    r_x = linspace(0, 6 * pi, N - 1)
    rmin = r_base - cos(r_x) - 1
    rmax = r_base + sin(r_x) + 1

    colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8",
              "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

    cx = cy = zeros_like(rmin)

    output_server("animated_reveal")

    figure(title="Animations")

    hold()

    annular_wedge(
        cx, cy, rmin, rmax, theta[:-1], theta[1:],
        x_range=[-11, 11],
        y_range=[-11, 11],
        inner_radius_units="data",
        outer_radius_units="data",
        fill_color=colors,
        line_color="black",
        tools="pan,wheel_zoom,box_zoom,reset,previewsave"
    )

    return curplot(), cursession()


def update_animation(plot, session):

    from numpy import pi, linspace, roll

    renderer = [r for r in plot.renderers if isinstance(r, Glyph)][0]
    ds = renderer.data_source

    while True:
        for i in linspace(-2 * pi, 2 * pi, 50):
            rmin = ds.data["inner_radius"]
            rmin = roll(rmin, 1)
            ds.data["inner_radius"] = rmin
            rmax = ds.data["outer_radius"]
            rmax = roll(rmax, -1)
            ds.data["outer_radius"] = rmax
            ds._dirty = True
            session.store_objects(ds)
            time.sleep(.10)


class Population(object):

    year = 2010
    location = "World"

    def __init__(self):
        from bokeh.objects import ColumnDataSource
        from bokeh.document import Document
        from bokeh.session import Session
        from bokeh.sampledata.population import load_population

        self.document = Document()
        self.session = Session()
        self.session.use_doc('population_reveal')
        self.session.load_document(self.document)

        self.df = load_population()
        self.source_pyramid = ColumnDataSource(data=dict())

    def render(self):
        self.pyramid_plot()
        self.create_layout()
        self.document.add(self.layout)
        self.update_pyramid()

    def pyramid_plot(self):
        from bokeh.objects import (Plot, DataRange1d, LinearAxis, Grid, Glyph,
                                   Legend, SingleIntervalTicker)
        from bokeh.glyphs import Quad

        xdr = DataRange1d(sources=[self.source_pyramid.columns("male"),
                                   self.source_pyramid.columns("female")])
        ydr = DataRange1d(sources=[self.source_pyramid.columns("groups")])

        self.plot = Plot(title="Widgets", data_sources=[self.source_pyramid],
                         x_range=xdr, y_range=ydr, plot_width=600, plot_height=600)

        xaxis = LinearAxis(plot=self.plot, dimension=0)
        yaxis = LinearAxis(plot=self.plot, dimension=1, ticker=SingleIntervalTicker(interval=5))

        xgrid = Grid(plot=self.plot, dimension=0, axis=xaxis)
        ygrid = Grid(plot=self.plot, dimension=1, axis=yaxis)

        male_quad = Quad(left="male", right=0, bottom="groups", top="shifted", fill_color="blue")
        male_quad_glyph = Glyph(data_source=self.source_pyramid,
                                xdata_range=xdr, ydata_range=ydr, glyph=male_quad)
        self.plot.renderers.append(male_quad_glyph)

        female_quad = Quad(left=0, right="female", bottom="groups", top="shifted",
                           fill_color="violet")
        female_quad_glyph = Glyph(data_source=self.source_pyramid,
                                  xdata_range=xdr, ydata_range=ydr, glyph=female_quad)
        self.plot.renderers.append(female_quad_glyph)

        legend = Legend(plot=self.plot, legends=dict(Male=[male_quad_glyph],
                        Female=[female_quad_glyph]))
        self.plot.renderers.append(legend)

    def on_year_change(self, obj, attr, old, new):
        self.year = int(new)
        self.update_pyramid()

    def on_location_change(self, obj, attr, old, new):
        self.location = new
        self.update_pyramid()

    def create_layout(self):
        from bokeh.widgetobjects import Select, HBox, VBox

        years = list(map(str, sorted(self.df.Year.unique())))
        locations = sorted(self.df.Location.unique())

        year_select = Select(title="Year:", value="2010", options=years)
        location_select = Select(title="Location:", value="World", options=locations)

        year_select.on_change('value', self.on_year_change)
        location_select.on_change('value', self.on_location_change)

        controls = HBox(children=[year_select, location_select])
        self.layout = VBox(children=[controls, self.plot])

    def update_pyramid(self):
        pyramid = self.df[(self.df.Location == self.location) & (self.df.Year == self.year)]

        male = pyramid[pyramid.Sex == "Male"]
        female = pyramid[pyramid.Sex == "Female"]

        total = male.Value.sum() + female.Value.sum()

        male_percent = -male.Value / total
        female_percent = female.Value / total

        groups = male.AgeGrpStart.tolist()
        shifted = groups[1:] + [groups[-1] + 5]

        self.source_pyramid.data = dict(
            groups=groups,
            shifted=shifted,
            male=male_percent,
            female=female_percent,
        )
        self.session.store_document(self.document)


def update_population(pop):
    while True:
        pop.session.load_document(pop.document)
        time.sleep(0.5)

if __name__ == '__main__':
    pop = Population()
    pop.render()
    app.run(debug=True)
