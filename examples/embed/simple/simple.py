'''This example demonstrates embedding a standalone Bokeh document
into a simple Flask application, with a basic HTML web form.

To view the example, run:

    python simple.py

in this directory, and navigate to:

    http://localhost:5000

'''
from __future__ import print_function

import flask

from bokeh.embed import components
from bokeh.plotting import figure
from bokeh.resources import INLINE
from bokeh.util.string import encode_utf8

app = flask.Flask(__name__)

colors = {
    'Black': '#000000',
    'Red':   '#FF0000',
    'Green': '#00FF00',
    'Blue':  '#0000FF',
}

def getitem(obj, item, default):
    if item not in obj:
        return default
    else:
        return obj[item]

@app.route("/")
def polynomial():
    """ Very simple embedding of a polynomial chart

    """

    # Grab the inputs arguments from the URL
    # This is automated by the button
    args = flask.request.args

    # Get all the form arguments in the url with defaults
    color = colors[getitem(args, 'color', 'Black')]
    _from = int(getitem(args, '_from', 0))
    to = int(getitem(args, 'to', 10))

    # Create a polynomial line graph
    x = list(range(_from, to + 1))
    fig = figure(title="Polynomial")
    fig.line(x, [i ** 2 for i in x], color=color, line_width=2)

    # Configure resources to include BokehJS inline in the document.
    # For more details see:
    #   http://bokeh.pydata.org/en/latest/docs/reference/resources_embedding.html#bokeh-embed
    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()

    # For more details see:
    #   http://bokeh.pydata.org/en/latest/docs/user_guide/embedding.html#components
    script, div = components(fig, INLINE)
    html = flask.render_template(
        'embed.html',
        plot_script=script,
        plot_div=div,
        js_resources=js_resources,
        css_resources=css_resources,
        color=color,
        _from=_from,
        to=to
    )
    return encode_utf8(html)

if __name__ == "__main__":
    print(__doc__)
    app.run()
