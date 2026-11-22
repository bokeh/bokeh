''' Reuse one x-coordinate row for several lines with different y values.

.. bokeh-example-metadata::
    :title: Shared coordinates
    :keywords: shared, coordinates
    :apis: bokeh.models.ColumnDataSource, bokeh.plotting.figure.multi_line
'''

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.transform import gather

coordinates = ColumnDataSource(dict(x=[[1, 2, 3]]))
lines = ColumnDataSource(dict(x_row=[0, 0], ys=[[4, 5, 6], [7, 8, 9]],
                              colors=["firebrick", "navy"]))
p = figure(title="Lines sharing one coordinate row")
p.multi_line(xs=gather(coordinates, "x", indices="x_row"), ys="ys",
             line_color="colors", source=lines, line_width=3)
show(p)
