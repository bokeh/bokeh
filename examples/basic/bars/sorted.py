''' A bar chart based on simple Python lists of data. The example below
sorts the fruit categories in ascending order based on counts and
rearranges the bars accordingly.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.vbar
    :refs: :ref:`ug_basic_bars_sorted`
    :keywords: bars, categorical, sort

'''

from bokeh.plotting import figure, show

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
counts = [5, 3, 4, 2, 4, 6]

# sorting the bars means sorting the range factors
sorted_fruits = sorted(fruits, key=lambda x: counts[fruits.index(x)])

p = figure(x_range=sorted_fruits, height=350, title="Fruit Counts",
           toolbar_location=None, tools="")

p.vbar(x=fruits, top=counts, width=0.9)

p.xgrid.grid_line_color = None
p.y_range.start = 0

show(p)
