import numpy as np
from bokeh.plotting import *
from bokeh.objects import PanTool
N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("line.html", title="line.py example")

pantool = PanTool(dimensions=["width", "height"])
line(x,y, color="#0000FF", tools=['wheel_zoom','box_zoom', pantool],
     name="line_example")

show()
