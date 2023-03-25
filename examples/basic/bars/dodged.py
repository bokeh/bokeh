''' A bar chart based on plain Python lists. This example demonstrates creating
a using a ``dodge`` transform to "group" the bars.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.vbar, bokeh.transform.dodge, bokeh.models.ColumnDataSource
    :refs: :ref:`ug_basic_bars_grouped`, :ref:`ug_basic_bars_grouped_dodged`
    :keywords: bars, categorical, dodged, grouped

'''
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.transform import dodge

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
years = ['2015', '2016', '2017']

data = {'fruits' : fruits,
        '2015'   : [2, 1, 4, 3, 2, 4],
        '2016'   : [5, 3, 3, 2, 4, 6],
        '2017'   : [3, 2, 4, 4, 5, 3]}

source = ColumnDataSource(data=data)

p = figure(x_range=fruits, y_range=(0, 10), title="Fruit Counts by Year",
           height=350, toolbar_location=None, tools="")

p.vbar(x=dodge('fruits', -0.25, range=p.x_range), top='2015', source=source,
       width=0.2, color="#c9d9d3", legend_label="2015")

p.vbar(x=dodge('fruits',  0.0,  range=p.x_range), top='2016', source=source,
       width=0.2, color="#718dbf", legend_label="2016")

p.vbar(x=dodge('fruits',  0.25, range=p.x_range), top='2017', source=source,
       width=0.2, color="#e84d60", legend_label="2017")

p.x_range.range_padding = 0.1
p.xgrid.grid_line_color = None
p.legend.location = "top_left"
p.legend.orientation = "horizontal"

show(p)
