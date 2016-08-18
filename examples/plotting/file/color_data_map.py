import numpy as np

from bokeh.io import show
from bokeh.models.sources import ColumnDataSource
from bokeh.models.mappers import LinearColorMapper, LogColorMapper
from bokeh.palettes import Viridis3
from bokeh.plotting import figure

x = np.random.random(2500) * 10
y = np.random.normal(size=2500) * 2 + 5
source = ColumnDataSource(dict(x=x, y1=y, y2=y - 10))

log_mapper = LogColorMapper(palette=Viridis3)
lin_mapper = LinearColorMapper(palette=Viridis3)

p = figure()
opts = dict(x='x', line_color=None, source=source)
p.circle(y='y1', fill_color={'field': 'x', 'transform': log_mapper}, legend="Log mapper", **opts)
p.triangle(y='y2', fill_color={'field': 'x', 'transform': lin_mapper}, legend="Lin mapper", **opts)

show(p)
