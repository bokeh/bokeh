''' A plot of randomly stacked area styled using the Brewer palette
from the `brewer` dictionary.

.. bokeh-example-metadata::
    :apis: bokeh.palettes.brewer
    :refs: :ref:`ug_styling_visual_palettes`
    :keywords: brewer, palettes, patches

'''

import numpy as np
import pandas as pd

from bokeh.palettes import brewer
from bokeh.plotting import figure, show

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

p.patches([x2] * areas.shape[1], [areas[c].values for c in areas],
          color=colors, alpha=0.8, line_color=None)

show(p)
