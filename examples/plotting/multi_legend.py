'''This example shows a graph with multiple legend. This can be used to depict
a comparision between two datasets. This graph uses stocks dataset.

.. bokeh-example-metadata::
    :sampledata: stocks
    :apis: bokeh.plotting.figure.multi_line, bokeh.plotting.figure.add_layout
    :keywords: legend, stocks

'''
import numpy as np

from bokeh.models import Legend, LegendItem
from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import AAPL, MSFT


def datetime(x):
    return np.array(x, dtype=np.datetime64)

p = figure(background_fill_color="#fafafa", x_axis_type="datetime",
           width=800, height=350)

r = p.multi_line([datetime(AAPL['date']), datetime(MSFT['date'])],
                 [AAPL['adj_close'], MSFT['adj_close']],
                 color=["navy", "crimson"], line_width=2, alpha=0.6)

legend = Legend(items=[
    LegendItem(label="AAPL", renderers=[r], index=0),
    LegendItem(label="MSFT", renderers=[r], index=1),
], location="top_left")
p.add_layout(legend)

show(p)
