from bokeh.plotting import figure
from bokeh.models import Range1d
from bokeh.embed import components
from bokeh.resources import INLINE
from jinja2 import Template
import webbrowser
import os
import six

# create some data
x1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y1 = [0, 8, 2, 4, 6, 9, 5, 6, 25, 28, 4, 7]
x2 = [2, 5, 7, 15, 18, 19, 25, 28, 9, 10, 4]
y2 = [2, 4, 6, 9, 15, 18, 0, 8, 2, 25, 28]
x3 = [0, 1, 0, 8, 2, 4, 6, 9, 7, 8, 9]
y3 = [0, 8, 4, 6, 9, 15, 18, 19, 19, 25, 28]

# select the tools we want
TOOLS="pan,wheel_zoom,box_zoom,reset,save"

# the red and blue graphs will share this data range
xr1 = Range1d(start=0, end=30)
yr1 = Range1d(start=0, end=30)

# only the green will use this data range
xr2 = Range1d(start=0, end=30)
yr2 = Range1d(start=0, end=30)

# build our figures
p1 = figure(x_range=xr1, y_range=yr1, tools=TOOLS, plot_width=300, plot_height=300)
p1.scatter(x1, y1, size=12, color="red", alpha=0.5)

p2 = figure(x_range=xr1, y_range=yr1, tools=TOOLS, plot_width=300, plot_height=300)
p2.scatter(x2, y2, size=12, color="blue", alpha=0.5)

p3 = figure(x_range=xr2, y_range=yr2, tools=TOOLS, plot_width=300, plot_height=300)
p3.scatter(x3, y3, size=12, color="green", alpha=0.5)

# plots can be a single Bokeh model, a list/tuple, or even a dictionary
plots = {'Red': p1, 'Blue': p2, 'Green': p3}

script, div = components(plots)

template = Template('''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Bokeh Scatter Plots</title>
        <style> div{float: left;} </style>
        {{ js_resources }}
        {{ css_resources }}
        {{ script }}
    </head>
    <body>
    {% for key in div.keys() %}
        {{ div[key] }}
    {% endfor %}
    </body>
</html>
''')

js_resources = INLINE.render_js()
css_resources = INLINE.render_css()

html_file = 'embed_multiple.html'

html = template.render(js_resources=js_resources,
                       css_resources=css_resources,
                       script=script,
                       div=div)

with open(html_file, 'w') as textfile:
    textfile.write(html)

url = 'file:{}'.format(six.moves.urllib.request.pathname2url(os.path.abspath(html_file)))
webbrowser.open(url)
