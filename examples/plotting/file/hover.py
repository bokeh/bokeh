
import numpy as np
from six.moves import zip
from bokeh.plotting import *
from bokeh.objects import HoverTool


xx, yy = np.meshgrid(xrange(0,101,4), xrange(0,101,4))

x = xx.flatten()
y = yy.flatten()
radii = np.random.random(size=len(x))*0.4 + 1.7
colors = ["#%02x%02x%02x" % (r, g, 150) for r, g in zip(np.floor(50+2*x), np.floor(30+2*y))]

output_file("hover.html", title="hover.py example")

circle(x, y, radius=radii, radius_units="data",
       fill_color=colors, fill_alpha=0.6,
       line_color=None, Name="color_scatter_example",
       tools="pan,wheel_zoom,box_zoom,reset,previewsave,hover")

hover = [t for t in curplot().tools if isinstance(t, HoverTool)][0]
hover.tooltips.update({
    "index": "$index",
    "fill_color": "$color[hex,swatch]:fill_color",
    "radius": "@radius",
    "data (x, y)": "(@x, @y)",
    "cursor (x, y)": "($x, $y)",
    "canvas (x, y)": "($sx, $sy)",
})

show()  # open a browser
