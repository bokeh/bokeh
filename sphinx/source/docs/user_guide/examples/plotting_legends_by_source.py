from bokeh.io import show
from bokeh.models import ColumnDataSource
from bokeh.palettes import RdBu3
from bokeh.plotting import figure

c1 = RdBu3[2] # red
c2 = RdBu3[0] # blue
source = ColumnDataSource(dict(
    x=[1, 2, 3, 4, 5, 6],
    y=[2, 1, 2, 1, 2, 1],
    color=[c1, c2, c1, c2, c1, c2],
    label=['hi', 'lo', 'hi', 'lo', 'hi', 'lo']
))

p = figure(x_range=(0, 7), y_range=(0, 3), height=300, tools='save')

# Note legend field matches the column in `source`
p.circle( x='x', y='y', radius=0.5, color='color', legend='label', source=source)
show(p)
