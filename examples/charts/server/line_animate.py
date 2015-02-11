# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import time
from collections import OrderedDict
import numpy as np

from bokeh.plotting import *
from bokeh.charts import Line
from bokeh.models import GlyphRenderer

N = 80
x = np.linspace(0, 4*np.pi, N)
output_server("line_animate")
xyvalues = OrderedDict(sin=np.sin(x), cos=np.cos(x))

chart = Line(xyvalues, title="Lines", ylabel='measures')
curdoc().add(chart)
show(chart)
_session = cursession()

# it's also possible to use the following with the server='line_animate' arg on chart
# chart.show()
# _session = chart.session

renderer = chart.select(dict(type=GlyphRenderer))
ds = renderer[0].data_source

while True:
    for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
        for k, values in xyvalues.items():
            if k != 'x':
                ds.data['y_%s'%k] = values * i
        _session.store_objects(ds)
        time.sleep(0.05)
