''' A `ridgeline plot`_ using the `Perceptions of Probability`_ dataset.

This example demonstrates the uses of categorical offsets to position categorical
values explicitly, which in this case allows for makeshift sub-plots. This is
because the real data is not available for presentation, so for example it's not
possible to show ridge line values in hover tool.

A better alternative is to use sub-coordinates as demonstrated in example
``examples/plotting/ridgeplot_subcoordinates.py``.

This chart shows the distribution of responses to the prompt *What probability
would you assign to the phrase "Highly likely"*.

.. bokeh-example-metadata::
    :sampledata: perceptions
    :apis: bokeh.plotting.figure.patch, bokeh.models.sources.ColumnDataSource
    :refs: :ref:`ug_topics_categorical_offsets`
    :keywords: alpha, categorical, palette, patch, ridgeline

.. _ridgeline plot: https://www.data-to-viz.com/graph/ridgeline.html
.. _Perceptions of Probability: https://github.com/zonination/perceptions

'''
import colorcet as cc
from numpy import linspace
from scipy.stats import gaussian_kde

from bokeh.models import ColumnDataSource, FixedTicker, PrintfTickFormatter
from bokeh.plotting import figure, show
from bokeh.sampledata.perceptions import probly


def ridge(category, data, scale=20):
    return list(zip([category]*len(data), scale*data))

cats = list(reversed(probly.keys()))

palette = [cc.rainbow[i*15] for i in range(17)]

x = linspace(-20, 110, 500)

source = ColumnDataSource(data=dict(x=x))

p = figure(y_range=cats, width=900, x_range=(-5, 105), toolbar_location=None)

for i, cat in enumerate(reversed(cats)):
    pdf = gaussian_kde(probly[cat])
    y = ridge(cat, pdf(x))
    source.add(y, cat)
    p.patch('x', cat, color=palette[i], alpha=0.6, line_color="black", source=source)

p.outline_line_color = None
p.background_fill_color = "#efefef"

p.xaxis.ticker = FixedTicker(ticks=list(range(0, 101, 10)))
p.xaxis.formatter = PrintfTickFormatter(format="%d%%")

p.ygrid.grid_line_color = None
p.xgrid.grid_line_color = "#dddddd"
p.xgrid.ticker = p.xaxis.ticker

p.axis.minor_tick_line_color = None
p.axis.major_tick_line_color = None
p.axis.axis_line_color = None

p.y_range.range_padding = 0.12

show(p)
