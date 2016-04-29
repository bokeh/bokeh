import numpy as np

from bokeh.io import vplot
from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import ColumnDataSource
from bokeh.models import CustomJS, Button, Label
from bokeh.models.transforms import Jitter

N = 1000

source = ColumnDataSource(data=dict(
    x=np.ones(N), xn=2*np.ones(N), xu=3*np.ones(N), y=np.random.random(N)*10
))

normal = Jitter(width=0.2, distribution="normal")
uniform = Jitter(width=0.2, distribution="uniform")

p = figure(x_range=(0, 4), y_range=(0,10))
p.circle(x='x',  y='y', color='firebrick', source=source, size=5, alpha=0.5)
p.circle(x='xn', y='y', color='olive',     source=source, size=5, alpha=0.5)
p.circle(x='xu', y='y', color='navy',      source=source, size=5, alpha=0.5)

label_data = ColumnDataSource(data=dict(
    x=[1,2,3], y=[10, 10, 10], t=['Original', 'Normal', 'Uniform']
))
labels = Label(x='x', y='y', text='t', y_offset=2, source=label_data, render_mode='css', text_align='center')
p.add_annotation(labels)

callback=CustomJS(args=dict(source=source, normal=normal, uniform=uniform), code="""
    data=source.get('data')
    for (i=0; i < data['y'].length; i++) {
        data['xn'][i] = normal.compute(data['x'][i]+1)
    }
    for (i=0; i < data['y'].length; i++) {
        data['xu'][i] = uniform.compute(data['x'][i]+2)
    }
    source.trigger('change')
""")

button = Button(label='Press to apply Jitter!', callback=callback)

output_file("transform_jitter.html", title="Example Jitter Transform")

show(vplot(button, p))