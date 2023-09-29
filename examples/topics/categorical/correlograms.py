''' A categorical plot showing the correlations in mineral content for 214 samples of glass fragments
obtained during forensic work. The dataset contains seven variables measuring the amounts of magnesium (Mg),
calcium (Ca), iron (Fe), potassium (K), sodium (Na), aluminum (Al), and barium (Ba) found in each glass fragment.
The colored circles represent the correlations between pairs of these variables.
The magnitude of each correlation is encoded in the size of the circles.

.. bokeh-example-metadata::
    :sampledata: forensic_glass
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_categorical_scatters`
    :keywords: scatter, correlogram

'''
import pandas as pd
import numpy as np
from bokeh.plotting import figure, show
from bokeh.transform import transform
from bokeh.models import ColorBar, LinearColorMapper, FixedTicker, ColumnDataSource
from bokeh.sampledata.forensic_glass import data

df = data.copy()

pairs = ["Mg-Ba", "Mg-Al", "Mg-Na", "Mg-K", "Mg-Fe", "Mg-Ca", "Ca-Ba", 
         "Ca-Al", "Ca-Na", "Ca-K", "Ca-Fe", "Fe-Ba", "Fe-Al", "Fe-Na",
         "Fe-K", "K-Ba", "K-Al", "K-Na", "Na-Ba", "Na-Al", "Al-Ba"]

pair_split = [pair.split("-") for pair in pairs]
correlations = []
for pair in pair_split:
    matrix = np.corrcoef(df[f"{pair[0]}"], df[f"{pair[1]}"])
    correlation = matrix[0, 1]
    correlations.append(correlation)

new_df = pd.DataFrame({"oxide_1": [x[0] for x in pair_split], "oxide_2": [x[1] for x in pair_split],
                       "correlation": correlations, "dot_size": [abs(corr) * 120 for corr in correlations]})

x_range = new_df["oxide_1"].unique()
y_range = list(reversed(new_df["oxide_2"].unique()))

source = ColumnDataSource(new_df)

colors = ["#8B4513", "#D8AF85", "#CD853F", "#E2CAB7", "#DEB887",
          "#A4D2D2", "#8ABDBD", "#ADD8E6", "#009999", "#188A8A"]

mapper = LinearColorMapper(palette=colors, low=-0.5, high=0.5)

p = figure(x_axis_location="above", toolbar_location=None, x_range=x_range, y_range=y_range)

p.scatter(x="oxide_1", y="oxide_2", size="dot_size", source=source, fill_color=transform("correlation", mapper), line_color=None)

color_bar = ColorBar(color_mapper=mapper, location=(200, 0), ticker=FixedTicker(ticks=[-0.5, 0.0, 0.5]), title="correlation",
                     title_text_align="center", title_text_font_style="normal", major_tick_line_color=None, width=150, height=20)

p.add_layout(color_bar, "below")

p.xaxis.major_tick_line_color = None
p.xaxis.major_tick_out = 0
p.xaxis.axis_line_color = None

p.yaxis.major_tick_out = 0
p.yaxis.major_tick_line_color = None
p.yaxis.axis_line_color = None

p.grid.grid_line_color = None
p.outline_line_color = None

show(p)
