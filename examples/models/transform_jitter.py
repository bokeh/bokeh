''' This example demonstrates how to us a jitter transform on coordinate data.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.circle, bokeh.models.sources.ColumnDataSource, bokeh.models.Circle, bokeh.models.Jitter
    :refs: :ref:`ug_interaction_widgets`, :ref:`ug_topics_categorical_scatters_jitter`
    :keywords: scatter plot, Jitter, Bokeh, NumPy

'''

import numpy as np

from bokeh.core.properties import field
from bokeh.models import Button, Column, ColumnDataSource, CustomJS, Jitter, LabelSet
from bokeh.plotting import figure, show

x = np.ones(1000)
y = np.random.random(1000)*10

source = ColumnDataSource(data=dict(x=x, xn=2*x, xu=3*x, y=y))

normal = Jitter(width=0.2, distribution="normal")
uniform = Jitter(width=0.2, distribution="uniform")

p = figure(x_range=(0, 4), y_range=(0,10), toolbar_location=None, x_axis_location="above")
p.scatter(x='x', y='y', color='firebrick', source=source, size=5, alpha=0.5)

r1 = p.scatter(x='xn', y='y', color='olive', source=source, size=5, alpha=0.5)
n1 = p.scatter(x=field('xn', normal), y='y', color='olive', source=source,
               size=5, alpha=0.5, visible=False)

r2 = p.scatter(x='xu', y='y', color='navy', source=source, size=5, alpha=0.5)
u2 = p.scatter(x=field('xu', uniform), y='y', color='navy', source=source,
               size=5, alpha=0.5, visible=False)

label_data = ColumnDataSource(data=dict(
    x=[1,2,3], y=[0, 0, 0], t=['Original', 'Normal', 'Uniform'],
))
label_set = LabelSet(x='x', y='y', text='t', y_offset=-4, source=label_data,
                     text_baseline="top", text_align='center')
p.add_layout(label_set)

callback = CustomJS(args=dict(r1=r1, n1=n1, r2=r2, u2=u2), code="""
for (const r of [r1, n1, r2, u2]) {
    r.visible = !r.visible
}
""")

button = Button(label='Press to toggle Jitter!', width=300)
button.js_on_event("button_click", callback)

show(Column(button, p))
