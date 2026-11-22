''' Stack line series vertically from columns of a shared data source.

.. bokeh-example-metadata::
    :title: Vline stack
    :keywords: vline, stack
    :apis: bokeh.models.ColumnDataSource, bokeh.plotting.figure.vline_stack
'''

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(
    x=[1, 2, 3, 4, 5],
    y1=[1, 2, 4, 3, 4],
    y2=[1, 4, 2, 2, 3],
))
p = figure(width=400, height=400)

p.vline_stack(['y1', 'y2'], x='x', source=source)

show(p)
