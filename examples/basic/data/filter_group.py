from bokeh.layouts import gridplot
from bokeh.models import CDSView, ColumnDataSource, GroupFilter
from bokeh.plotting import figure, show
from bokeh.sampledata.penguins import data

source = ColumnDataSource(data)
view = CDSView(filter=GroupFilter(column_name="species", group="Adelie"))

TOOLS = "box_select,reset,help"

p1 = figure(title="Full data set", height=300, width=300, tools=TOOLS)
p1.scatter(x="bill_length_mm", y="bill_depth_mm", source=source)

p2 = figure(title="Adelie only", height=300, width=300,
            tools=TOOLS, x_range=p1.x_range, y_range=p1.y_range)
p2.scatter(x="bill_length_mm", y="bill_depth_mm", size=6,
           source=source, view=view, color='darkorange')

show(gridplot([[p1, p2]]))
