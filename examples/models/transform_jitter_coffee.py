import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import ColumnDataSource
from bokeh.models import CustomJS, Button, LabelSet
from bokeh.models.transforms import Jitter
from bokeh.models.layouts import Column, WidgetBox

N = 1000

source = ColumnDataSource(data=dict(
    x=np.ones(N), xn=2*np.ones(N), xu=3*np.ones(N), y=np.random.random(N)*10
))

normal = Jitter(width=0.2, distribution="normal")
uniform = Jitter(width=0.2, distribution="uniform")

p = figure(x_range=(0, 4), y_range=(0,10), toolbar_location=None,
           tools="", x_axis_location="above")
p.circle(x='x',  y='y', color='firebrick', source=source, size=5, alpha=0.5)
p.circle(x='xn', y='y', color='olive',     source=source, size=5, alpha=0.5)
p.circle(x='xu', y='y', color='navy',      source=source, size=5, alpha=0.5)

label_data = ColumnDataSource(data=dict(
    x=[1,2,3], y=[0, 0, 0], t=['Original', 'Normal', 'Uniform']
))
label_set = LabelSet(x='x', y='y', text='t', y_offset=-4, source=label_data, render_mode='css',
                     text_baseline="top", text_align='center')
p.add_layout(label_set)

callback=CustomJS.from_coffeescript(args=dict(source=source, normal=normal, uniform=uniform), code="""
    data = source.get 'data'
    for i in [0...data['y'].length]
        data['xn'][i] = normal.compute(data['x'][i] + 1)
    for i in [0...data['y'].length]
        data['xu'][i] = uniform.compute(data['x'][i] + 2)
    source.trigger 'change'
""")

button = Button(label='Press to apply Jitter!', callback=callback)

output_file("transform_jitter_coffee.html", title="Example Jitter Transform (CoffeeScript callback)")

show(Column(WidgetBox(button,width=300), p))
