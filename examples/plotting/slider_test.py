# The plot server must be running

import numpy as np
from bokeh.plotting import *
import bokeh.plotting as plotting
from bokeh.objects import ColumnDataSource, DataSlider
x = np.linspace(-7, 7, 100)
y = np.sin(x)

# Go to http://localhost:5006/bokeh to view this plot
output_server("slider example")
hold(True)
source = ColumnDataSource()
source.add(x, name='x')
source.add(y, name='y')
source.add(2*y, name='2y')
source.add(3*y, name='3y')
scatter('x','y', source=source, tools="pan,zoom,resize")
scatter('x','2y', source=source, tools="pan,zoom,resize")
plot = scatter('x','3y', source=source, color="green", tools="pan,zoom,resize")
slider1 = DataSlider(plot=plot, data_source=source, field='x')
slider2 = DataSlider(plot=plot, data_source=source, field='y')
plot.tools.append(slider1)
plot.tools.append(slider2)
plot._dirty = True
sess = plotting._config["session"]
sess.add(slider1)
sess.add(slider2)
plotting._config["session"].store_all()






