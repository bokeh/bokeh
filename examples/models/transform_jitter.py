''' This example demonstrates how to us a jitter transform on coordinate data.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.circle, bokeh.models.sources.ColumnDataSource, bokeh.models.Circle, bokeh.models.Jitter
    :refs: :ref:`ug_interaction_widgets`, :ref:`ug_topics_categorical_scatters_jitter`
    :keywords: scatter plot, Jitter, Bokeh, NumPy

'''

import numpy as np

from bokeh.core.properties import field
from bokeh.models import Button, Column, ColumnDataSource, CustomJS, Jitter
from bokeh.plotting import figure, show

x = np.ones(1000)
y = np.random.random(1000)*10

source = ColumnDataSource(data=dict(x=x, xn=2*x, xu=3*x, y=y))

normal = Jitter(width=0.2, distribution="normal")
uniform = Jitter(width=0.2, distribution="uniform")

p = figure(x_range=(0, 4), y_range=(0,10), toolbar_location=None, x_axis_location="above", min_border_bottom=25)
p.scatter(x='x', y='y', color='firebrick', source=source, size=5, alpha=0.5)

r1 = p.scatter(x='xn', y='y', color='olive', source=source, size=5, alpha=0.5)
n1 = p.scatter(x=field('xn', normal), y='y', color='olive', source=source,
               size=5, alpha=0.5, visible=False)

r2 = p.scatter(x='xu', y='y', color='navy', source=source, size=5, alpha=0.5)
u2 = p.scatter(x=field('xu', uniform), y='y', color='navy', source=source,
               size=5, alpha=0.5, visible=False)

p.text(
    x=[1, 2, 3], y=[0, 0, 0], y_offset=5,
    text=["Original", "Normal", "Uniform"],
    anchor="top_center",
    level="annotation",
)

callback = CustomJS(args=dict(renderers=[r1, n1, r2, u2]), code="""
for (const r of renderers) {
    r.visible = !r.visible
}
""")

button = Button(label='Press to toggle Jitter!', width=300)
button.js_on_event("button_click", callback)

show(Column(button, p))
