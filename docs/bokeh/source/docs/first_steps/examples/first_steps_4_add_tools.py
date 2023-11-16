from bokeh.models import BoxZoomTool, PanTool, ResetTool
from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [4, 5, 5, 7, 2]

# create a plot
p = figure(
    title="Modifying tools example",
    tools=[BoxZoomTool(), ResetTool()],
    sizing_mode="stretch_width",
    max_width=500,
    height=250,
)

# add an additional pan tool
# only vertical panning is allowed
p.add_tools(PanTool(dimensions="width"))

# add a renderer
p.scatter(x, y, size=10)

# show the results
show(p)
