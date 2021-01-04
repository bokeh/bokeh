import random

from jinja2 import Template

from bokeh.embed import components
from bokeh.plotting import figure
from bokeh.resources import INLINE
from bokeh.util.browser import view

########## BUILD FIGURES ################

PLOT_OPTIONS = dict(plot_width=800, plot_height=300)
SCATTER_OPTIONS = dict(size=12, alpha=0.5)

data = lambda: [random.choice([i for i in range(100)]) for r in range(10)]

red = figure(sizing_mode='scale_width', tools='pan', **PLOT_OPTIONS)
red.scatter(data(), data(), color="red", **SCATTER_OPTIONS)

blue = figure(sizing_mode='fixed', tools='pan', **PLOT_OPTIONS)
blue.scatter(data(), data(), color="blue", **SCATTER_OPTIONS)

green = figure(sizing_mode='scale_width', tools='pan', **PLOT_OPTIONS)
green.scatter(data(), data(), color="green", **SCATTER_OPTIONS)

########## RENDER PLOTS ################

# Define our html template for out plots
template = Template("""\
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Responsive plots</title>
        {{ resources }}
    </head>
    <body>
    <h2>Resize the window to see some plots resizing</h2>
    <h3>Red - pan tool, scale_width</h3>
    {{ plot_div.red }}
    <h3>Green - pan tool, scale_width</h3>
    {{ plot_div.green }}
    <h3>Blue - pan tool, fixed/h3>
    {{ plot_div.blue }}

    {{ plot_script }}
    </body>
</html>
""")

resources = INLINE.render()

script, div = components({'red': red, 'blue': blue, 'green': green})

html = template.render(resources=resources,
                       plot_script=script,
                       plot_div=div)

filename = 'embed_multiple_responsive.html'

with open(filename, mode="w", encoding="utf-8") as f:
    f.write(html)

view(filename)
