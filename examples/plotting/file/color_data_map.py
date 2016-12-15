import numpy as np

from bokeh.io import show
from bokeh.layouts import gridplot
from bokeh.models import (
    ColumnDataSource,
    ColorBar,
    LinearColorMapper,
    LogColorMapper,
)
from bokeh.palettes import Viridis3, Viridis256
from bokeh.plotting import figure

x = np.random.random(2500) * 140 - 20
y = np.random.normal(size=2500) * 2 + 5
source = ColumnDataSource(dict(x=x, y=y))
opts = dict(x='x', line_color=None, source=source)


def make_plot(mapper, title):
    mapper.low_color = 'blue'
    mapper.high_color = 'red'
    p = figure(toolbar_location=None, tools='', title=title)
    color_bar = ColorBar(color_mapper=mapper, location=(0, 0))
    p.circle(
        x='x', y='y',
        fill_color={'field': 'x', 'transform': mapper}, line_color=None,
        source=source
    )
    p.add_layout(color_bar, 'right')
    return p

p1 = make_plot(LinearColorMapper(palette=Viridis256, low=0, high=100), title='Viridis256 - Linear, low/high = blue/red')
p2 = make_plot(LogColorMapper(palette=Viridis256, low=0, high=100), title='Viridis256 - Log, low/high = blue/red')
p3 = make_plot(LinearColorMapper(palette=Viridis3, low=0, high=100), title='Viridis3 - Linear, low/high = blue/red')
p4 = make_plot(LogColorMapper(palette=Viridis3, low=0, high=100), title='Viridis3 - Log, low/high =, blue/red')

show(gridplot([p1, p2, p3, p4], ncols=2, plot_width=400, plot_height=300, toolbar_location=None))
