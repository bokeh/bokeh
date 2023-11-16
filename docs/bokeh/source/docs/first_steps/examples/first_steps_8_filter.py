from bokeh.layouts import gridplot
from bokeh.models import CDSView, ColumnDataSource, IndexFilter
from bokeh.plotting import figure, show

# create ColumnDataSource from a dict
source = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 4, 5]))

# create a view using an IndexFilter with the index positions [0, 2, 4]
view = CDSView(filter=IndexFilter([0, 2, 4]))

# setup tools
tools = ["box_select", "hover", "reset"]

# create a first plot with all data in the ColumnDataSource
p = figure(height=300, width=300, tools=tools)
p.scatter(x="x", y="y", size=10, hover_color="red", source=source)

# create a second plot with a subset of ColumnDataSource, based on view
p_filtered = figure(height=300, width=300, tools=tools)
p_filtered.scatter(x="x", y="y", size=10, hover_color="red", source=source, view=view)

# show both plots next to each other in a gridplot layout
show(gridplot([[p, p_filtered]]))
