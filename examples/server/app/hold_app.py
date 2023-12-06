import numpy as np

from bokeh.events import ButtonClick
from bokeh.io import curdoc
from bokeh.layouts import column, row
from bokeh.models import Button, ColumnDataSource, Div, Slider
from bokeh.plotting import figure

doc = curdoc()

x = np.linspace(0, 2, 1000)
y = 1 - (x-1)**2

source = ColumnDataSource(data=dict(x=x, y=y))

p = figure(toolbar_location=None, background_fill_color="#fafafa")
p.scatter(x=1, y=list(range(0, 11)))
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

div = Div(text="""
<p>Bokeh Documents can be configured to "hold" property change events until a
corresponding "unhold" is issued. There are two modes. In "collect" mode, all
held events are replayed in order when "unhold" is called. In "combine" mode,
Bokeh will coalesce events so that at most one event per property is issued.</p>

<p>Click "combine" or "collect" below, and scrub the slider. Then click "unhold"
to see the result.</p>
""", width=600)

doc.add_root(row(
    p, column(div, column(slider, combine, collect, unhold))),
)
