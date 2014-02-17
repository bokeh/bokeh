
import numpy as np
from six.moves import zip
from bokeh.plotting import *
from bokeh.objects import HoverTool


xx, yy = np.meshgrid(xrange(0,101,4), xrange(0,101,4))

x = xx.flatten()
y = yy.flatten()
inds = ["%d" % i for i in np.arange(len(x))]
radii = np.random.random(size=len(x))*0.4 + 1.7
colors = ["#%02x%02x%02x" % (r, g, 150) for r, g in zip(np.floor(50+2*x), np.floor(30+2*y))]

output_file("hover.html", title="hover.py example")

hold()

circle(x, y, radius=radii, radius_units="data",
       fill_color=colors, fill_alpha=0.6,
       line_color=None, title="color_scatter_example",
       tools="pan,wheel_zoom,box_zoom,reset,previewsave,hover")

text(x, y, text=inds, alpha=0.5, text_font_size="5pt", text_baseline="middle", text_align="center", angle=0)

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
