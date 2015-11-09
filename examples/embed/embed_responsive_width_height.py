"""
This example shows how a Bokeh plot can be embedded in an HTML document,
in a way that the plot resizes to make use of the available width and
height (while keeping the aspect ratio fixed).

To make this work well, the plot should be placed in a container that
*has* a certain width and height (i.e. non-scrollable), which is the
body element in this case. A more realistic example might be embedding
a plot in a Phosphor widget.
"""

from bokeh.browserlib import view
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.resources import INLINE

from jinja2 import Template
import random

########## BUILD FIGURES ################

PLOT_OPTIONS = dict(plot_width=600, plot_height=400)
SCATTER_OPTIONS = dict(size=12, alpha=0.5)
data = lambda: [random.choice([i for i in range(100)]) for r in range(10)]
red = figure(responsive=False, tools='pan', **PLOT_OPTIONS)
red.scatter(data(), data(), color="red", **SCATTER_OPTIONS)

########## RENDER PLOTS ################

# Define our html template for out plots
template = Template('''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Responsive plots</title>
        {{ js_resources }}
        {{ css_resources }}
    </head>
    <body>
    {{ plot_div.red }}
    {{ plot_script }}
    <script>
    // Set things up to resize the plot on a window resize. You can play with
    // the arguments of resize_width_height() to change the plot's behavior.
    var plot_resize_setup = function () {
        var plotid = Object.keys(Bokeh.index)[0]; // assume we have just one plot
        var plot = Bokeh.index[plotid];
        var plotresizer = function() {
            // arguments: use width, use height, maintain aspect ratio
            plot.resize_width_height(true, true, true);
        };
        window.addEventListener('resize', plotresizer);
        plotresizer();
    };
    window.addEventListener('load', plot_resize_setup);
    </script>
    <style>
    /* Need this to get the page in "desktop mode"; not having an infinite height.*/
    html, body {height: 100%;}
    </style>
    </body>
</html>
''')

resources = INLINE

js_resources = resources.render_js()
css_resources = resources.render_css()

script, div = components({'red': red})

html = template.render(js_resources=js_resources,
                       css_resources=css_resources,
                       plot_script=script,
                       plot_div=div)

html_file = 'embed_responsive_width_height.html'

with open(html_file, 'w') as f:
    f.write(html)

view(html_file)
