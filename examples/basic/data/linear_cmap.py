''' Color hexagonal bins by the number of points in each bin.

.. bokeh-example-metadata::
    :title: Color hex bins by count
    :keywords: hexbin, count, color mapping, linear_cmap
    :apis: bokeh.plotting.figure.hex_tile
    :gallery: A hexplot of a Gaussian distribution with the hex elements colormapped by a linear colormapper.
'''

from numpy.random import standard_normal

from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap
from bokeh.util.hex import hexbin

x = standard_normal(50000)
y = standard_normal(50000)

bins = hexbin(x, y, 0.1)

p = figure(tools="", match_aspect=True, background_fill_color='#440154')
p.grids.visible = False

p.hex_tile(q="q", r="r", size=0.1, line_color=None, source=bins,
           fill_color=linear_cmap('counts', 'Viridis256', 0, max(bins.counts)))

show(p)
