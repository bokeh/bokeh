from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource, CDSView, IndexFilter
from bokeh.plotting import figure, show

source = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 4, 5]))
view = CDSView(source=source, filters=[IndexFilter([0, 2, 4])])

tools = ["box_select", "hover", "reset"]
p = figure(plot_height=300, plot_width=300, tools=tools)
p.circle(x="x", y="y", size=10, hover_color="red", source=source)

p_filtered = figure(plot_height=300, plot_width=300, tools=tools)
p_filtered.circle(x="x", y="y", size=10, hover_color="red", source=source, view=view)

show(gridplot([[p, p_filtered]]))
