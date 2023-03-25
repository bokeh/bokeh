''' A stacked area plot using data from a pandas DataFrame.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.varea_stack
    :refs: :ref:`ug_basic_areas_directed`
    :keywords: area, pandas, stacked

'''
import numpy as np
import pandas as pd

from bokeh.palettes import tol
from bokeh.plotting import figure, show

N = 10
df = pd.DataFrame(np.random.randint(10, 100, size=(15, N))).add_prefix('y')

p = figure(x_range=(0, len(df)-1), y_range=(0, 800))
p.grid.minor_grid_line_color = '#eeeeee'

names = [f"y{i}" for i in range(N)]
p.varea_stack(stackers=names, x='index', color=tol['Sunset'][N], legend_label=names, source=df)

p.legend.orientation = "horizontal"
p.legend.background_fill_color = "#fafafa"

show(p)
