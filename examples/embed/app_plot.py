from bokeh.plotting import *
from bokeh.embed import hosted_file, hosted_CDN
import numpy as np

from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def render_plot():
    snippet = my_plot()

    return render_template('plots.html', snippet=snippet)


def my_plot():

    N = 80

    x = np.linspace(0, 4 * np.pi, N)
    y = np.sin(x)

    output_file("line.html", title="line.py example")

    line(x, y, color="#0000FF",
         tools="pan, wheel_zoom, box_zoom, reset, previewsave",
         name="line_example")

    #snippet = hosted_file(curplot(),
                          #bokehJS_url='../static/js/bokeh.js',
                          #bokehCSS_url='../static/css/bokeh.css')

    snippet = hosted_CDN(curplot())

    return snippet


if __name__ == '__main__':
    app.run(debug=True)
