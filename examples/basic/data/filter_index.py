from bokeh.layouts import gridplot
from bokeh.models import CDSView, ColumnDataSource, IndexFilter
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 4, 5]))
view = CDSView(filter=IndexFilter([0, 2, 4]))

TOOLS = "box_select,hover,reset"

p1 = figure(height=300, width=300, tools=TOOLS)
p1.scatter(x="x", y="y", size=10, hover_color="red", source=source)

p2 = figure(height=300, width=300, tools=TOOLS)
p2.scatter(x="x", y="y", size=10, hover_color="red", source=source, view=view)

show(gridplot([[p1, p2]]))
