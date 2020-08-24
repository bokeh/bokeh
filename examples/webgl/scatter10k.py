import numpy as np

from bokeh.plotting import figure, output_file, show

output_file("scatter10k.html", title="scatter 10k points")

N = 10000

x = np.random.normal(0, np.pi, N)
y = np.sin(x) + np.random.normal(0, 0.2, N)

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p = figure(tools=TOOLS, output_backend="webgl")
p.circle(x, y, alpha=0.1, nonselection_alpha=0.001)

show(p)
