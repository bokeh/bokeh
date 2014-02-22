
import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("legend.html", title="legend.py example")

hold()

scatter(x, y, 
    tools="pan,wheel_zoom,box_zoom,reset,previewsave", 
    legend="sin(x)"
)
scatter(x, 2*y, 
    color="orange", tools="pan,wheel_zoom,box_zoom,reset,previewsave", 
    legend="2*sin(x)"
)
scatter(x, 3*y, 
    color="green", tools="pan,wheel_zoom,box_zoom,reset,previewsave", 
    legend="3*sin(x)"
)

figure()

scatter(x, y, tools="pan,wheel_zoom,box_zoom,reset,previewsave,select", legend="sin(x)",
        name="legend_example")
line(x, y, tools="pan,wheel_zoom,box_zoom,reset,previewsave,select", legend="sin(x)")

line(x, 2*y, line_dash="4 4", line_color="orange", line_width=2, legend="2*sin(x)")

scatter(x, 3*y, fill_color=None, line_color="green", legend="3*sin(x)")
line(x, 3*y, fill_color=None, line_color="green", legend="3*sin(x)")

show()  # open a browser

