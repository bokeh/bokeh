from bokeh.models.tools import BoxSelectTool
from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [1, 4, 2, 4, 5]

# create a new plot, with no tools
p = figure(tools="", width=400, height=400)

# Adding a tool, with custom tooltip
p.add_tools(BoxSelectTool(description="My tool"))

# add a line renderer with legend and line thickness
p.line(x, y, legend_label="Temp.", line_width=2)

# show the results
show(p)
