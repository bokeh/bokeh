# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

def grid_example():
    N = 80

    x = np.linspace(0, 4*np.pi, N)
    y = np.sin(x)


    output_server("grid")
    l = line(x,y, color="#0000FF", tools="pan,wheel_zoom,box_zoom,reset,previewsave",
         title="line")

    N = 9
    x2 = np.linspace(-2, 2, N)
    y2 = x2**2
    sizes = np.linspace(4, 10, N)
    xpts = np.array([-.09, -.12, .0, .12, .09])
    ypts = np.array([-.1, .02, .1, .02, -.1])

    aw = annular_wedge(
        x, y, 10, 20, 0.6, 4.1,
        inner_radius_units="screen", outer_radius_units = "screen",
        color="#8888ee", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="annular_wedge",
        name="glyphs_example")
    bez = bezier(x, y, x+0.2, y, x+0.1, y+0.1, x-0.1, y-0.1,
           color="#8888ee", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="bezier")
    q = quad(x, x-0.5, y, y-0.5,
         color="#8888ee", tools="pan,wheel_zoom,box_zoom,reset,previewsave", title="quad")
    gridplot([[l,aw],[bez,q]])
    return curplot()

if __name__ == "__main__":
    grid_example()
    # open a browser
    show()
