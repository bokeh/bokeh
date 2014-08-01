# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *


N = 9

x = np.linspace(-2, 2, N)
y = x**2
sizes = np.linspace(10, 20, N)

xpts = np.array([-.09, -.12, .0, .12, .09])
ypts = np.array([-.1, .02, .1, .02, -.1])

output_file("glyphs.html", title="glyphs.py example")


annular_wedge(x, y, 10, 20, 0.6, 4.1,
              inner_radius_units="screen", outer_radius_units = "screen",
              color="#8888ee", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="annular_wedge")

annulus(x, y, 10, 20, inner_radius_units="screen", outer_radius_units = "screen",
        color="#7FC97F", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="annulus")

arc(x, y, 20, 0.6, 4.1, radius_units="screen", color="#BEAED4", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="arc", line_width=3)

bezier(x, y, x+0.2, y, x+0.1, y+0.1, x-0.1, y-0.1,color="#D95F02", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="bezier", line_width=2)

circle(x, y, radius=0.1, radius_units="data", color="#3288BD", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="circle")

line(x, y, color="#F46D43", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="line")

multi_line([xpts+xx for xx in x], [ypts+yy for yy in y],
           color="#8073AC", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="multi_line", line_width=2)

oval(x, y, 15, 25, angle=-0.7,
     width_units="screen", height_units="screen",
     color="#1D91C0", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="oval")

patch(x, y, color="#A6CEE3", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="patch")

patches([xpts+xx for xx in x], [ypts+yy for yy in y], color="#FB9A99", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="patches")

quad(x, x-0.1, y, y-0.1, color="#B3DE69", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="quad")

quadratic(x, y, x+0.2, y, x+0.1, y+0.1, color="#4DAF4A", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="quadratic", line_width=3)

ray(x, y, 45, -0.7, color="#FB8072", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="ray", line_width=2)

rect(x, y, 10, 20,
     width_units="screen", height_units="screen",
     color="#CAB2D6", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="rect")

segment(x, y, x-0.1, y-0.1, color="#F4A582", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="segment", line_width=3)

square(x, y, size=sizes, color="#74ADD1",
       tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="square")

wedge(x, y, 15, 0.6, 4.1,
      radius_units="screen",
      color="#B3DE69", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="wedge",)

scatter(x, y, marker="circle_x", size=sizes, color="#DD1C77", fill_color=None,
       tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="circle_x")

scatter(x, y, marker="triangle", size=sizes, color="#99D594",
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="triangle")

scatter(x, y, marker="o", size=sizes, color="#80B1D3",
       line_width=3, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="circle")

scatter(x, y, marker="cross", size=sizes, color="#E6550D", fill_color=None,
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="cross")

scatter(x, y, marker="diamond", size=sizes, color="#1C9099",
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="diamond")

scatter(x, y, marker="inverted_triangle", size=sizes, color="#DE2D26",
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="inverted_triangle")

scatter(x, y, marker="square_x", size=sizes, color="#FDAE6B", fill_color=None,
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="square_x")

scatter(x, y, marker="asterisk", size=sizes, color="#F0027F", fill_color=None,
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="asterisk")

scatter(x, y, marker="square_cross", size=sizes, color="#7FC97F", fill_color=None,
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="square_cross")

scatter(x, y, marker="diamond_cross", size=sizes, color="#386CB0", fill_color=None,
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="diamond_cross")

scatter(x, y, marker="circle_cross", size=sizes, color="#FB8072", fill_color=None,
       line_width=2, tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="circle_cross")

show()  # open a browser
