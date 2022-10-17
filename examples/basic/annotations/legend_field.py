from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show

orange, blue = '#ef8a62', '#67a9cf'

source = ColumnDataSource(dict(
    x=[1, 2, 3, 4, 5, 6],
    y=[2, 1, 2, 1, 2, 1],
    color=[orange, blue, orange, blue, orange, blue],
    label=['hi', 'lo', 'hi', 'lo', 'hi', 'lo'],
))

p = figure(x_range=(0, 7), y_range=(0, 3), height=300, tools='save')

# legend field matches the column in the source
p.circle('x', 'y', radius=0.5, color='color',
         legend_field='label', source=source)

show(p)
