''' A grouped bar chart using plain Python lists. This example demonstrates
creating a ``FactorRange`` with nested categories.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.vbar, bokeh.models.sources.ColumnDataSource, bokeh.models.ranges.FactorRange
    :refs: :ref:`ug_basic_bars_grouped_nested`
    :keywords: bars, categorical, grouped

'''
fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
years = ['2015', '2016', '2017']

data = {'fruits' : fruits,
        '2015'   : [2, 1, 4, 3, 2, 4],
        '2016'   : [5, 3, 3, 2, 4, 6],
        '2017'   : [3, 2, 4, 4, 5, 3]}

# Define group colors for each fruit
fruit_colors = Turbo[6]

# Create a list of tuples for x values
x = [ (fruit, year) for fruit in fruits for year in years ]

# Create a list of counts for each fruit and year
counts = []
for i in range(len(fruits)):
    fruit_counts = [data[year][i] for year in years]
    counts += fruit_counts

# Create a list of group colors for each fruit
group_colors = []
for color in fruit_colors:
    group_colors += [color] * len(years)

source = ColumnDataSource(data=dict(x=x, counts=counts, group_colors=group_colors))

p = figure(x_range=FactorRange(*x), height=350, title="Fruit Counts by Year",
           toolbar_location=None, tools="")

p.vbar(x='x', top='counts', width=0.9, source=source, line_color='white', fill_color='group_colors')

p.y_range.start = 0
p.x_range.range_padding = 0.1
p.xaxis.major_label_orientation = 1
p.xgrid.grid_line_color = None

show(p)
