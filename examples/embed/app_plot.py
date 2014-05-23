# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd
import scipy.special
from bokeh.embed import autoload_static
from bokeh.plotting import (hold, figure, quad, line, xgrid, ygrid,
                            legend, curplot, patches)
from bokeh.resources import Resources


from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def render_plot():
    tag1, id1 = make_snippet(distribution())
    tag2, id2 = make_snippet(brewer())

    return render_template('app_plot.html',
                           tag1=tag1, id1=id1,
                           tag2=tag2, id2=id2)


def make_snippet(plot):
    js_static_js = "static/js/"
    js_static_css = "static/css/"
    js_filename = plot._id + ".js"
    js_path = js_static_js + js_filename

    res = Resources("server")
    res.js_files = [js_static_js + "bokeh.min.js"]
    res.css_files = [js_static_css + "bokeh.min.css"]

    js, tag = autoload_static(plot,
                              res,
                              js_path)

    with open(js_path, "w") as f:
        f.write(js)
    print("Wrote %s" % js_filename)

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
            next = last + df[cat]
            areas[cat] = np.hstack((last[::-1], next))
            last = next
        return areas

    figure(title="Brewer showcase.",
           tools="pan, wheel_zoom, box_zoom, reset, previewsave")

    areas = stacked(df, categories)

    colors = brewer["Spectral"][len(areas)]

    x2 = np.hstack((data['x'][::-1], data['x']))
    patches([x2 for a in areas], list(areas.values()), color=colors, alpha=0.8, line_color=None)

    return curplot()

if __name__ == '__main__':
    app.run(debug=True)
