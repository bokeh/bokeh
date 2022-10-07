''' A manual hexbin plot using randomly selected points. This chart shows
50,000 points points from a normal distribution binned into hexagonal tiles
using the ``hexbin`` utility function. The tiles are colormapped linearly
according to their bin counts.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.hex_tile, bokeh.transform.linear_cmap, bokeh.util.hex.hexbin
    :refs: :ref:`ug_topics_hex`
    :keywords: hex, hex_tile, colormap

'''
import numpy as np

from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap
from bokeh.util.hex import hexbin

n = 50000
x = np.random.standard_normal(n)
y = np.random.standard_normal(n)

bins = hexbin(x, y, 0.1)

p = figure(title="Manual hex bin for 50000 points", tools="wheel_zoom,pan,reset",
           match_aspect=True, background_fill_color='#440154')
p.grid.visible = False

p.hex_tile(q="q", r="r", size=0.1, line_color=None, source=bins,
           fill_color=linear_cmap('counts', 'Viridis256', 0, max(bins.counts)))

show(p)
