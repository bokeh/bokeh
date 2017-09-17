from bokeh.driving import repeat
from bokeh.events import ButtonClick
from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import Button, ColumnDataSource, Slider
from bokeh.plotting import figure

import numpy as np

doc = curdoc()

x = np.linspace(0, 2, 1000)
y = 1 - (x-1)**2

source = ColumnDataSource(data=dict(x=x, y=y))

p  = figure(title="initial title")
p.circle(x=1, y=list(range(0, 11)))
p.line('x', 'y', color="orange", source=source)

slider = Slider(start=0, end=10, step=0.1, value=1)
def scb(attr, old, new):
    source.data['y'] = new * y
slider.on_change('value', scb)

combine = Button(label="hold combine")
combine.on_event(ButtonClick, lambda event: doc.hold("combine"))

collect = Button(label="hold collect")
collect.on_event(ButtonClick, lambda event: doc.hold("collect"))

unhold = Button(label="unhold")
unhold.on_event(ButtonClick, lambda event: doc.unhold())

doc.add_root(column(p, slider, combine, collect, unhold))

@repeat(np.linspace(0, 10, 100))
def update(v):
    slider.value = v

curdoc().add_periodic_callback(update, 200)
