''' Plot Apple closing prices against a datetime axis.

.. bokeh-example-metadata::
    :sampledata: stocks
    :title: Datetime axis
    :keywords: datetime axis, basic plotting, axes
    :apis: bokeh.plotting.figure.line
'''

import pandas as pd

from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import AAPL

df = pd.DataFrame(AAPL)
df['date'] = pd.to_datetime(df['date'])

# create a new plot with a datetime axis type
p = figure(width=800, height=250, x_axis_type="datetime")

p.line(df['date'], df['close'], color='navy', alpha=0.5)

show(p)
