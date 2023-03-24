''' A bar chart based on simple Python lists of data. This example demonstrates
automatic colormapping of nested categorical factors.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.vbar, bokeh.transform.factor_cmap
    :refs: :ref:`ug_basic_bars_filled_colors`
    :keywords: bar, colormap, vbar

'''
from bokeh.models import ColumnDataSource, FactorRange
from bokeh.palettes import MediumContrast3
from bokeh.plotting import figure, show
from bokeh.transform import factor_cmap

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
years = ['2015', '2016', '2017']

data = {'fruits' : fruits,
        '2015'   : [2, 1, 4, 3, 2, 4],
        '2016'   : [5, 3, 3, 2, 4, 6],
        '2017'   : [3, 2, 4, 4, 5, 3]}

# this creates [ ("Apples", "2015"), ("Apples", "2016"), ("Apples", "2017"), ("Pears", "2015), ... ]
x = [ (fruit, year) for fruit in fruits for year in years ]
counts = sum(zip(data['2015'], data['2016'], data['2017']), ()) # like an hstack

source = ColumnDataSource(data=dict(x=x, counts=counts))

p = figure(x_range=FactorRange(*x), height=350, title="Fruit Counts by Year",
           toolbar_location=None, tools="",output_backend="svg")

p.vbar(x='x', top='counts', width=0.9, source=source, line_color="white",
       fill_color=factor_cmap('x', palette=MediumContrast3, factors=years, start=1, end=2))

p.y_range.start = 0
p.x_range.range_padding = 0.1
p.xaxis.major_label_orientation = 1
p.xgrid.grid_line_color = None

show(p)
