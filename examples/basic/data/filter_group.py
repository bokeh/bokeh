from bokeh.layouts import gridplot
from bokeh.models import CDSView, ColumnDataSource, GroupFilter
from bokeh.plotting import figure, show
from bokeh.sampledata.iris import flowers

source = ColumnDataSource(flowers)
view = CDSView(filter=GroupFilter(column_name="species", group="versicolor"))

opts = {"height": 300, "width": 300, "tools": "box_select,reset,help"}

p1 = figure(title="Full data set", **opts)
p1.circle(x="petal_length", y="petal_width", source=source, color="black")

p2 = figure(title="Setosa only", x_range=p1.x_range, y_range=p1.y_range, **opts)
p2.circle(x="petal_length", y="petal_width", source=source, view=view, color="red")

show(gridplot([[p1, p2]]))
