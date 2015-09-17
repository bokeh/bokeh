from bokeh.browserlib import view
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.resources import INLINE
from bokeh.templates import RESOURCES

from jinja2 import Template
import random

########## BUILD FIGURES ################

PLOT_OPTIONS = dict(plot_width=800, plot_height=300)
SCATTER_OPTIONS = dict(size=12, alpha=0.5)
data = lambda: [random.choice([i for i in range(100)]) for r in range(10)]
p1 = figure(responsive=True, tools='pan', **PLOT_OPTIONS)
p1.scatter(data(), data(), color="red", **SCATTER_OPTIONS)
p2 = figure(responsive=True, tools='pan', **PLOT_OPTIONS)
p2.scatter(data(), data(), color="blue", **SCATTER_OPTIONS)
p3 = figure(responsive=True, tools='pan,resize', **PLOT_OPTIONS)
p3.scatter(data(), data(), color="green", **SCATTER_OPTIONS)

########## RENDER PLOTS ################

# Define our html template for out plots
template = Template('''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Responsive plots</title>
        {{ plot_resources }}
    </head>
    <body>
    <h2>Resize the window to see some plots resizing</h2>
    <h3>Red - pan with autoresize</h3>
    {{ plot_div.red }}
    <h3>Green - pan with reize & autoresize (should maintain new aspect ratio)</h3>
    {{ plot_div.green }}
    <h3>Blue - pan no autoresize</h3>
    {{ plot_div.blue }}

    {{ plot_script }}
    </body>
</html>
''')

plot_resources = RESOURCES.render(js_raw=INLINE.js_raw, css_raw=INLINE.css_raw)
script, div = components({'red': p1, 'blue': p2, 'green': p3})
html = template.render(plot_resources=plot_resources, plot_script=script, plot_div=div)
html_file = 'embed_multiple_responsive.html'
with open(html_file, 'w') as f:
    f.write(html)

view(html_file)
