# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from collections import OrderedDict
import time

import numpy as np

from bokeh.charts import Line, curdoc, cursession, output_server, show
from bokeh.models import GlyphRenderer

N = 80
x = np.linspace(0, 4*np.pi, N)

xyvalues = OrderedDict(sin=np.sin(x), cos=np.cos(x))

output_server("line_animate")

chart = Line(xyvalues, title="Lines", ylabel='measures')

curdoc().add(chart)

show(chart)

renderer = chart.select(dict(type=GlyphRenderer))
ds = renderer[0].data_source

while True:
    for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
        for k, values in xyvalues.items():
            if k != 'x':
                ds.data['y_%s'%k] = values * i
        cursession().store_objects(ds)
        time.sleep(0.05)
