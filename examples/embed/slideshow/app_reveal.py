# -*- coding: utf-8 -*-
"""
In this example, we want to show you how you can take isolated blocks of code
(featuring different kinds of Bokeh visualizations) and rearrange them in a
bigger (encompassing) flask-based application without losing the independence
of each example. This is the reason of some weirdness through the code.
We are using this "building blocks" approach here because we believe it has some
conceptual advantages for people trying to quickly understand, and more
importantly, use the embed API, in a more complex way than just a simple script.
"""
import time
from threading import Thread

import numpy as np
import scipy.special

from bokeh.embed import autoload_server
from bokeh.models import GlyphRenderer
from bokeh.plotting import cursession, figure, output_server, push

from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def render_plot():
    """
    Get the script tags from each plot object and "insert" them into the template.

    This also starts different threads for each update function, so you can have
    a non-blocking update.
    """
    dist_plot, dist_session = distribution()
    dist_tag = autoload_server(dist_plot, dist_session)

    anim_plot, anim_session = animated()
    anim_tag = autoload_server(anim_plot, anim_session)
    # for update_animation as target we need to pass the anim_plot and anim_session as args
    thread = Thread(target=update_animation, args=(anim_plot, anim_session))
    thread.start()

    pop = Population()
    pop_tag = autoload_server(pop.layout, pop.session)
    # for update_population as target we need to pass the pop instance as args
    thread = Thread(target=update_population, args=(pop,))
    thread.start()

    return render_template('app_plot.html', tag1=dist_tag, tag2=anim_tag, tag3=pop_tag)


def distribution():

    mu, sigma = 0, 0.5

    measured = np.random.normal(mu, sigma, 1000)
    hist, edges = np.histogram(measured, density=True, bins=20)

    x = np.linspace(-2, 2, 1000)
    pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(x - mu) ** 2 / (2 * sigma ** 2))
    cdf = (1 + scipy.special.erf((x - mu) / np.sqrt(2 * sigma ** 2))) / 2

    output_server("distribution_reveal")

    p = figure(title="Interactive plots",
               background_fill="#E5E5E5")
    p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
           fill_color="#333333", line_color="#E5E5E5", line_width=3)

    # Use `line` renderers to display the PDF and CDF
    p.line(x, pdf, line_color="#348abd", line_width=8, alpha=0.7, legend="PDF")
    p.line(x, cdf, line_color="#7a68a6", line_width=8, alpha=0.7, legend="CDF")

    p.legend.orientation = "top_left"

    p.xaxis.axis_label = 'x'
    p.xgrid[0].grid_line_color = "white"
    p.xgrid[0].grid_line_width = 3

    p.yaxis.axis_label = 'Pr(x)'
    p.ygrid[0].grid_line_color = "white"
    p.ygrid[0].grid_line_width = 3

    push()

    return p, cursession()


def animated():

    from numpy import pi, cos, sin, linspace

    N = 50 + 1
    r_base = 8
    theta = linspace(0, 2 * pi, N)
    r_x = linspace(0, 6 * pi, N - 1)
    rmin = r_base - cos(r_x) - 1
    rmax = r_base + sin(r_x) + 1

    colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8",
              "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

    output_server("animated_reveal")

    p = figure(title="Animations", x_range=[-11, 11], y_range=[-11, 11])

    p.annular_wedge(
        0, 0, rmin, rmax, theta[:-1], theta[1:],
        inner_radius_units="data",
        outer_radius_units="data",
        fill_color=colors,
        line_color="black",
    )

    push()

    return p, cursession()


def update_animation(plot, session):

    from numpy import roll

    renderer = plot.select(dict(type=GlyphRenderer))
    ds = renderer[0].data_source

    while True:

        rmin = ds.data["inner_radius"]
        rmin = roll(rmin, 1)
        ds.data["inner_radius"] = rmin

        rmax = ds.data["outer_radius"]
        rmax = roll(rmax, -1)
        ds.data["outer_radius"] = rmax

        cursession().store_objects(ds)
        time.sleep(0.1)


class Population(object):

    year = 2010
    location = "World"

    def __init__(self):
        from bokeh.models import ColumnDataSource
        from bokeh.document import Document
        from bokeh.session import Session
        from bokeh.sampledata.population import load_population

        self.document = Document()
        self.session = Session()
        self.session.use_doc('population_reveal')
        self.session.load_document(self.document)

        self.df = load_population()
        self.source_pyramid = ColumnDataSource(data=dict())

        # just render at the initialization
        self._render()

    def _render(self):
        self.pyramid_plot()
        self.create_layout()
        self.document.add(self.layout)
        self.update_pyramid()

    def pyramid_plot(self):
        from bokeh.models import (Plot, DataRange1d, LinearAxis, Grid,
                                  Legend, SingleIntervalTicker)
        from bokeh.models.glyphs import Quad

        xdr = DataRange1d(sources=[self.source_pyramid.columns("male"),
                                   self.source_pyramid.columns("female")])
        ydr = DataRange1d(sources=[self.source_pyramid.columns("groups")])

        self.plot = Plot(title="Widgets", x_range=xdr, y_range=ydr,
                         plot_width=600, plot_height=600)

        xaxis = LinearAxis()
        self.plot.add_layout(xaxis, 'below')
        yaxis = LinearAxis(ticker=SingleIntervalTicker(interval=5))
        self.plot.add_layout(yaxis, 'left')

        self.plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
        self.plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

        male_quad = Quad(left="male", right=0, bottom="groups", top="shifted",
                         fill_color="#3B8686")
        male_quad_glyph = self.plot.add_glyph(self.source_pyramid, male_quad)

        female_quad = Quad(left=0, right="female", bottom="groups", top="shifted",
                           fill_color="#CFF09E")
        female_quad_glyph = self.plot.add_glyph(self.source_pyramid, female_quad)

        self.plot.add_layout(Legend(legends=dict(Male=[male_quad_glyph],
                                                 Female=[female_quad_glyph])))

    def on_year_change(self, obj, attr, old, new):
        self.year = int(new)
        self.update_pyramid()

    def on_location_change(self, obj, attr, old, new):
        self.location = new
        self.update_pyramid()

    def create_layout(self):
        from bokeh.models.widgets import Select, HBox, VBox

        years = list(map(str, sorted(self.df.Year.unique())))
        locations = sorted(self.df.Location.unique())

        year_select = Select(title="Year:", value="2010", options=years)
        location_select = Select(title="Location:", value="World", options=locations)

        year_select.on_change('value', self.on_year_change)
        location_select.on_change('value', self.on_location_change)

        controls = HBox(year_select, location_select)
        self.layout = VBox(controls, self.plot)

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


def update_population(plot):
    while True:
        plot.session.load_document(plot.document)
        time.sleep(0.1)

if __name__ == '__main__':
    app.run(debug=True)
