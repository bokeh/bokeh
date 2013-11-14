# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

N = 9

x = np.linspace(-2, 2, N)
y = x**2
sizes = np.linspace(4, 10, N)

xpts = np.array([-.09, -.12, .0, .12, .09])
ypts = np.array([-.1, .02, .1, .02, -.1])

output_server("glyph.py examples")


annular_wedge(x, y, 10, 20, 0.6, 4.1,
              inner_radius_units="screen", outer_radius_units = "screen",
              color="#8888ee", tools="", title="annular_wedge")

annulus(x, y, 10, 20, inner_radius_units="screen", outer_radius_units = "screen",
        color="#7FC97F", tools="", title="annulus")

arc(x, y, 20, 0.6, 4.1, radius_units="screen", color="#BEAED4", tools="", title="arc", line_width=3)

bezier(x, y, x+0.2, y, x+0.1, y+0.1, x-0.1, y-0.1,color="#D95F02", tools="", title="bezier", line_width=2)

circle(x, y, radius=0.1, radius_units="data", color="#3288BD", tools="", title="circle")

line(x, y, color="#F46D43", tools="", title="line")

multi_line([xpts+xx for xx in x], [ypts+yy for yy in y], 
           color="#8073AC", tools="", title="multi_line", line_width=2)

oval(x, y, 15, 25, angle=-0.7, 
     width_units="screen", height_units="screen",
     color="#1D91C0", tools="", title="oval")

patch(x, y, color="#A6CEE3", tools="", title="patch")

patches([xpts+xx for xx in x], [ypts+yy for yy in y], color="#FB9A99", tools="", title="patches")

quad(x, x-0.1, y, y-0.1, color="#B3DE69", tools="", title="quad")

quadratic(x, y, x+0.2, y, x+0.1, y+0.1, color="#4DAF4A", tools="", title="quadratic", line_width=3)

ray(x, y, 45, -0.7, color="#FB8072", tools="", title="ray", line_width=2)

rect(x, y, 10, 20, -0.7, 
     width_units="screen", height_units="screen",
     color="#CAB2D6", tools="", title="rect")

segment(x, y, x-0.1, y-0.1, color="#F4A582", tools="", title="segment", line_width=3)

square(x, y, size=dict(field="sizes", units="screen"), color="#74ADD1",
       source=ColumnDataSource({"sizes": sizes}),
       tools="", title="square")

wedge(x, y, 15, 0.6, 4.1, 
      radius_units="screen",
      color="#B3DE69", tools="", title="wedge",)

scatter(x, y, type="circle_x", size=dict(field="sizes", units="screen"), color="#DD1C77", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}),
       tools="", title="circle_x")

scatter(x, y, type="triangle", size=dict(field="sizes", units="screen"), color="#99D594",
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="triangle")

scatter(x, y, type="o", size=dict(field="sizes", units="screen"), color="#80B1D3",
       source=ColumnDataSource({"sizes": sizes}), line_width=3,
       tools="", title="circle")

scatter(x, y, type="cross", size=dict(field="sizes", units="screen"), color="#E6550D", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="cross")

scatter(x, y, type="diamond", size=dict(field="sizes", units="screen"), color="#1C9099",
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="diamond")

scatter(x, y, type="invtriangle", size=dict(field="sizes", units="screen"), color="#DE2D26",
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="invtriangle")

scatter(x, y, type="square_x", size=dict(field="sizes", units="screen"), color="#FDAE6B", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="square_x")

scatter(x, y, type="asterisk", size=dict(field="sizes", units="screen"), color="#F0027F", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="asterisk")

scatter(x, y, type="square_cross", size=dict(field="sizes", units="screen"), color="#7FC97F", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="square_cross")

scatter(x, y, type="diamond_cross", size=dict(field="sizes", units="screen"), color="#386CB0", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="diamond_cross")

scatter(x, y, type="circle_cross", size=dict(field="sizes", units="screen"), color="#FB8072", fill_color=None,
       source=ColumnDataSource({"sizes": sizes}), line_width=2,
       tools="", title="circle_cross")

show()
