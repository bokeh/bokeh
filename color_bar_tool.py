from bokeh.core.properties import Instance
from bokeh.models.tools import Drag, DEFAULT_BOX_OVERLAY
from bokeh.models import ColumnDataSource, ColorBar, LinearColorMapper, BoxAnnotation
from bokeh.palettes import Viridis256
from bokeh.plotting import figure, show

import numpy as np

DEFAULT_COLOR_BAR = lambda: ColorBar(location=(0,0), color_mapper=LinearColorMapper(palette='Spectral9', low=0, high=10))

class ColorBarTool(Drag):
    __implementation__ = open('color_bar_tool.coffee').read()

    color_bar = Instance(ColorBar, default=DEFAULT_COLOR_BAR, help='color bar instance')
    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_OVERLAY, help='box annotation instance')


color_mapper = LinearColorMapper(palette=Viridis256, low=0, high=100)

x = np.random.random(2500) * 100
y = np.random.normal(size=2500) * 2 + 5
source = ColumnDataSource(dict(x=x, y=y))

plot = figure(toolbar_location="above", tools='reset')
plot.circle(
    x='x', y='y',
    fill_color={'field': 'x', 'transform': color_mapper}, line_color=None,
    source=source)

tool = ColorBarTool()
tool.color_bar.color_mapper = color_mapper

plot.add_tools(tool)

show(plot)
