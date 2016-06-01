import numpy as np

from bokeh.plotting import figure, gridplot, show, output_file

N = 100
x = np.linspace(0, 4*np.pi, N)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(x) + np.cos(x)

s1 = figure(plot_width=350, plot_height=350)

s1.circle(x, y1, color="navy", size=8, alpha=0.5)

# linked panning is expressed by sharing ranges between plots.
s2 = figure(plot_width=350, plot_height=350,
            x_range=s1.x_range, y_range=s1.y_range)

s2.circle(x, y2, color="firebrick", size=8, alpha=0.5)

# it is possible to share just one range or the other
s3 = figure(plot_width=350, plot_height=350, x_range=s1.x_range)

s3.circle(x, y3, color="olive", size=8, alpha=0.5)

p = gridplot([[s1,s2, s3]])

output_file("linked_panning.html", title="linked_panning.py example")

show(p)
