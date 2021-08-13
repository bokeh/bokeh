''' A categorical bar chart illustrating the use of `factor_cmap <factor_cmap>`_ to associate colors from a palette
with categories.

.. rubric:: Details

:Bokeh APIs: :func:`~bokeh.plotting.Figure.vbar`, :func:`~bokeh.transform.factor_cmap`
:More info: :ref:`userguide_categorical_bars`
:Keywords: bar, vbar, legend, factor_cmap, palette

'''
from bokeh.io import show
from bokeh.models import ColumnDataSource
from bokeh.palettes import Spectral6
from bokeh.plotting import figure
from bokeh.transform import factor_cmap

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
counts = [5, 3, 4, 2, 4, 6]

source = ColumnDataSource(data=dict(fruits=fruits, counts=counts))

p = figure(x_range=fruits, height=350, toolbar_location=None, title="Fruit Counts")
p.vbar(x='fruits', top='counts', width=0.9, source=source, legend_field="fruits",
       line_color='white', fill_color=factor_cmap('fruits', palette=Spectral6, factors=fruits))

p.xgrid.grid_line_color = None
p.y_range.start = 0
p.y_range.end = 9
p.legend.orientation = "horizontal"
p.legend.location = "top_center"

show(p)
