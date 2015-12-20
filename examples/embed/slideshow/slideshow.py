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
from __future__ import print_function

from flask import Flask, render_template
import numpy as np
from numpy import roll, pi, cos, sin, linspace
import scipy.special

from bokeh.client import push_session
from bokeh.embed import autoload_server
from bokeh.models import GlyphRenderer, Select, HBox, VBox, ColumnDataSource
from bokeh.plotting import figure, push, curdoc
from bokeh.sampledata.population import load_population

app = Flask(__name__)

session = push_session(curdoc())

@app.route('/')
def render_plot():
    dist_plot = distribution()

    anim_plot = animated()
    curdoc().add_periodic_callback(update_animated, 50)

    pop = Population(curdoc())

    return render_template(
        'app_plot.html',
        tag1=autoload_server(dist_plot),
        tag2=autoload_server(anim_plot),
        tag3=autoload_server(pop.layout)
    )

def distribution():
    mu, sigma = 0, 0.5

    measured = np.random.normal(mu, sigma, 1000)
    hist, edges = np.histogram(measured, density=True, bins=20)

    x = np.linspace(-2, 2, 1000)
    pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(x - mu) ** 2 / (2 * sigma ** 2))
    cdf = (1 + scipy.special.erf((x - mu) / np.sqrt(2 * sigma ** 2))) / 2

    p = figure(title="Interactive plots", background_fill_color="#E5E5E5")

    p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
           fill_color="#333333", line_color="#E5E5E5", line_width=3)

    # Use `line` renderers to display the PDF and CDF
    p.line(x, pdf, line_color="#348abd", line_width=8, alpha=0.7, legend="PDF")
    p.line(x, cdf, line_color="#7a68a6", line_width=8, alpha=0.7, legend="CDF")

    p.legend.location = "top_left"

    p.xaxis.axis_label = 'x'
    p.xgrid[0].grid_line_color = "white"
    p.xgrid[0].grid_line_width = 3

    p.yaxis.axis_label = 'Pr(x)'
    p.ygrid[0].grid_line_color = "white"
    p.ygrid[0].grid_line_width = 3

    return p

def animated():
    M = 5
    N = M*10 + 1
    r_base = 8
    theta = linspace(0, 2*pi, N)
    r_x = linspace(0, 6*pi, N-1)
    rmin = r_base - cos(r_x) - 1
    rmax = r_base + sin(r_x) + 1

    colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8",
              "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"] * 5

    p = figure(title="Animations", x_range=[-11, 11], y_range=[-11, 11])

    # figure() function auto-adds the figure to curdoc()
    p = figure(x_range=(-11, 11), y_range=(-11, 11))
    r = p.annular_wedge(0, 0, rmin, rmax, theta[:-1], theta[1:],
                        fill_color=colors, line_color="white")

    return p

def update_animated(plot):
    ds = r.data_source
    rmin = roll(ds.data["inner_radius"], 1)
    rmax = roll(ds.data["outer_radius"], -1)
    ds.data.update(inner_radius=rmin, outer_radius=rmax)

class Population(object):

    year = 2010
    location = "World"

    def __init__(self, document):
        self.document = document

        self.df = load_population()
        self.source_pyramid = ColumnDataSource(data=dict())

        # just render at the initialization
        self._render()

    def _render(self):
        self.pyramid_plot()
        self.create_layout()
        self.document.add_root(self.layout)
        self.update_pyramid()

    def pyramid_plot(self):
        from bokeh.models import (Plot, DataRange1d, LinearAxis, Grid,
                                  Legend, SingleIntervalTicker)
        from bokeh.models.glyphs import Quad

        xdr = DataRange1d()
        ydr = DataRange1d()

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

    def on_year_change(self, attr, old, new):
        self.year = int(new)
        self.update_pyramid()

    def on_location_change(self, attr, old, new):
        self.location = new
        self.update_pyramid()

    def create_layout(self):
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

if __name__ == '__main__':
    print(__doc__)
    app.run()
