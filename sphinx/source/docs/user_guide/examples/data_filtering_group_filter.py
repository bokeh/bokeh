from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource, CDSView, GroupFilter
from bokeh.plotting import figure, show
from bokeh.sampledata.iris import flowers

source = ColumnDataSource(flowers)
view1 = CDSView(source=source, filters=[GroupFilter(column_name='species', group='versicolor')])

plot_size_and_tools = {'plot_height': 300, 'plot_width': 300,
                        'tools':['box_select', 'reset', 'help']}

p1 = figure(title="Full data set", **plot_size_and_tools)
p1.circle(x='petal_length', y='petal_width', source=source, color='black')

p2 = figure(title="Setosa only", x_range=p1.x_range, y_range=p1.y_range, **plot_size_and_tools)
p2.circle(x='petal_length', y='petal_width', source=source, view=view1, color='red')

show(gridplot([[p1, p2]]))
