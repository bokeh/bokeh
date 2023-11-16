from bokeh.io import show
from bokeh.palettes import Turbo256
from bokeh.plotting import figure
from bokeh.transform import linear_cmap

# generate data
x = list(range(-32, 33))
y = [i**2 for i in x]

# create linear color mapper
mapper = linear_cmap(field_name="y", palette=Turbo256, low=min(y), high=max(y))

# create plot
p = figure(width=500, height=250)

# create circle renderer with color mapper
p.scatter(x, y, color=mapper, size=10)

show(p)
