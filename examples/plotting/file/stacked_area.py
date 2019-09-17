import numpy as np
import pandas as pd

from bokeh.core.properties import value
from bokeh.plotting import figure, show, output_file
from bokeh.palettes import brewer

output_file('stacked_area.html')

N = 10
df = pd.DataFrame(np.random.randint(10, 100, size=(15, N))).add_prefix('y')

p = figure(x_range=(0, len(df)-1), y_range=(0, 800))
p.grid.minor_grid_line_color = '#eeeeee'

names = ["y%d" % i for i in range(N)]
p.varea_stack(stackers=names, x='index', color=brewer['Spectral'][N], legend=[value(x) for x in names], source=df)

# reverse the legend entries to match the stacked order
p.legend[0].items.reverse()

show(p)
