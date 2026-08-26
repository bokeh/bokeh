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

tops = df.cumsum(axis=1)
bottoms = tops.shift(axis=1).fillna({'y0': 0})
colors = brewer['Spectral'][tops.shape[1]]

p = figure(x_range=(0, N-1), y_range=(0, 800))
p.grid.minor_grid_line_color = '#eeeeee'

for color, column in zip(colors, tops):
    p.varea(df.index, bottoms[column], tops[column],
            color=color, alpha=0.8)

show(p)
