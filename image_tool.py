import numpy as np
from matplotlib.mlab import bivariate_normal

from bokeh.core.properties import Instance

from bokeh.models import ColumnDataSource, ColorBar, LinearColorMapper, BoxAnnotation, ColorMapper
from bokeh.models import Range1d, LinearColorMapper, LogColorMapper, LogTicker
from bokeh.models.tools import Drag, DEFAULT_BOX_OVERLAY
from bokeh.plotting import figure, show
from bokeh.palettes import Viridis256

### custom tool definition

DEFAULT_COLOR_BAR = lambda: ColorBar(location=(0,0), color_mapper=LinearColorMapper(palette='Spectral9', low=0, high=10))

class ColorBarTool(Drag):
    __implementation__ = open('color_bar_tool.coffee').read()

    color_bar = Instance(ColorBar, default=DEFAULT_COLOR_BAR, help='color bar instance')
    overlay = Instance(BoxAnnotation, default=DEFAULT_BOX_OVERLAY, help='box annotation instance')
    image_color_mapper = Instance(ColorMapper, help='color mapper for image')

class BandedColorBar(ColorBar):
    __implementation__ = open('banded_color_bar.coffee').read()

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

image_color_mapper = LogColorMapper(palette=Viridis256, low=1, high=1e7)
color_bar_mapper = LogColorMapper(palette=Viridis256, low=1, high=1e7)

plot = figure(x_range=Range1d(0,1), y_range=Range1d(0,1),
              tools='', toolbar_location='above')
plot.image(image=[image], color_mapper=image_color_mapper,
           dh=[1.0], dw=[1.0], x=[0], y=[0])

color_bar = BandedColorBar(color_mapper=color_bar_mapper, ticker=LogTicker(), label_standoff=12, location=(0,0))
color_bar_tool = ColorBarTool(color_bar=color_bar, image_color_mapper=image_color_mapper)

plot.add_tools(color_bar_tool)

show(plot)
