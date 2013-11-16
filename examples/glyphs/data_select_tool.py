# The plot server must be running

import numpy as np
from bokeh.plotting import *
import bokeh.plotting as plotting
from bokeh.objects import (ColumnDataSource, DataRangeBoxSelectTool,
                           BoxSelectionOverlay)

x = np.linspace(-7, 7, 100)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
output_server("data select example")

source = ColumnDataSource()
source.add(x, name='x')
source.add(y, name='y')
source.add(2*y, name='2y')
source.add(3*y, name='3y')

hold()
scatter('x','y', source=source, tools="pan,zoom,resize")
scatter('x','2y', source=source, tools="pan,zoom,resize")
scatter('x','3y', source=source, color="green", tools="pan,zoom,resize")

plot = curplot()

tool = DataRangeBoxSelectTool(plot=plot)
overlay = BoxSelectionOverlay(tool=tool)
plot.renderers.append(overlay)
plot.tools.append(tool)
plot._dirty = True
sess = plotting._config["session"]
sess.load_all_callbacks()

sess.add(tool)
sess.add(overlay)
tool.on_change("xselect", plot, "dummy")
tool.on_change("yselect", plot, "dummy")

sess.store_all()
sess.store_all_callbacks()

#execute this yourself, you should see the dummy callback fire if anything has changed
sess.load_obj(sess.get_ref(tool))






