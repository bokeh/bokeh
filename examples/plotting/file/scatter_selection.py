
import numpy as np
from bokeh.plotting import *
import bokeh
N = 100

x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)

output_file("scatter_selection.html", title="scatter_selection.py example")

l = scatter(x,y, color="red", tools="pan,zoom,resize, select", title="select on mouseup")
select_tool = [t for t in l.tools if isinstance(t, bokeh.objects.BoxSelectTool)][0]
select_tool.select_every_mousemove = False

l = scatter(x,y, type="square", color="green", tools="pan,zoom,resize, select",
            title='select on mousemove')
select_tool = [t for t in l.tools if isinstance(t, bokeh.objects.BoxSelectTool)][0]

scatter(x,y, color="#FF00FF", tools="pan,zoom,resize, select", 
        nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)

select_tool.select_every_mousemove = True

scatter(x,y, type="square", color="blue", tools="pan,zoom,resize",
        name="scatter_selection_example")

show()  # open a browser
