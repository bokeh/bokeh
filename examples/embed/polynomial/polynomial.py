'''
This script is loosely based on the bokeh spectogram example,
    but is much simpler:
    https://github.com/bokeh/bokeh/tree/master/examples/embed/spectrogram

This creates a simple form for generating polynomials of the form y = x^2

This is done using a form that has a method of GET, allowing you to share the
    graphs you create with your friends though the link!

You should know Flask to understand this example
'''
import flask

from bokeh.embed import components
from bokeh.plotting import figure
from bokeh.resources import Resources, CDN
from bokeh.templates import RESOURCES
from bokeh.utils import encode_utf8

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
    """ Very simple embedding of a polynomial chart"""
    # Grab the inputs arguments from the URL
    #  This is automated by the button
    args = flask.request.args

    # Get all the form arguments in the url with defaults
    color = colors[getitem(args, 'color', 'Black')]
    _from = int(getitem(args, '_from', 0))
    to = int(getitem(args, 'to', 10))

    # Create a polynomial line graph
    x = list(range(_from, to + 1))
    fig = figure(title="Polynomial")
    fig.line(x, [i ** 2 for i in x], color=color)

    resources = Resources("inline")
    plot_resources = RESOURCES.render(
        js_raw=resources.js_raw,
        css_raw=resources.css_raw,
        js_files=resources.js_files,
        css_files=resources.css_files,
    )

    # taken from the documentation on embedding:
    #   http://bokeh.pydata.org/en/latest/docs/user_guide/embedding.html#id2
    script, div = components(fig, CDN)
    html = flask.render_template(
        'embed.html',
        plot_script=script, plot_div=div, plot_resources=plot_resources,
        color=color, _from=_from, to=to
    )
    return encode_utf8(html)


def main():
    # start our app
    app.debug = True
    app.run()

if __name__ == "__main__":
    main()
