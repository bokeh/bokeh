''' A line plot using stock price data. Sometimes it is desirable to be able to
hide glyphs by clicking on an entry in a ``Legend``. This can be accomplished
by setting the legend ``click_policy`` property to ``"hide"``.

.. bokeh-example-metadata::
    :sampledata: stocks
    :apis: bokeh.palettes.Spectral4
    :refs: :ref:`ug_interaction_legends`
    :keywords: line, interactions, legend, hide, glyphs

'''

import pandas as pd

from bokeh.palettes import Spectral4
from bokeh.plotting import figure, show
from bokeh.sampledata.stocks import AAPL, GOOG, IBM, MSFT

p = figure(width=800, height=250, x_axis_type='datetime')
p.title.text = 'Click on legend entries to hide lines'

for data, name, color in zip([AAPL, IBM, MSFT, GOOG], ["AAPL", "IBM", "MSFT", "GOOG"], Spectral4):
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    p.line(df['date'], df['close'], line_width=2, color=color, alpha=0.8, legend_label=name)

p.legend.location = 'top_left'
p.legend.click_policy = 'hide'
p.y_range.only_visible = True

show(p)
