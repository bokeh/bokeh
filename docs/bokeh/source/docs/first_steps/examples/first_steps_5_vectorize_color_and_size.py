import numpy as np

from bokeh.plotting import figure, show

# generate some data
N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100

# generate radii and colors based on data
radii = y / 100 * 2
colors = [f"#{255:02x}{int((value * 255) / 100):02x}{255:02x}" for value in y]

# create a new plot with a specific size
p = figure(
    title="Vectorized colors and radii example",
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add circle renderer
p.circle(
    x,
    y,
    radius=radii,
    fill_color=colors,
    fill_alpha=0.6,
    line_color="lightgrey",
)

# show the results
show(p)
