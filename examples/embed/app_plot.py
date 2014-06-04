# -*- coding: utf-8 -*-

from threading import Thread

import numpy as np
import pandas as pd
import scipy.special
from bokeh.embed import autoload_static, autoload_server
from bokeh.objects import Glyph, Range1d
from bokeh.plotting import (hold, figure, quad, line, xgrid, ygrid,
                            legend, curplot, patches, annular_wedge,
                            cursession, output_server)
from bokeh.resources import Resources

from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def render_plot():
    tag1, id1 = make_snippet(distribution(), "static")
    tag2, id2 = make_snippet(brewer(), "static")
    tag3, id3 = make_snippet(animated()[0], "server", animated()[1])

    return render_template('app_plot.html',
                           tag1=tag1, id1=id1,
                           tag2=tag2, id2=id2,
                           tag3=tag3, id3=id3)


def make_snippet(plot, kind, session=None):
    js_static_js = "static/js/"
    #js_static_css = "static/css/"
    js_filename = plot._id + ".js"
    js_path = js_static_js + js_filename

    res = Resources("server")
    #res.js_files = [js_static_js + "bokeh.min.js"]
    #res.css_files = [js_static_css + "bokeh.min.css"]

    if kind == "static":
        js, tag = autoload_static(plot, res, js_path)
        with open(js_path, "w") as f:
            f.write(js)
        print("Wrote %s" % js_filename)
    elif kind == "server":
        tag = autoload_server(plot, session)
        thread = Thread(target=update, args=(plot, session))
        thread.start()

    return tag, plot._id


def distribution():

    mu, sigma = 0, 0.5

    measured = np.random.normal(mu, sigma, 1000)
    hist, edges = np.histogram(measured, density=True, bins=20)

    x = np.linspace(-2, 2, 1000)
    pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(x - mu) ** 2 / (2 * sigma ** 2))
    cdf = (1 + scipy.special.erf((x - mu) / np.sqrt(2 * sigma ** 2))) / 2

    hold()

    figure(title="Normal Distribution (μ=0, σ=0.5)",
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

    return curplot()


def brewer():

    from collections import OrderedDict
    from bokeh.palettes import brewer

    N = 20
    categories = ['y' + str(x) for x in range(10)]
    data = {}
    data['x'] = np.arange(N)
    for cat in categories:
        data[cat] = np.random.randint(10, 100, size=N)

    df = pd.DataFrame(data)
    df = df.set_index(['x'])

    def stacked(df, categories):
        areas = OrderedDict()
        last = np.zeros(len(df[categories[0]]))
        for cat in categories:
            nnext = last + df[cat]
            areas[cat] = np.hstack((last[::-1], nnext))
            last = nnext
        return areas

    figure(title="Brewer showcase.",
           tools="pan, wheel_zoom, box_zoom, reset, previewsave")

    areas = stacked(df, categories)

    colors = brewer["Spectral"][len(areas)]

    x2 = np.hstack((data['x'][::-1], data['x']))
    patches([x2 for a in areas], list(areas.values()), color=colors, alpha=0.8, line_color=None)

    return curplot()


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

    output_server("animated_embed")

    figure(title="Animated.")

    hold()

    annular_wedge(
        cx, cy, rmin, rmax, theta[:-1], theta[1:],
        x_range=Range1d(start=-11, end=11),
        y_range=Range1d(start=-11, end=11),
        inner_radius_units="data",
        outer_radius_units="data",
        fill_color=colors,
        line_color="black",
        tools="pan,wheel_zoom,box_zoom,reset,previewsave"
    )

    return curplot(), cursession()


def update(plot, session):

    import time
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


if __name__ == '__main__':
    app.run(debug=True)

