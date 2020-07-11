from jinja2 import Template

from bokeh.embed import components
from bokeh.plotting import figure
from bokeh.resources import INLINE
from bokeh.sampledata.iris import flowers
from bokeh.themes import Theme
from bokeh.transform import factor_cmap, factor_mark
from bokeh.util.browser import view

SPECIES = ['setosa', 'versicolor', 'virginica']
MARKERS = ['hex', 'circle_x', 'triangle']

p = figure(title = "Iris Morphology")
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Sepal Width'

p.scatter("petal_length", "sepal_width", source=flowers, legend_group="species", fill_alpha=0.4, size=12,
          marker=factor_mark('species', MARKERS, SPECIES),
          color=factor_cmap('species', 'Category10_3', SPECIES))

p.legend.background_fill_color = "#3f3f3f"

theme = Theme(json={
    'attrs': {
        'Figure': {
            'background_fill_color': '#3f3f3f',
            'border_fill_color': '#3f3f3f',
            'outline_line_color': '#444444'
            },
        'Axis': {
            'axis_line_color': "white",
            'axis_label_text_color': "white",
            'major_label_text_color': "white",
            'major_tick_line_color': "white",
            'minor_tick_line_color': "white"
            },
        'Legend': {
            'background_fill_color': '#3f3f3f',
            'label_text_color': "white",
        },
        'Grid': {
            'grid_line_dash': [6, 4],
            'grid_line_alpha': .3
            },
        'Title': {
            'text_color': "white"
            }
        }
    })

script, div = components(p, theme=theme)

template = Template('''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Bokeh Scatter Plots</title>
        {{ resources }}
        {{ script }}
        <style>
            body {
                background: #3f3f3f;
            }

            .embed-wrapper {
                width: 50%;
                height: 400px;
                margin: auto;
            }
        </style>
    </head>
    <body>
        <div class="embed-wrapper">
        {{ div }}
        </div>
    </body>
</html>
''')

resources = INLINE.render()

filename = 'embed_themed.html'

html = template.render(resources=resources,
                       script=script,
                       div=div)

with open(filename, mode="w", encoding="utf-8") as f:
    f.write(html)

view(filename)
