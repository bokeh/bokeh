''' Display scatter point coordinates and data fields on hover.

.. bokeh-example-metadata::
    :title: Hover tooltips
    :keywords: hover tooltips, interaction, tools
    :apis: bokeh.models.ColumnDataSource, bokeh.plotting.figure.scatter
'''

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(
    x=[1, 2, 3, 4, 5],
    y=[2, 5, 8, 2, 7],
    desc=['A', 'b', 'C', 'd', 'E'],
))

TOOLTIPS = [
    ("index", "$index"),
    ("(x,y)", "($x, $y)"),
    ("desc", "@desc"),
]

p = figure(width=400, height=400, tooltips=TOOLTIPS,
           title="Mouse over the dots")

p.scatter('x', 'y', size=20, source=source)

show(p)
