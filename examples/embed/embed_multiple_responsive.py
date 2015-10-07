from bokeh.browserlib import view
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.resources import INLINE
from bokeh.templates import JS_RESOURCES, CSS_RESOURCES

from jinja2 import Template
import random

########## BUILD FIGURES ################

PLOT_OPTIONS = dict(plot_width=800, plot_height=300)
SCATTER_OPTIONS = dict(size=12, alpha=0.5)
data = lambda: [random.choice([i for i in range(100)]) for r in range(10)]
red = figure(responsive=True, tools='pan', **PLOT_OPTIONS)
red.scatter(data(), data(), color="red", **SCATTER_OPTIONS)
blue = figure(responsive=False, tools='pan', **PLOT_OPTIONS)
blue.scatter(data(), data(), color="blue", **SCATTER_OPTIONS)
green = figure(responsive=True, tools='pan,resize', **PLOT_OPTIONS)
green.scatter(data(), data(), color="green", **SCATTER_OPTIONS)

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
    <h2>Resize the window to see some plots resizing</h2>
    <h3>Red - pan with responsive</h3>
    {{ plot_div.red }}
    <h3>Green - pan with resize & responsive (should maintain new aspect ratio)</h3>
    {{ plot_div.green }}
    <h3>Blue - pan no responsive</h3>
    {{ plot_div.blue }}

    {{ plot_script }}
    </body>
</html>
''')

resources = INLINE

js_resources = JS_RESOURCES.render(
    js_raw=resources.js_raw,
    js_files=resources.js_files
)

css_resources = CSS_RESOURCES.render(
    css_raw=resources.css_raw,
    css_files=resources.css_files
)

script, div = components({'red': red, 'blue': blue, 'green': green})

html = template.render(js_resources=js_resources,
                       css_resources=css_resources,
                       plot_script=script,
                       plot_div=div)

html_file = 'embed_multiple_responsive.html'

with open(html_file, 'w') as f:
    f.write(html)

view(html_file)
