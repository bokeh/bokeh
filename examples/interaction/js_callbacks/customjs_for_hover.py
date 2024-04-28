''' An interactive plot showcasing Bokeh's ability to add interactions
using Custom Javascript.

This example demonstrates adding links between points on a graph.
These lines only show on hover using ``CustomJS`` callbacks to update the plot.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_tools, bokeh.models.HoverTool, bokeh.models.ColumnDataSource, bokeh.models.CustomJS
    :refs: :ref:`ug_interaction_js_callbacks_customjs`
    :keywords: hover, javascript callback, CustomJS

'''

from bokeh.models import ColumnDataSource, CustomJS, HoverTool
from bokeh.plotting import figure, show

# define some points and a little graph between them
x = [2, 3, 5, 6, 8, 7]
y = [6, 4, 3, 8, 7, 5]
links = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5],
    3: [1, 4],
    4: [1, 3],
    5: [2, 3, 4],
}

p = figure(width=400, height=400, tools="", toolbar_location=None, title='Hover over points')

source = ColumnDataSource(dict(x0=[], y0=[], x1=[], y1=[]))
sr = p.segment(x0='x0', y0='y0', x1='x1', y1='y1', color='olive', alpha=0.6, line_width=3, source=source )
cr = p.scatter(x, y, color='olive', size=30, alpha=0.4, hover_color='olive', hover_alpha=1.0)

# add a hover tool that sets the link data for a hovered circle
code = """
const data = {x0: [], y0: [], x1: [], y1: []}
const {indices} = cb_data.index
for (const start of indices) {
    for (const end of links.get(start)) {
        data.x0.push(circle.data.x[start])
        data.y0.push(circle.data.y[start])
        data.x1.push(circle.data.x[end])
        data.y1.push(circle.data.y[end])
    }
}
segment.data = data
"""

callback = CustomJS(args=dict(circle=cr.data_source, segment=sr.data_source, links=links), code=code)
p.add_tools(HoverTool(tooltips=None, callback=callback, renderers=[cr]))

show(p)
