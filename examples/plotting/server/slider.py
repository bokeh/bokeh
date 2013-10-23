# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.objects import ColumnDataSource, DataSlider

x = np.linspace(-7, 7, 100)
y = np.sin(x)

output_server("slider.py example")

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
slider_x = DataSlider(plot=plot, data_source=source, field='x')
slider_y = DataSlider(plot=plot, data_source=source, field='y')

plot.tools.append(slider_x)
plot.tools.append(slider_y)

# This ugly line will be fixed and made unnecessary in a future release
plot._dirty = True

sess = session()
sess.add(slider_x)
sess.add(slider_y)
sess.store_all()

show()
