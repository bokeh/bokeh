import numpy as np
from bokeh.plotting import figure, save
from bokeh.layouts import gridplot

N = 10000

x = np.random.normal(0, np.pi, N)
y = np.sin(x) + np.random.normal(0, 0.2, N)

p1 = figure(output_backend="webgl")
p1.circle(x, y, fill_alpha=0.1)

p2 = figure(output_backend="webgl")
p2.circle(x, y, fill_alpha=0.1)

x = np.linspace(0, 10*np.pi, N)
y = np.cos(x) + np.sin(2*x+1.25) + np.random.normal(0, 0.001, (N, ))

p3 = figure(output_backend="webgl")
p3.line(x, y, color="#22aa22", line_width=3)

p4 = figure(output_backend="webgl")
p4.line(x, y, color="#22aa22", line_width=3)

save(gridplot([[p1, p2], [p3, p4]]))
