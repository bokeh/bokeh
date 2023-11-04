''' A categorical plot showing the correlations in mineral content for 214 samples of glass fragments
obtained during forensic work.

The dataset contains seven variables measuring the amounts of magnesium (Mg),
calcium (Ca), iron (Fe), potassium (K), sodium (Na), aluminum (Al), and barium (Ba) found in each glass fragment.
The colored circles represent the correlations between pairs of these variables.
The magnitude of each correlation is encoded in the size of the circles.

.. bokeh-example-metadata::
    :sampledata: forensic_glass
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_categorical_scatters`
    :keywords: scatter, correlogram

'''

from itertools import combinations

import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource, FixedTicker
from bokeh.plotting import figure, show
from bokeh.sampledata.forensic_glass import data as df
from bokeh.transform import linear_cmap

elements = ("Mg", "Ca", "Fe", "K", "Na", "Al", "Ba")
pairs = list(combinations(elements, 2))

correlations = []
for x, y in pairs:
    matrix = np.corrcoef(df[x], df[y])
    correlations.append(matrix[0, 1])

x, y = list(zip(*pairs))

new_df = pd.DataFrame({
    "oxide_1": x,
    "oxide_2": y,
    "correlation": correlations,
    "dot_size": [(1+ 10 * abs(corr)) * 10 for corr in correlations],
})

x_range = new_df["oxide_1"].unique()
y_range = list(new_df["oxide_2"].unique())

source = ColumnDataSource(new_df)

p = figure(x_axis_location="above", toolbar_location=None, x_range=x_range, y_range=y_range, background_fill_color="#fafafa")

c = p.scatter(x="oxide_1", y="oxide_2", size="dot_size", source=source, fill_color=linear_cmap("correlation", "RdYlGn9", -0.5, 0.5), line_color="#202020")

color_bar = c.construct_color_bar(
    location=(200, 0),
    ticker=FixedTicker(ticks=[-0.5, 0.0, 0.5]),
    title="correlation",
    major_tick_line_color=None,
    width=150,
    height=20,
)

p.add_layout(color_bar, "below")

p.axis.major_tick_line_color = None
p.axis.major_tick_out = 0
p.axis.axis_line_color = None
p.grid.grid_line_color = None
p.outline_line_color = None

show(p)
