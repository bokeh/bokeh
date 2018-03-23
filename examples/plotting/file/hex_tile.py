import numpy as np

from bokeh.io import output_file, show
from bokeh.models import ColumnDataSource
from bokeh.palettes import Viridis256
from bokeh.plotting import figure
from bokeh.transform import linear_cmap
from bokeh.util.hex import hexbin

orientation = "flattop"
size=0.1

n = 50000
x = 2 + np.random.standard_normal(n)
y = 2 + 5*np.random.standard_normal(n)

# import
bins = hexbin(x, y, size, orientation, 5)

p = figure(title="Manual hex bin for 50000 points", match_aspect=True, aspect_scale=5,
           tools="tap,wheel_zoom,box_select", background_fill_color='#440154')
p.grid.visible = False

source = ColumnDataSource(data=dict(q=bins.q, r=bins.r, c=bins.counts))

p.hex_tile(q="q", r="r", size=size, fill_color=linear_cmap('c', Viridis256, 0, max(bins.counts)),
           line_color=None, source=source, orientation=orientation, aspect_scale=5)

output_file("hex_tile.html")

show(p)
