# Example similar to line.py, but demoing special data
# values: masked arrays, nans, and inf

import numpy as np

from bokeh.plotting import figure, output_file, show

x = np.linspace(0, 4*np.pi, 200)
y1 = np.sin(x)
y2 = np.cos(x)

# Set high/low values to infinity
y1[y1>+0.9] = +np.inf
y1[y1<-0.9] = -np.inf

# Set high values to nan and mask the low
y2[y2>0.9] = np.nan
y2 = np.ma.masked_array(y2, y2<-0.9)

p = figure(title="lines with missing/inf values")

p.line(x, y1, color="#2222aa", line_width=2)

p.line(x, y2, color="#22aa22", line_width=2)

output_file("line_missing_data.html", title="line_missing_data.py example")

show(p)
