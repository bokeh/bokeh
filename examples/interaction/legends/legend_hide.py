''' The legend_hide feature is used to hide corresponding lines on a plot.
This examples demonstrates an interactive line chart for stock prices over
time which allows the user to click on the legend entries to hide or show
the corresponding lines.

.. bokeh-example-metadata::
    :sampledata: stocks
    :apis: bokeh.plotting.figure.line, bokeh.palettes
    :refs: :ref:`ug_basic_annotations_legends`
    :keywords: line, time series, legend
'''
import pandas as pd

from bokeh.palettes import Spectral4
from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import AAPL, GOOG, IBM, MSFT

p = figure(width=800, height=250, x_axis_type="datetime")
p.title.text = 'Click on legend entries to hide the corresponding lines'

for data, name, color in zip([AAPL, IBM, MSFT, GOOG], ["AAPL", "IBM", "MSFT", "GOOG"], Spectral4):
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    p.line(df['date'], df['close'], line_width=2, color=color, alpha=0.8, legend_label=name)

p.legend.location = "top_left"
p.legend.click_policy="hide"

show(p)
