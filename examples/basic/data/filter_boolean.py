from bokeh.layouts import gridplot
from bokeh.models import BooleanFilter, CDSView, ColumnDataSource
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 4, 5]))

bools = [True if y_val > 2 else False for y_val in source.data['y']]
view = CDSView(filter=BooleanFilter(bools))

TOOLS = "box_select,hover,reset"

p1 = figure(height=300, width=300, tools=TOOLS)
p1.scatter(x="x", y="y", size=10, hover_color="red", source=source)

p2 = figure(height=300, width=300, tools=TOOLS,
            x_range=p1.x_range, y_range=p1.y_range)
p2.scatter(x="x", y="y", size=10, hover_color="red", source=source, view=view)

show(gridplot([[p1, p2]]))
