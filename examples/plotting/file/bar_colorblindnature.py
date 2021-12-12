''' A simple bar chart using plain Python lists. This example demonstrates
setting bar colors from a ``ColumnDataSource`` using palette `ColorblindNature`.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.Figure.vbar, bokeh.models.sources.ColumnDataSource
    :refs: :ref:`userguide_categorical` > :ref:`userguide_categorical_bars` > :ref:`userguide_categorical_bars_filled_colors`
    :keywords: bars, categorical

'''
from bokeh.models import ColumnDataSource
from bokeh.palettes import ColorblindNature6
from bokeh.plotting import figure, show

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
counts = [5, 3, 4, 2, 4, 6]

source = ColumnDataSource(data=dict(fruits=fruits, counts=counts, color=ColorblindNature6))

p = figure(x_range=fruits, y_range=(0,9), height=350, title="Fruit Counts",
           toolbar_location=None, tools="")

p.vbar(x='fruits', top='counts', width=0.9, color='color', legend_field="fruits", source=source)

p.xgrid.grid_line_color = None
p.legend.orientation = "horizontal"
p.legend.location = "top_center"

show(p)
