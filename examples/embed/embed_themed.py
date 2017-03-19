import io

from jinja2 import Template

from bokeh.embed import components
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.themes import Theme
from bokeh.plotting import figure

x1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y1 = [0, 8, 2, 4, 6, 9, 5, 6, 25, 28, 4]

p1 = figure(title='DARK THEMED PLOT')
p1.scatter(x1, y1)

theme = Theme(json={
    'attrs': {
        'Figure': {
            'background_fill_color': '#2F2F2F',
            'border_fill_color': '#2F2F2F',
            'outline_line_color': '#444444'
            },
        'Axis': {
            'axis_line_color': "white",
            'axis_label_text_color': "white",
            'major_label_text_color': "white",
            'major_tick_line_color': "white",
            'minor_tick_line_color': "white",
            'minor_tick_line_color': "white"
            },
        'Grid': {
            'grid_line_dash': [6, 4],
            'grid_line_alpha': .3
            },
        'Circle': {
            'fill_color': 'lightblue',
            'size': 10,
            },
        'Title': {
            'text_color': "white"
            }
        }
    })

script, div = components(p1, theme=theme)

template = Template('''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Bokeh Scatter Plots</title>
        {{ js_resources }}
        {{ css_resources }}
        {{ script }}
        <style>
            body {
                background: #2F2F2F;
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

js_resources = INLINE.render_js()
css_resources = INLINE.render_css()

filename = 'embed_simple.html'

html = template.render(js_resources=js_resources,
                       css_resources=css_resources,
                       script=script,
                       div=div)

with io.open(filename, mode='w', encoding='utf-8') as f:
    f.write(html)

view(filename)
