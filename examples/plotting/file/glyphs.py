import numpy as np

from bokeh.io import curdoc, output_file, show
from bokeh.layouts import gridplot
from bokeh.plotting import figure
from bokeh.themes import Theme

N = 9

x = np.linspace(-2, 2, N)
y = x**2
sizes = np.linspace(10, 20, N)

xpts = np.array([-.09, -.12, .0, .12, .09])
ypts = np.array([-.1, .02, .1, .02, -.1])

children = []

p = figure(title="annular_wedge")
p.annular_wedge(x, y, 10, 20, 0.6, 4.1, color="#8888ee",
                inner_radius_units="screen", outer_radius_units="screen")
children.append(p)

p = figure(title="annulus")
p.annulus(x, y, 10, 20, color="#7FC97F",
          inner_radius_units="screen", outer_radius_units = "screen")
children.append(p)

p = figure(title="arc")
p.arc(x, y, 20, 0.6, 4.1, radius_units="screen", color="#BEAED4", line_width=3)
children.append(p)

p = figure(title="bezier")
p.bezier(x, y, x+0.2, y, x+0.1, y+0.1, x-0.1, y-0.1, color="#D95F02", line_width=2)
children.append(p)

p = figure(title="circle")
p.circle(x, y, radius=0.1, color="#3288BD")
children.append(p)

p = figure(title="ellipse")
p.ellipse(x, y, 15, 25, angle=-0.7, color="#1D91C0",
       width_units="screen", height_units="screen")
children.append(p)

p = figure(title="Hbar")
p.hbar(y=x, height=0.5, left=0, right=y, color="#AA9348")
children.append(p)

p = figure(title="line")
p.line(x, y, color="#F46D43")
children.append(p)

p = figure(title="multi_line")
p.multi_line([xpts+xx for xx in x], [ypts+yy for yy in y],
    color="#8073AC", line_width=2)
children.append(p)

p = figure(title="multi_polygons")
p.multi_polygons(
    [[[xpts*2+xx, xpts+xx]] for xx in x],
    [[[ypts*3+yy, ypts+yy]] for yy in y],
    color="#FB9A99")
children.append(p)

p = figure(title="patch")
p.patch(x, y, color="#A6CEE3")
children.append(p)

p = figure(title="patches")
p.patches([xpts+xx for xx in x], [ypts+yy for yy in y], color="#FB9A99")
children.append(p)

p = figure(title="quad")
p.quad(x, x-0.1, y, y-0.1, color="#B3DE69")
children.append(p)

p = figure(title="quadratic")
p.quadratic(x, y, x+0.2, y, x+0.3, y+1.4, color="#4DAF4A", line_width=3)
children.append(p)

p = figure(title="ray")
p.ray(x, y, 45, -0.7, color="#FB8072", line_width=2)
children.append(p)

p = figure(title="rect")
p.rect(x, y, 10, 20, color="#CAB2D6", width_units="screen", height_units="screen")
children.append(p)

p = figure(title="segment")
p.segment(x, y, x-0.1, y-0.1, color="#F4A582", line_width=3)
children.append(p)

p = figure(title="square")
p.square(x, y, size=sizes, color="#74ADD1")
children.append(p)

p = figure(title="Vbar")
p.vbar(x=x, width=0.5, bottom=0, top=y, color="#CAB2D6")
children.append(p)

p = figure(title="wedge")
p.wedge(x, y, 15, 0.6, 4.1, radius_units="screen", color="#B3DE69")
children.append(p)

p = figure(title="Marker: circle_x")
p.scatter(x, y, marker="circle_x", size=sizes, color="#DD1C77", fill_color=None)
children.append(p)

p = figure(title="Marker: triangle")
p.scatter(x, y, marker="triangle", size=sizes, color="#99D594", line_width=2)
children.append(p)

p = figure(title="Marker: circle")
p.scatter(x, y, marker="o", size=sizes, color="#80B1D3", line_width=3)
children.append(p)

p = figure(title="Marker: x")
p.scatter(x, y, marker="x", size=sizes, color="#B3DE69", line_width=3)
children.append(p)

p = figure(title="Marker: cross")
p.scatter(x, y, marker="cross", size=sizes, color="#E6550D", line_width=2)
children.append(p)

p = figure(title="Marker: dash")
p.scatter(x, y, marker="dash", angle=-0.7, size=sizes, color="#E6550D")
children.append(p)

p = figure(title="Marker: diamond")
p.scatter(x, y, marker="diamond", size=sizes, color="#1C9099", line_width=2)
children.append(p)

p = figure(title="hex")
p.scatter(x, y, marker="hex", size=sizes, color="#99D594")
children.append(p)

p = figure(title="Marker: inverted_triangle")
p.scatter(x, y, marker="inverted_triangle", size=sizes, color="#DE2D26")
children.append(p)

p = figure(title="Marker: square_x")
p.scatter(x, y, marker="square_x", size=sizes, color="#FDAE6B",
    fill_color=None, line_width=2)
children.append(p)

p = figure(title="Marker: asterisk")
p.scatter(x, y, marker="asterisk", size=sizes, color="#F0027F", line_width=2)
children.append(p)

p = figure(title="Marker: square_cross")
p.scatter(x, y, marker="square_cross", size=sizes, color="#7FC97F",
    fill_color=None, line_width=2)
children.append(p)

p = figure(title="Marker: diamond_cross")
p.scatter(x, y, marker="diamond_cross", size=sizes, color="#386CB0",
    fill_color=None, line_width=2)
children.append(p)

p = figure(title="Marker: circle_cross")
p.scatter(x, y, marker="circle_cross", size=sizes, color="#FB8072",
    fill_color=None, line_width=2)
children.append(p)

# simplify theme by turning off axes and gridlines
curdoc().theme = Theme(json={
    "attrs": {
        "Axis": {
            "visible": False
            },
        "Grid": {
            "visible": False
            }
        }
    })

output_file("glyphs.html", title="glyphs.py example")

show(gridplot(children, ncols=4, plot_width=200, plot_height=200))  # open a browser
