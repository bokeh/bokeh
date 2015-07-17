import numpy as np

from bokeh.plotting import figure, show, output_file, vplot
from bokeh.models import BoxSelectTool

N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("scatter_selection.html", title="scatter_selection.py example")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p1 = figure(title="selection on mouseup", tools=TOOLS)

p1.circle(x, y, color="red", size=6)
select_tool = p1.select(dict(type=BoxSelectTool))
select_tool.select_every_mousemove = False

p2 = figure(title="selection on mousemove", tools=TOOLS)
p2.square(x, y, color="green", size=6)

select_tool = p2.select(dict(type=BoxSelectTool))
select_tool.select_every_mousemove = True

p3 = figure(title="default highlight", tools=TOOLS)
p3.circle(x,y, color="#FF00FF", size=6)

p4 = figure(title="custom highlight", tools=TOOLS)
p4.square(x,y, color="blue", size=6,
    nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)

show(vplot(p1,p2,p3,p4))  # open a browser
