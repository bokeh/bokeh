import numpy as np

from bokeh.plotting import figure, show

N = 10000
x = np.linspace(0, 10*np.pi, N)
y = np.cos(x) + np.sin(2*x+1.25) + np.random.normal(0, 0.001, (N, ))

p = figure(title="A line consisting of 10k points", output_backend="webgl")

p.line(x, y, color="#22aa22", line_width=3)

show(p)
