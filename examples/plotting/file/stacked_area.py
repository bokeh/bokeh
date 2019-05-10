import numpy as np
import pandas as pd

from bokeh.plotting import figure, show, output_file
from bokeh.palettes import brewer

N = 20
cats = 10
df = pd.DataFrame(np.random.randint(10, 100, size=(N, cats))).add_prefix('y')

def stacked(df):
    df_top = df.cumsum(axis=1)
    df_bottom = df_top.shift(axis=1).fillna({'y0': 0})[::-1]
    df_stack = pd.concat([df_bottom, df_top], ignore_index=True)
    return df_stack

areas = stacked(df)
colors = brewer['Spectral'][areas.shape[1]]
x2 = np.hstack((df.index[::-1], df.index))

p = figure(x_range=(0, N-1), y_range=(0, 800))
p.grid.minor_grid_line_color = '#eeeeee'

for c, color in zip(areas, colors):
    p.patch(x2, areas[c].values, legend=c,
            color=color, alpha=0.8, line_color=None)

# reverse the legend entries to match the stacked order
p.legend[0].items.reverse()

output_file('stacked_area.html', title='stacked_area.py example')

show(p)
