import numpy as np
import pandas as pd

from bokeh.plotting import figure, show, output_file
from bokeh.palettes import brewer

N = 20
categories = ['y' + str(x) for x in range(10)]
data = {}
data['x'] = np.arange(N)
for cat in categories:
    data[cat] = np.random.randint(10, 100, size=N)

df = pd.DataFrame(data)
df = df.set_index(['x'])

def stacked(df, categories):
    areas = dict()
    last = np.zeros(len(df[categories[0]]))
    for cat in categories:
        next = last + df[cat]
        areas[cat] = np.hstack((last[::-1], next))
        last = next
    return areas

areas = stacked(df, categories)

colors = brewer["Spectral"][len(areas)]

x2 = np.hstack((data['x'][::-1], data['x']))

p = figure(x_range=(0, 19), y_range=(0, 800))
p.grid.minor_grid_line_color = '#eeeeee'

p.patches([x2] * len(areas), [areas[cat] for cat in categories],
          color=colors, alpha=0.8, line_color=None)

output_file("brewer.html", title="brewer.py example")

show(p)
