import numpy as np
from bokeh.plotting import *

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("scatter.html", title="scatter.py example")

figure(tools="pan,wheel_zoom,box_zoom,reset,previewsave,select")

scatter(x,y, color="#FF00FF", nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)
scatter(x,y, color="red")
scatter(x,y, marker="square", color="green")
scatter(x,y, marker="square", color="blue", name="scatter_example")

show()
