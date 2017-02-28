import io

from jinja2 import Template

from bokeh.embed import components
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.io import curdoc, show
from bokeh.themes import Theme
from bokeh.plotting import figure

x1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y1 = [0, 8, 2, 4, 6, 9, 5, 6, 25, 28, 4]

p1 = figure(title='PINK TITLE')
p1.background_fill_color = "#999999"
p1.border_fill_color = "#999999"
p1.scatter(x1, y1, color='yellow')

theme = Theme(json={'attrs': {'Title': {'text_color': 'pink'}}})
curdoc().theme = theme

script, div = components(p1)

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
                background-color: #999999;
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
