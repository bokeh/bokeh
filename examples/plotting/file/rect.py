
import numpy as np
from bokeh.plotting import *

N = 80

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("rect.html", title="rect.py example")

# fixed width and height
rect(x, y, 4, 2, color="#ff0000", tools="pan,zoom,save,resize")

# variable width and height
rect(
    x, y, 0.01*np.exp(1+0.1*x), 0.2*abs(np.cos(x)),
    fill="green", line_color="none", fill_alpha=0.6, tools="pan,zoom,resize"
)

# angle
rect(x, y, 1, 8, color="#4444aa", angle=-np.pi/6, tools="pan,zoom,resize")

# open a browser
show()
