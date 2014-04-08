# -*- coding: utf-8 -*-

import numpy as np
import scipy.special
from bokeh.plotting import (output_file, hold, figure, quad, line, xgrid, ygrid,
                            legend, curplot)
from bokeh.embed import hosted_file, hosted_CDN

from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def render_plot():
    snippet = my_plot()

    return render_template('plots.html', snippet=snippet)


def my_plot():

    mu, sigma = 0, 0.5

    measured = np.random.normal(mu, sigma, 1000)
    hist, edges = np.histogram(measured, density=True, bins=20)

    x = np.linspace(-2, 2, 1000)
    pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(x - mu) ** 2 / (2 * sigma ** 2))
    cdf = (1 + scipy.special.erf((x - mu) / np.sqrt(2 * sigma ** 2))) / 2

    output_file("nice_histo.html", title="App example")

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

    #snippet = hosted_file(curplot(),
                          #bokehJS_url='../static/js/bokeh.js',
                          #bokehCSS_url='../static/css/bokeh.css')

    snippet = hosted_CDN(curplot())

    return snippet


if __name__ == '__main__':
    app.run(debug=True)
