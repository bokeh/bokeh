''' Stack horizontal bar segments from separate columns of a data source.

.. bokeh-example-metadata::
    :title: Hbar stack
    :keywords: hbar stack, basic plotting, bars
    :apis: bokeh.models.ColumnDataSource, bokeh.plotting.figure.hbar_stack
'''

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(
    y=[1, 2, 3, 4, 5],
    x1=[1, 2, 4, 3, 4],
    x2=[1, 4, 2, 2, 3],
))
p = figure(width=400, height=400)

p.hbar_stack(['x1', 'x2'], y='y', height=0.8, color=("grey", "lightgrey"), source=source)

show(p)
