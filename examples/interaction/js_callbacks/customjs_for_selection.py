''' An interactive plot showcasing Bokeh's ability to add interactions
using Custom Javascript.

This example demonstrates selecting highlighted points on a graph.
These points will show on the secondary graph which uses ``CustomJS``
callbacks to update its plot.

.. bokeh-example-metadata::
    :apis: bokeh.model.Model.js_on_change, bokeh.models.sources.ColumnDataSource, bokeh.models.callbacks.CustomJS
    :refs: :ref:`ug_interaction_js_callbacks_customjs`
    :keywords: hover, javascript callback, CustomJS

'''


from random import random

from bokeh.layouts import row
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import figure, show

x = [random() for x in range(500)]
y = [random() for y in range(500)]

s1 = ColumnDataSource(data=dict(x=x, y=y))
p1 = figure(width=400, height=400, tools="lasso_select", title="Select Here")
p1.scatter('x', 'y', source=s1, alpha=0.6)

s2 = ColumnDataSource(data=dict(x=[], y=[]))
p2 = figure(width=400, height=400, x_range=(0, 1), y_range=(0, 1),
            tools="", title="Watch Here")
p2.scatter('x', 'y', source=s2, alpha=0.6)

s1.selected.js_on_change('indices', CustomJS(args=dict(s1=s1, s2=s2), code="""
        const inds = cb_obj.indices
        const d1 = s1.data
        const x = Array.from(inds, (i) => d1.x[i])
        const y = Array.from(inds, (i) => d1.y[i])
        s2.data = {x, y}
    """),
)

layout = row(p1, p2)

show(layout)
