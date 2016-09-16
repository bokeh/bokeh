import numpy as np
from matplotlib.mlab import bivariate_normal

from bokeh.core.properties import Instance

from bokeh.models import ColumnDataSource, ColorBar, LinearColorMapper, BoxAnnotation
from bokeh.models import Range1d, LinearColorMapper, LogColorMapper, LogTicker
from bokeh.models.tools import Drag, DEFAULT_BOX_OVERLAY
from bokeh.plotting import figure, show

### custom tool definition

DEFAULT_COLOR_BAR = lambda: ColorBar(location=(0,0), color_mapper=LinearColorMapper(palette='Spectral9', low=0, high=10))

class ColorBarTool(Drag):
    __implementation__ = open('color_bar_tool.coffee').read()

    color_bar = Instance(ColorBar, default=DEFAULT_COLOR_BAR, help='color bar instance')
    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_OVERLAY, help='box annotation instance')

### generate an image

N = 100
X, Y = np.mgrid[-3:3:complex(0, N), -2:2:complex(0, N)]

# A low hump with a spike coming out of the top right.  Needs to have
# z/colour axis on a log scale so we see both hump and spike.  linear
# scale only shows the spike.
Z1 = bivariate_normal(X, Y, 0.1, 0.2, 1.0, 1.0) +  \
    0.1 * bivariate_normal(X, Y, 1.0, 1.0, 0.0, 0.0)

image = Z1 * 1e6

### plotting code

color_mapper = LogColorMapper(palette="Viridis256", low=1, high=1e7)

plot = figure(x_range=Range1d(0,1), y_range=Range1d(0,1),
              tools='reset', toolbar_location='above')
plot.image(image=[image], color_mapper=color_mapper,
           dh=[1.0], dw=[1.0], x=[0], y=[0])

color_bar = ColorBar(color_mapper=color_mapper, ticker=LogTicker(), label_standoff=12)
color_bar_tool = ColorBarTool(color_bar=color_bar)

plot.add_tools(color_bar_tool)

show(plot)
